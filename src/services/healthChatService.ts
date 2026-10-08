import { GoogleGenAI } from '@google/genai'
import { getHealthProfile } from '../db/queries/healthProfiles.ts'
import { getMedicalConditions } from '../db/queries/medicalConditions.ts'
import { getMedications } from '../db/queries/medications.ts'
import { getLabReportsWithResults } from '../db/queries/labReports.ts'
import { getSymptoms } from '../db/queries/symptoms.ts'
import { getHealthMetrics } from '../db/queries/healthMetrics.ts'
import { getAllStructuredMedicalData } from '../db/queries/structuredMedicalData.ts'
import {
  createChatSession,
  getChatMessages,
  addChatMessage,
} from '../db/queries/chat.ts'

export interface MessageSourceCitation {
  title: string
  date: string
  kind: 'lab' | 'rx' | 'vitals' | 'device'
  detail?: string
}

export interface HealthChatResponse {
  sessionId: number
  messageId: number
  sender: 'assistant'
  text: string
  shortAnswer: string
  keyMeasurement?: {
    label: string
    value: string
    context?: string
  } | null
  whatThisMeans: string[]
  whatToDoNext: string[]
  sources: MessageSourceCitation[]
  isEmergency: boolean
  triageLevel: 'none' | 'routine' | 'urgent' | 'emergency'
  disclaimer: string
  createdAt: string
}

const CHAT_SYSTEM_INSTRUCTION = `You are HealthLens Copilot, an AI health assistant for personal health management.
You assist patients in understanding their medical records, lab results, medications, and health metrics.

CRITICAL MEDICAL SAFETY & ACCURACY RULES:
1. NEVER INVENT OR HALLUCINATE: Never fabricate medical records, lab values, medications, symptoms, or numbers. If a fact is not in the provided patient records context, explicitly state that you do not see it recorded.
2. DISTINGUISH FACTS FROM INTERPRETATION: Clearly distinguish stored facts from AI interpretation or educational guidance.
3. NO DEFINITIVE DIAGNOSIS: Never claim a definitive clinical diagnosis. Frame explanations as educational possibilities and informational impressions.
4. SAFE NEXT STEPS: Provide general health information, lifestyle habits, and appropriate questions for their doctor.
5. POTENTIALLY URGENT SCENARIOS: If the user mentions urgent symptoms (e.g. chest pain, severe shortness of breath, sudden numbness, fainting, stroke signs, severe hemorrhage), set "isEmergency": true, "triageLevel": "emergency", and calmly recommend urgent professional medical care or local emergency services without unnecessary panic.
6. CITATIONS: Whenever answering based on patient records, cite the specific document or lab report in the "sources" list.

SCHEMA:
Return a JSON object conforming strictly to this format:
{
  "shortAnswer": "Concise 1-2 sentence primary answer to the patient query",
  "keyMeasurement": {
    "label": "Biomarker or metric name (if discussed, else null)",
    "value": "Measured value with unit (or null)",
    "context": "Brief context e.g. Below standard reference range (or null)"
  },
  "whatThisMeans": [
    "Clear, patient-friendly explanation point 1",
    "Point 2..."
  ],
  "whatToDoNext": [
    "Safe next step 1 (e.g. Discuss with Dr. Menon)",
    "Safe step 2..."
  ],
  "sources": [
    {
      "title": "Name of report or record",
      "date": "Date of record",
      "kind": "lab" | "rx" | "vitals" | "device",
      "detail": "Relevant test/value detail"
    }
  ],
  "isEmergency": false,
  "triageLevel": "none" | "routine" | "urgent" | "emergency",
  "disclaimer": "This information is for educational and informational purposes only and does not substitute professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider."
}`

export async function processHealthChat({
  userId,
  userMessage,
  sessionId,
}: {
  userId: string
  userMessage: string
  sessionId?: number
}): Promise<HealthChatResponse> {
  const trimmedMessage = (userMessage || '').trim()
  if (!trimmedMessage) {
    throw new Error('User message cannot be empty.')
  }

  // 1. Gather all verified patient health records strictly for this authenticated userId from PostgreSQL
  const [
    profile,
    conditions,
    medsList,
    labReports,
    symptomsList,
    metricsList,
    structuredDocs,
  ] = await Promise.all([
    getHealthProfile(userId).catch(() => null),
    getMedicalConditions(userId).catch(() => []),
    getMedications(userId).catch(() => []),
    getLabReportsWithResults(userId).catch(() => []),
    getSymptoms(userId).catch(() => []),
    getHealthMetrics(userId).catch(() => []),
    getAllStructuredMedicalData(userId).catch(() => []),
  ])

  // 2. Resolve or create chat session
  let targetSessionId = sessionId || 1
  if (!sessionId || isNaN(sessionId)) {
    const titleSnippet =
      trimmedMessage.length > 40
        ? trimmedMessage.substring(0, 37) + '...'
        : trimmedMessage
    try {
      const newSession = await createChatSession(userId, titleSnippet, 'health')
      if (newSession && newSession.id) {
        targetSessionId = newSession.id
      }
    } catch (err) {
      console.warn('Could not persist chat session to PostgreSQL, using transient session:', err)
    }
  }

  // 3. Fetch recent message history in this session
  const recentHistory = await getChatMessages(userId, targetSessionId)
    .then((msgs) => msgs.slice(-6))
    .catch(() => [])

  // 4. Save user message in PostgreSQL
  await addChatMessage(
    userId,
    targetSessionId,
    'user',
    trimmedMessage,
    [],
    'none'
  ).catch((e) => console.warn('Could not save user chat message to PostgreSQL:', e))

  // 5. Build verified factual context
  const contextParts: string[] = []

  if (profile) {
    contextParts.push(`Patient Demographics:
- Full Name: ${profile.fullName || 'Not specified'}
- Age: ${profile.age || 'Not specified'}, Gender: ${profile.gender || 'Not specified'}
- Height: ${profile.height || 'N/A'} ${profile.heightUnit || 'cm'}, Weight: ${profile.weight || 'N/A'} ${profile.weightUnit || 'kg'}, BMI: ${profile.bmi || 'N/A'}
- Blood Group: ${profile.bloodGroup || 'Not specified'}
- Allergies: ${Array.isArray(profile.allergies) ? profile.allergies.join(', ') : 'None listed'}`)
  }

  if (conditions.length > 0) {
    contextParts.push(
      `Medical Conditions:\n` +
        conditions
          .map(
            (c) =>
              `- ${c.name} (Status: ${c.status}${c.diagnosedDate ? `, Diagnosed: ${c.diagnosedDate}` : ''}${c.notes ? `, Notes: ${c.notes}` : ''})`
          )
          .join('\n')
    )
  }

  if (medsList.length > 0) {
    contextParts.push(
      `Current Medications:\n` +
        medsList
          .map(
            (m) =>
              `- ${m.name} ${m.dosage} (${m.frequency})${m.instructions ? ` - Instructions: ${m.instructions}` : ''} [Active: ${m.isActive}]`
          )
          .join('\n')
    )
  }

  if (labReports.length > 0) {
    const reportSummaries = labReports
      .slice(0, 5)
      .map((r) => {
        const resultsStr = (r.results || [])
          .map(
            (res: any) =>
              `  * ${res.biomarker}: ${res.value} ${res.unit} (Status: ${res.status}${res.referenceRangeLow ? `, Ref: ${res.referenceRangeLow}-${res.referenceRangeHigh}` : ''})`
          )
          .join('\n')
        return `- Report: ${r.testName} (Date: ${r.testDate}, Lab: ${r.laboratoryName || 'Unknown'})\n${resultsStr || '  (No discrete biomarker rows)'}`
      })
      .join('\n')
    contextParts.push(`Recent Laboratory Reports:\n${reportSummaries}`)
  }

  if (symptomsList.length > 0) {
    contextParts.push(
      `Logged Symptoms:\n` +
        symptomsList
          .slice(0, 5)
          .map(
            (s) =>
              `- ${s.symptomName} (Severity: ${s.severity}, Logged: ${s.startedAt ? new Date(s.startedAt).toISOString().split('T')[0] : 'N/A'}${s.notes ? `, Notes: ${s.notes}` : ''})`
          )
          .join('\n')
    )
  }

  if (metricsList.length > 0) {
    contextParts.push(
      `Recent Health Metrics:\n` +
        metricsList
          .slice(0, 10)
          .map(
            (m) =>
              `- ${m.metricType}: ${m.value} ${m.unit} (Date: ${m.recordedAt ? new Date(m.recordedAt).toISOString().split('T')[0] : 'N/A'})`
          )
          .join('\n')
    )
  }

  if (structuredDocs.length > 0) {
    const docMentions = structuredDocs
      .slice(0, 3)
      .map(
        (sd) =>
          `- Document Date: ${sd.documentDate || 'N/A'}, Doctor: ${sd.doctorName || 'N/A'}, Raw extract summary: ${sd.rawOcrText.substring(0, 150)}...`
      )
      .join('\n')
    contextParts.push(`Extracted OCR Documents (Unconfirmed Mentions):\n${docMentions}`)
  }

  const patientContextText =
    contextParts.length > 0
      ? contextParts.join('\n\n')
      : 'No historical health records found in database for this patient.'

  // 6. Check for emergency keywords locally first for guaranteed safety
  const lowerMsg = trimmedMessage.toLowerCase()
  const isEmergencyQuery =
    lowerMsg.includes('chest pain') ||
    lowerMsg.includes('heart attack') ||
    lowerMsg.includes('cannot breathe') ||
    lowerMsg.includes("can't breathe") ||
    lowerMsg.includes('severe chest pressure') ||
    lowerMsg.includes('stroke') ||
    lowerMsg.includes('face drooping') ||
    lowerMsg.includes('unconscious') ||
    lowerMsg.includes('severe allergic reaction') ||
    lowerMsg.includes('anaphylaxis')

  let parsedResponse: {
    shortAnswer: string
    keyMeasurement?: { label: string; value: string; context?: string } | null
    whatThisMeans: string[]
    whatToDoNext: string[]
    sources: MessageSourceCitation[]
    isEmergency: boolean
    triageLevel: 'none' | 'routine' | 'urgent' | 'emergency'
    disclaimer: string
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({})
      const chatPrompt = `PATIENT HEALTH RECORDS (FACTS FROM POSTGRESQL):
----------------------------------------
${patientContextText}
----------------------------------------

RECENT CHAT HISTORY:
${recentHistory.map((m) => `${m.sender}: ${m.text}`).join('\n')}

PATIENT QUESTION:
"${trimmedMessage}"

Please analyze the user's question in the context of their real health data. Follow all safety guidelines strictly. Return a clean JSON response conforming to the system instruction schema.`

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatPrompt,
        config: {
          systemInstruction: CHAT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      })

      const rawText = geminiRes.text?.trim()
      if (rawText) {
        const json = JSON.parse(rawText)
        parsedResponse = {
          shortAnswer:
            json.shortAnswer ||
            'Here is the verified information from your health records.',
          keyMeasurement: json.keyMeasurement || null,
          whatThisMeans: Array.isArray(json.whatThisMeans) ? json.whatThisMeans : [],
          whatToDoNext: Array.isArray(json.whatToDoNext) ? json.whatToDoNext : [],
          sources: Array.isArray(json.sources) ? json.sources : [],
          isEmergency: Boolean(json.isEmergency || isEmergencyQuery),
          triageLevel:
            json.triageLevel || (isEmergencyQuery ? 'emergency' : 'routine'),
          disclaimer:
            json.disclaimer ||
            'This information is for educational purposes only and is not a clinical diagnosis. Consult your doctor for medical advice.',
        }
      } else {
        throw new Error('Empty response received from Gemini model.')
      }
    } catch (apiErr) {
      console.warn('Gemini API call error in health chat, falling back to deterministic extractor:', apiErr)
      parsedResponse = buildDeterministicChatFallback(
        trimmedMessage,
        isEmergencyQuery,
        medsList,
        labReports,
        metricsList,
        profile
      )
    }
  } else {
    // Deterministic fallback when GEMINI_API_KEY is unset
    parsedResponse = buildDeterministicChatFallback(
      trimmedMessage,
      isEmergencyQuery,
      medsList,
      labReports,
      metricsList,
      profile
    )
  }

  // Format full assistant text
  const fullText =
    parsedResponse.shortAnswer +
    (parsedResponse.whatThisMeans.length > 0
      ? '\n\n' + parsedResponse.whatThisMeans.map((p) => `• ${p}`).join('\n')
      : '') +
    (parsedResponse.whatToDoNext.length > 0
      ? '\n\nNext Steps:\n' +
        parsedResponse.whatToDoNext.map((p) => `• ${p}`).join('\n')
      : '')

  // 7. Save assistant message to PostgreSQL
  const savedAssistantMsg = await addChatMessage(
    userId,
    targetSessionId,
    'assistant',
    fullText,
    parsedResponse.sources,
    parsedResponse.triageLevel
  ).catch((e) => {
    console.warn('Could not save assistant chat message to PostgreSQL:', e)
    return {
      id: Date.now(),
      createdAt: new Date(),
    }
  })

  return {
    sessionId: targetSessionId,
    messageId: savedAssistantMsg.id,
    sender: 'assistant',
    text: fullText,
    shortAnswer: parsedResponse.shortAnswer,
    keyMeasurement: parsedResponse.keyMeasurement,
    whatThisMeans: parsedResponse.whatThisMeans,
    whatToDoNext: parsedResponse.whatToDoNext,
    sources: parsedResponse.sources,
    isEmergency: parsedResponse.isEmergency,
    triageLevel: parsedResponse.triageLevel,
    disclaimer: parsedResponse.disclaimer,
    createdAt: savedAssistantMsg.createdAt ? new Date(savedAssistantMsg.createdAt).toISOString() : new Date().toISOString(),
  }
}

/**
 * Deterministic medical safety fallback when Gemini API key is absent or network fails.
 * Grounded strictly in PostgreSQL records without fabricating numbers.
 */
function buildDeterministicChatFallback(
  message: string,
  isEmergencyQuery: boolean,
  medsList: any[],
  labReports: any[],
  metricsList: any[],
  profile: any
) {
  const lower = message.toLowerCase()

  if (isEmergencyQuery) {
    return {
      shortAnswer:
        'The symptoms you described can indicate an acute medical emergency requiring immediate evaluation.',
      keyMeasurement: null,
      whatThisMeans: [
        'Symptoms such as severe chest pain, shortness of breath, or sudden neurological changes need prompt medical intervention.',
        'Delayed evaluation of acute cardiovascular or respiratory symptoms carries elevated clinical risk.',
      ],
      whatToDoNext: [
        'Call local emergency medical services immediately or visit the nearest emergency department.',
        'Do not drive yourself to the hospital.',
        'Rest in a comfortable position and keep emergency contacts informed.',
      ],
      sources: [],
      isEmergency: true,
      triageLevel: 'emergency' as const,
      disclaimer:
        'Immediate in-person medical evaluation is advised. Do not rely solely on digital applications during emergency events.',
    }
  }

  // Medicines query
  if (lower.includes('med') || lower.includes('medicine') || lower.includes('pill') || lower.includes('rx')) {
    if (medsList.length > 0) {
      const activeMeds = medsList.filter((m) => m.isActive)
      const medNames = activeMeds.map((m) => `${m.name} ${m.dosage}`).join(', ')
      return {
        shortAnswer: `You currently have ${activeMeds.length} active medication(s) recorded in your profile: ${medNames}.`,
        keyMeasurement: {
          label: 'Active Medications',
          value: `${activeMeds.length} prescribed`,
          context: 'Verified from your health record',
        },
        whatThisMeans: activeMeds.map(
          (m) =>
            `${m.name} ${m.dosage}: Taken ${m.frequency}${m.instructions ? ` (${m.instructions})` : ''}.`
        ),
        whatToDoNext: [
          'Take all medications strictly as prescribed by your treating physician.',
          'Review any potential side effects or missed dosages with your pharmacist or doctor.',
        ],
        sources: activeMeds.map((m) => ({
          title: `Prescription Record (${m.name})`,
          date: m.startDate || 'Current',
          kind: 'rx' as const,
          detail: `${m.name} ${m.dosage} - ${m.frequency}`,
        })),
        isEmergency: false,
        triageLevel: 'routine' as const,
        disclaimer:
          'Medication information is reflected from your saved records. Consult your physician before starting, stopping, or altering doses.',
      }
    } else {
      return {
        shortAnswer: 'You do not have any active medications recorded in your HealthLens profile.',
        keyMeasurement: null,
        whatThisMeans: [
          'No prescriptions or medications have been uploaded or added to your account yet.',
        ],
        whatToDoNext: [
          'Upload your recent doctor prescription in the Documents section to populate your medication schedule.',
        ],
        sources: [],
        isEmergency: false,
        triageLevel: 'routine' as const,
        disclaimer: 'Informational reference only.',
      }
    }
  }

  // Lab report query
  if (
    lower.includes('report') ||
    lower.includes('lab') ||
    lower.includes('test') ||
    lower.includes('cbc') ||
    lower.includes('hemoglobin') ||
    lower.includes('blood')
  ) {
    if (labReports.length > 0) {
      const latestReport = labReports[0]
      const results = latestReport.results || []
      const abnormal = results.filter((r: any) => r.status && r.status !== 'NORMAL')

      return {
        shortAnswer: `Your latest recorded lab report is "${latestReport.testName}" dated ${latestReport.testDate} with ${results.length} measured biomarker(s).`,
        keyMeasurement: results[0]
          ? {
              label: results[0].biomarker,
              value: `${results[0].value} ${results[0].unit}`,
              context: results[0].status || 'Recorded',
            }
          : null,
        whatThisMeans:
          abnormal.length > 0
            ? abnormal.map(
                (r: any) =>
                  `${r.biomarker} is measured at ${r.value} ${r.unit} (${r.status}${r.referenceRangeLow ? `, reference range ${r.referenceRangeLow}-${r.referenceRangeHigh}` : ''}).`
              )
            : results.slice(0, 3).map(
                (r: any) =>
                  `${r.biomarker}: ${r.value} ${r.unit} (${r.status || 'Normal'}).`
              ),
        whatToDoNext: [
          `Review this ${latestReport.testName} report with your physician during your next visit.`,
          'Compare with previous lab trends to evaluate ongoing progress.',
        ],
        sources: [
          {
            title: latestReport.testName,
            date: latestReport.testDate,
            kind: 'lab' as const,
            detail: `${results.length} biomarker(s) analyzed`,
          },
        ],
        isEmergency: false,
        triageLevel: 'routine' as const,
        disclaimer:
          'Lab results should always be interpreted in comprehensive clinical context with your physician.',
      }
    }
  }

  // General health guidance
  return {
    shortAnswer: `Based on your records${profile?.fullName ? ` for ${profile.fullName}` : ''}, your profile contains ${labReports.length} lab report(s), ${medsList.length} medication(s), and ${metricsList.length} metric reading(s).`,
    keyMeasurement: null,
    whatThisMeans: [
      'HealthLens maintains your factual medical records securely in your database.',
      'You can ask specific questions regarding your blood tests, medication schedules, or activity trends.',
    ],
    whatToDoNext: [
      'Ask "Explain my latest report" or "Explain my medicines" for specific breakdown.',
      'Consult your healthcare provider for clinical diagnosis and customized treatment recommendations.',
    ],
    sources: [],
    isEmergency: false,
    triageLevel: 'routine' as const,
    disclaimer:
      'This assistant provides informational health insights from your verified database records and is not a substitute for clinical diagnosis.',
  }
}
