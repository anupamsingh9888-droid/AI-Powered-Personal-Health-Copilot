import { GoogleGenAI } from '@google/genai'
import {
  saveStructuredMedicalData,
  type StructuredDiagnosis,
  type StructuredLabTest,
  type StructuredMedication,
  type UncertainField,
} from '../db/queries/structuredMedicalData.ts'

export interface OcrPipelineInput {
  documentId: number
  userId: string
  rawOcrText: string
  ocrConfidence?: number | null // Overall or average OCR confidence (0 to 1 or 0 to 100)
  documentType?: string
  originalFilename?: string
}

export interface PipelineExecutionResult {
  success: boolean
  documentId: number
  structuredDataId?: number
  rawOcrText: string
  ocrConfidence: number | null
  patientName: string | null
  documentDate: string | null
  doctorName: string | null
  diagnosesMentioned: StructuredDiagnosis[]
  medications: StructuredMedication[]
  laboratoryTests: StructuredLabTest[]
  uncertainFields: UncertainField[]
  requiresReview: boolean
  clinicalDisclaimer: string
  structuredJson: Record<string, any>
  error?: string
}

const SYSTEM_INSTRUCTION = `You are a clinical data extraction engine that processes OCR text from medical documents (prescriptions, laboratory reports, diagnostic reports, and discharge summaries).

CRITICAL EXTRACTION CONSTRAINTS:
1. STRICT FACTUAL EXTRACTION: Extract information ONLY when it is explicitly and actually present in the provided OCR text.
2. NEVER INVENT OR GUESS: Never invent, extrapolate, hallucinate, or fill in missing fields. If a field or value is not explicitly present in the text, you MUST return null or an empty array.
3. NEVER PRESENT AS CONFIRMED DIAGNOSES: Extracted conditions or impressions are mentions found in a document, NEVER confirmed clinical diagnoses. Always mark "isConfirmedDiagnosis: false".
4. FLAG UNCERTAIN FIELDS: Any value that is ambiguous, smudged, missing units, or has doubtful handwriting MUST be marked with "requiresReview: true" and added to "uncertainFields".
5. PRESERVE ORIGINALITY: Do not alter recorded medication doses, test numbers, or date formats.

EXTRACT THE FOLLOWING DATA FIELDS:
- patientName: string or null
- documentDate: string or null
- doctorName: string or null
- diagnosesMentioned: array of objects:
  {
    diagnosis: string (name of mentioned disease, symptom, or impression),
    context: string or null (e.g., "Provisional impression", "Assessment", "Chief complaint"),
    confidenceScore: number between 0.0 and 1.0,
    requiresReview: boolean,
    isConfirmedDiagnosis: false,
    note: "Mentioned in document; not a clinical confirmation"
  }
- medications: array of objects:
  {
    name: string,
    dosage: string or null (e.g. "500 mg", "10 mg"),
    frequency: string or null (e.g. "Twice daily", "1-0-1", "OD"),
    duration: string or null (e.g. "5 days", "1 month"),
    instructions: string or null (e.g. "After meals"),
    confidenceScore: number between 0.0 and 1.0,
    requiresReview: boolean,
    reviewReason: string or null
  }
- laboratoryTests: array of objects:
  {
    testName: string (e.g. "Hemoglobin", "Fasting Blood Sugar"),
    value: string or null (e.g. "10.8", "95"),
    unit: string or null (e.g. "g/dL", "mg/dL"),
    referenceRange: string or null (e.g. "12.0 - 15.5"),
    abnormalFlag: "HIGH" | "LOW" | "NORMAL" | "ABNORMAL" | null,
    confidenceScore: number between 0.0 and 1.0,
    requiresReview: boolean,
    reviewReason: string or null
  }
- uncertainFields: array of objects:
  {
    field: string,
    extractedValue: string or null,
    reason: string,
    confidenceScore: number
  }
- requiresReview: boolean (true if any uncertainFields exist or any confidenceScore < 0.80)
- clinicalDisclaimer: "Not a confirmed medical diagnosis. Information extracted from document text for informational reference only. Consult your doctor."

Return ONLY a clean JSON object conforming to this exact schema.`

/**
 * Deterministic local fallback extractor when GEMINI_API_KEY is not configured
 * or network fails. Enforces all zero-invention and null-for-missing rules.
 */
function localRuleBasedExtractor(rawText: string, ocrConfidence?: number | null) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
  const fullText = rawText

  // 1. Patient Name (look for "Patient Name:", "Pt:", "Name:")
  let patientName: string | null = null
  const patientMatch = fullText.match(/(?:Patient\s*Name|Patient|Pt\.?|Name)\s*[:\-]\s*([A-Za-z\s.]+?)(?:[\r\n,;]|Age|Sex|Date|$)/i)
  if (patientMatch && patientMatch[1]) {
    const val = patientMatch[1].trim()
    if (val.length > 2 && val.length < 50 && !/^(male|female|years|yrs|dr\b)/i.test(val)) {
      patientName = val
    }
  }

  // 2. Doctor Name (look for "Dr.", "Doctor:", "Physician:")
  let doctorName: string | null = null
  const docMatch = fullText.match(/(?:Dr\.?|Doctor|Physician)\s*([A-Za-z\s.]+?)(?:[\r\n,;]|MD|MBBS|MS|Reg|$)/i)
  if (docMatch && docMatch[1]) {
    const val = docMatch[1].trim()
    if (val.length > 2 && val.length < 50) {
      doctorName = `Dr. ${val.replace(/^Dr\.?\s*/i, '')}`
    }
  }

  // 3. Document Date
  let documentDate: string | null = null
  const dateMatch = fullText.match(/(?:Date|Dated)\s*[:\-]\s*(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.](?:\d{2,4})|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i)
  if (dateMatch && dateMatch[1]) {
    documentDate = dateMatch[1].trim()
  }

  // 4. Diagnoses mentioned
  const diagnosesMentioned: StructuredDiagnosis[] = []
  const diagMatch = fullText.match(/(?:Diagnosis|Impression|Assessment|Provisional\s*Diagnosis|Dx)\s*[:\-]\s*([^\r\n]+)/i)
  if (diagMatch && diagMatch[1]) {
    const rawDiag = diagMatch[1].trim()
    if (rawDiag.length > 2) {
      diagnosesMentioned.push({
        diagnosis: rawDiag,
        context: 'Impression mentioned in document',
        confidenceScore: 0.85,
        requiresReview: true,
        isConfirmedDiagnosis: false,
        note: 'Mentioned in document; not a clinical confirmation',
      })
    }
  }

  // 5. Medications
  const medications: StructuredMedication[] = []
  const uncertainFields: UncertainField[] = []

  // Match lines with Rx or medication patterns
  const medRegex = /(?:Tab\.?|Cap\.?|Syr\.?|Inj\.?|Rx)\s+([A-Za-z0-9\s-]+?)(?:\s+(\d+\s*(?:mg|ml|mcg|g|iu)))?(?:\s+([0-9]-[0-9]-[0-9]|once\s*daily|twice\s*daily|thrice\s*daily|OD|BD|TDS|HS|QDS))?(?:\s+[xX*]\s*(\d+\s*(?:days|weeks|months)))?/gi
  let match: RegExpExecArray | null
  while ((match = medRegex.exec(fullText)) !== null) {
    const medName = match[1]?.trim()
    if (medName && medName.length > 2) {
      const dosage = match[2]?.trim() || null
      const freq = match[3]?.trim() || null
      const dur = match[4]?.trim() || null

      const isHandwritingUncertain = /\[unclear\]|\?|\.\.\./i.test(medName)
      const conf = isHandwritingUncertain ? 0.45 : dosage ? 0.92 : 0.75

      medications.push({
        name: isHandwritingUncertain ? '[Unclear handwriting]' : medName,
        dosage,
        frequency: freq,
        duration: dur,
        instructions: null,
        confidenceScore: conf,
        requiresReview: conf < 0.80 || isHandwritingUncertain,
        reviewReason: isHandwritingUncertain ? 'Unclear handwritten characters' : null,
      })

      if (isHandwritingUncertain) {
        uncertainFields.push({
          field: `medication_${medName}`,
          extractedValue: medName,
          reason: 'Ambiguous handwriting requiring user verification',
          confidenceScore: conf,
        })
      }
    }
  }

  // 6. Laboratory tests
  const laboratoryTests: StructuredLabTest[] = []
  const labRegex = /([A-Za-z\s]+?)\s*[:|\t]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z/%]+)?\s*(?:\((?:ref\.?\s*)?([\d.]+\s*-\s*[\d.]+)\))?/gi
  let lMatch: RegExpExecArray | null
  while ((lMatch = labRegex.exec(fullText)) !== null) {
    const testName = lMatch[1]?.trim()
    const testVal = lMatch[2]?.trim()
    const testUnit = lMatch[3]?.trim() || null
    const refRange = lMatch[4]?.trim() || null

    if (
      testName &&
      testVal &&
      !/^(page|total|date|age|phone|sl|no)/i.test(testName) &&
      testName.length > 2 &&
      testName.length < 35
    ) {
      let abnormalFlag: 'HIGH' | 'LOW' | 'NORMAL' | null = null
      if (refRange) {
        const parts = refRange.split('-').map((p) => parseFloat(p.trim()))
        const numVal = parseFloat(testVal)
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(numVal)) {
          if (numVal < parts[0]) abnormalFlag = 'LOW'
          else if (numVal > parts[1]) abnormalFlag = 'HIGH'
          else abnormalFlag = 'NORMAL'
        }
      }

      const conf = testUnit ? 0.95 : 0.78
      laboratoryTests.push({
        testName,
        value: testVal,
        unit: testUnit,
        referenceRange: refRange,
        abnormalFlag,
        confidenceScore: conf,
        requiresReview: conf < 0.80,
        reviewReason: testUnit ? null : 'Missing unit in OCR',
      })

      if (!testUnit) {
        uncertainFields.push({
          field: `lab_${testName}_unit`,
          extractedValue: testVal,
          reason: 'Laboratory observation extracted without explicit measurement unit',
          confidenceScore: conf,
        })
      }
    }
  }

  const normalizedOcrConf =
    ocrConfidence !== undefined && ocrConfidence !== null
      ? ocrConfidence > 1
        ? ocrConfidence / 100
        : ocrConfidence
      : 0.88

  const requiresReview =
    uncertainFields.length > 0 ||
    medications.some((m) => m.requiresReview) ||
    laboratoryTests.some((t) => t.requiresReview) ||
    diagnosesMentioned.length > 0

  return {
    patientName,
    documentDate,
    doctorName,
    diagnosesMentioned,
    medications,
    laboratoryTests,
    uncertainFields,
    requiresReview,
    ocrConfidence: normalizedOcrConf,
    clinicalDisclaimer:
      'Not a confirmed medical diagnosis. Information extracted from document text for informational reference only. Consult your doctor.',
  }
}

/**
 * Execute the complete OCR -> Gemini -> Structured JSON -> PostgreSQL Pipeline.
 */
export async function runOcrPipeline(
  input: OcrPipelineInput
): Promise<PipelineExecutionResult> {
  const { documentId, userId, rawOcrText, ocrConfidence } = input

  if (!rawOcrText || rawOcrText.trim().length === 0) {
    throw new Error('Raw OCR text is required to execute the extraction pipeline.')
  }

  let structuredOutput: {
    patientName: string | null
    documentDate: string | null
    doctorName: string | null
    diagnosesMentioned: StructuredDiagnosis[]
    medications: StructuredMedication[]
    laboratoryTests: StructuredLabTest[]
    uncertainFields: UncertainField[]
    requiresReview: boolean
    clinicalDisclaimer: string
  }

  const apiKey = process.env.GEMINI_API_KEY
  let usedGemini = false

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({})
      const prompt = `Here is the OCR raw text extracted from a medical document:

--- BEGIN OCR TEXT ---
${rawOcrText}
--- END OCR TEXT ---

Overall OCR Confidence: ${
        ocrConfidence !== undefined && ocrConfidence !== null
          ? `${ocrConfidence}`
          : 'Not specified'
      }

Analyze this text and extract all clinical information following the instructions strictly.
Remember:
- Only extract what is present in the OCR text.
- Missing values must be null or empty list.
- Mark isConfirmedDiagnosis as false for all mentioned diagnoses.
- Flag uncertain fields for review.`

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      })

      const responseText = response.text?.trim()
      if (responseText) {
        const parsed = JSON.parse(responseText)

        // Enforce strict typing, zero invention, and null checks
        structuredOutput = {
          patientName: parsed.patientName || null,
          documentDate: parsed.documentDate || null,
          doctorName: parsed.doctorName || null,
          diagnosesMentioned: Array.isArray(parsed.diagnosesMentioned)
            ? parsed.diagnosesMentioned.map((d: any) => ({
                diagnosis: String(d.diagnosis || ''),
                context: d.context || null,
                confidenceScore:
                  typeof d.confidenceScore === 'number'
                    ? Math.min(Math.max(d.confidenceScore, 0), 1)
                    : 0.8,
                requiresReview: true, // Always require review for safety
                isConfirmedDiagnosis: false,
                note: 'Mentioned in document; not a clinical confirmation',
              }))
            : [],
          medications: Array.isArray(parsed.medications)
            ? parsed.medications.map((m: any) => ({
                name: String(m.name || ''),
                dosage: m.dosage || null,
                frequency: m.frequency || null,
                duration: m.duration || null,
                instructions: m.instructions || null,
                confidenceScore:
                  typeof m.confidenceScore === 'number'
                    ? Math.min(Math.max(m.confidenceScore, 0), 1)
                    : 0.85,
                requiresReview: Boolean(m.requiresReview || (m.confidenceScore && m.confidenceScore < 0.8)),
                reviewReason: m.reviewReason || null,
              }))
            : [],
          laboratoryTests: Array.isArray(parsed.laboratoryTests)
            ? parsed.laboratoryTests.map((t: any) => ({
                testName: String(t.testName || ''),
                value: t.value !== undefined && t.value !== null ? String(t.value) : null,
                unit: t.unit || null,
                referenceRange: t.referenceRange || null,
                abnormalFlag: ['HIGH', 'LOW', 'NORMAL', 'ABNORMAL'].includes(
                  String(t.abnormalFlag).toUpperCase()
                )
                  ? (String(t.abnormalFlag).toUpperCase() as any)
                  : null,
                confidenceScore:
                  typeof t.confidenceScore === 'number'
                    ? Math.min(Math.max(t.confidenceScore, 0), 1)
                    : 0.9,
                requiresReview: Boolean(t.requiresReview || (t.confidenceScore && t.confidenceScore < 0.8)),
                reviewReason: t.reviewReason || null,
              }))
            : [],
          uncertainFields: Array.isArray(parsed.uncertainFields)
            ? parsed.uncertainFields.map((u: any) => ({
                field: String(u.field || ''),
                extractedValue: u.extractedValue !== undefined ? String(u.extractedValue) : null,
                reason: String(u.reason || 'Uncertain OCR text'),
                confidenceScore:
                  typeof u.confidenceScore === 'number' ? u.confidenceScore : 0.5,
              }))
            : [],
          requiresReview: Boolean(
            parsed.requiresReview ||
              (parsed.uncertainFields && parsed.uncertainFields.length > 0) ||
              (parsed.diagnosesMentioned && parsed.diagnosesMentioned.length > 0)
          ),
          clinicalDisclaimer:
            'Not a confirmed medical diagnosis. Information extracted from document text for informational reference only. Consult your doctor.',
        }
        usedGemini = true
      } else {
        throw new Error('Gemini returned empty text response')
      }
    } catch (geminiError) {
      console.warn(
        'Gemini API processing error, switching to rule-based fallback parser:',
        geminiError
      )
      structuredOutput = localRuleBasedExtractor(rawOcrText, ocrConfidence)
    }
  } else {
    // Deterministic fallback when API key not set in environment
    structuredOutput = localRuleBasedExtractor(rawOcrText, ocrConfidence)
  }

  // Normalize OCR confidence score
  const normalizedOcrConf =
    ocrConfidence !== undefined && ocrConfidence !== null
      ? ocrConfidence > 1
        ? ocrConfidence / 100
        : ocrConfidence
      : 0.92

  // Build complete structured JSON payload
  const structuredJsonPayload = {
    pipeline: 'OCR_GEMINI_POSTGRESQL',
    executedAt: new Date().toISOString(),
    usedGeminiEngine: usedGemini,
    documentId,
    patientName: structuredOutput.patientName,
    documentDate: structuredOutput.documentDate,
    doctorName: structuredOutput.doctorName,
    diagnosesMentioned: structuredOutput.diagnosesMentioned,
    medications: structuredOutput.medications,
    laboratoryTests: structuredOutput.laboratoryTests,
    uncertainFields: structuredOutput.uncertainFields,
    requiresReview: structuredOutput.requiresReview,
    disclaimer: structuredOutput.clinicalDisclaimer,
    rawOcrTextPreserved: rawOcrText,
    ocrConfidencePreserved: normalizedOcrConf,
  }

  // Store structured results into PostgreSQL
  const savedRecord = await saveStructuredMedicalData(userId, {
    documentId,
    userId,
    rawOcrText,
    ocrConfidence: normalizedOcrConf,
    patientName: structuredOutput.patientName,
    documentDate: structuredOutput.documentDate,
    doctorName: structuredOutput.doctorName,
    diagnosesMentioned: structuredOutput.diagnosesMentioned,
    medications: structuredOutput.medications,
    laboratoryTests: structuredOutput.laboratoryTests,
    uncertainFields: structuredOutput.uncertainFields,
    requiresReview: structuredOutput.requiresReview,
    reviewStatus: structuredOutput.requiresReview ? 'PENDING_REVIEW' : 'VERIFIED',
    clinicalDisclaimer: structuredOutput.clinicalDisclaimer,
    structuredJson: structuredJsonPayload,
  })

  return {
    success: true,
    documentId,
    structuredDataId: savedRecord.id,
    rawOcrText,
    ocrConfidence: normalizedOcrConf,
    patientName: structuredOutput.patientName,
    documentDate: structuredOutput.documentDate,
    doctorName: structuredOutput.doctorName,
    diagnosesMentioned: structuredOutput.diagnosesMentioned,
    medications: structuredOutput.medications,
    laboratoryTests: structuredOutput.laboratoryTests,
    uncertainFields: structuredOutput.uncertainFields,
    requiresReview: structuredOutput.requiresReview,
    clinicalDisclaimer: structuredOutput.clinicalDisclaimer,
    structuredJson: structuredJsonPayload,
  }
}
