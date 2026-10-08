import { and, desc, eq } from 'drizzle-orm'
import { db, isDbAvailable, markDbUnreachable } from '../index.ts'
import {
  structuredMedicalData,
  ocrResults,
  medicalDocuments,
  labReports,
  labResults,
  medications as medicationsTable,
} from '../schema.ts'

export interface StructuredDiagnosis {
  diagnosis: string
  context: string | null
  confidenceScore: number
  requiresReview: boolean
  isConfirmedDiagnosis: false
  note: string
}

export interface StructuredMedication {
  name: string
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
  confidenceScore: number
  requiresReview: boolean
  reviewReason?: string | null
}

export interface StructuredLabTest {
  testName: string
  value: string | null
  unit: string | null
  referenceRange: string | null
  abnormalFlag: 'HIGH' | 'LOW' | 'NORMAL' | 'ABNORMAL' | null
  confidenceScore: number
  requiresReview: boolean
  reviewReason?: string | null
}

export interface UncertainField {
  field: string
  extractedValue: string | null
  reason: string
  confidenceScore: number
}

export interface StructuredMedicalDataInput {
  documentId: number
  userId: string
  rawOcrText: string
  ocrConfidence?: number | null
  patientName?: string | null
  documentDate?: string | null
  doctorName?: string | null
  diagnosesMentioned?: StructuredDiagnosis[]
  medications?: StructuredMedication[]
  laboratoryTests?: StructuredLabTest[]
  uncertainFields?: UncertainField[]
  requiresReview?: boolean
  reviewStatus?: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'
  clinicalDisclaimer?: string
  structuredJson?: Record<string, any>
}

const memoryStructuredData = new Map<string, any[]>()
let nextStructuredId = 1

/**
 * Save structured extraction results into PostgreSQL.
 * Preserves raw OCR text, links to original document, and records confidence and review flags.
 */
export async function saveStructuredMedicalData(
  userId: string,
  input: StructuredMedicalDataInput
) {
  if (isDbAvailable()) {
    try {
      // 1. Ensure ocr_results record exists to link to original document
      let ocrResultId: number | null = null
      const [existingOcr] = await db
        .select()
        .from(ocrResults)
        .where(
          and(
            eq(ocrResults.documentId, input.documentId),
            eq(ocrResults.userId, userId)
          )
        )

      if (existingOcr) {
        ocrResultId = existingOcr.id
        await db
          .update(ocrResults)
          .set({
            rawText: input.rawOcrText,
            confidenceScore:
              input.ocrConfidence !== undefined && input.ocrConfidence !== null
                ? String(input.ocrConfidence)
                : existingOcr.confidenceScore,
            extractedEntities: input.structuredJson || {},
            processedAt: new Date(),
          })
          .where(eq(ocrResults.id, existingOcr.id))
      } else {
        const [newOcr] = await db
          .insert(ocrResults)
          .values({
            documentId: input.documentId,
            userId,
            rawText: input.rawOcrText,
            confidenceScore:
              input.ocrConfidence !== undefined && input.ocrConfidence !== null
                ? String(input.ocrConfidence)
                : null,
            extractedEntities: input.structuredJson || {},
          })
          .returning()
        ocrResultId = newOcr.id
      }

      // 2. Insert into structured_medical_data table
      const [saved] = await db
        .insert(structuredMedicalData)
        .values({
          documentId: input.documentId,
          userId,
          ocrResultId,
          rawOcrText: input.rawOcrText,
          ocrConfidence:
            input.ocrConfidence !== undefined && input.ocrConfidence !== null
              ? String(input.ocrConfidence)
              : null,
          patientName: input.patientName ?? null,
          documentDate: input.documentDate ?? null,
          doctorName: input.doctorName ?? null,
          diagnosesMentioned: input.diagnosesMentioned || [],
          medications: input.medications || [],
          laboratoryTests: input.laboratoryTests || [],
          uncertainFields: input.uncertainFields || [],
          requiresReview: Boolean(
            input.requiresReview ||
              (input.uncertainFields && input.uncertainFields.length > 0)
          ),
          reviewStatus: input.reviewStatus || 'PENDING_REVIEW',
          clinicalDisclaimer:
            input.clinicalDisclaimer ||
            'Not a confirmed medical diagnosis. Information extracted from document text for informational reference only. Consult your doctor.',
          structuredJson: input.structuredJson || {},
        })
        .returning()

      // 3. Update parent medical_documents processing status
      const docStatus = saved?.requiresReview ? 'NEEDS_REVIEW' : 'COMPLETED'
      await db
        .update(medicalDocuments)
        .set({ processingStatus: docStatus })
        .where(
          and(
            eq(medicalDocuments.id, input.documentId),
            eq(medicalDocuments.userId, userId)
          )
        )

      // 4. Optionally synchronize relational tables for lab tests and medications
      if (input.laboratoryTests && input.laboratoryTests.length > 0) {
        try {
          const [report] = await db
            .insert(labReports)
            .values({
              userId,
              documentId: input.documentId,
              testName:
                input.laboratoryTests[0]?.testName ||
                'Extracted Laboratory Observation',
              testCategory: 'Laboratory',
              testDate: input.documentDate || new Date().toISOString().split('T')[0],
              laboratoryName: 'Extracted from uploaded document',
              summary: `Automated extraction containing ${input.laboratoryTests.length} observed parameters. Requires clinical review.`,
            })
            .returning()

          for (const test of input.laboratoryTests) {
            if (test.value) {
              const numVal = parseFloat(test.value.replace(/[^0-9.-]/g, ''))
              if (!isNaN(numVal)) {
                await db.insert(labResults).values({
                  reportId: report.id,
                  userId,
                  biomarker: test.testName,
                  value: String(numVal),
                  unit: test.unit || 'unit',
                  referenceRangeLow: null,
                  referenceRangeHigh: null,
                  status: test.abnormalFlag || 'NORMAL',
                })
              }
            }
          }
        } catch (err) {
          console.warn('Could not populate lab_reports/lab_results relation:', err)
        }
      }

      if (input.medications && input.medications.length > 0) {
        try {
          for (const med of input.medications) {
            if (med.name && !med.requiresReview) {
              await db.insert(medicationsTable).values({
                userId,
                name: med.name,
                dosage: med.dosage || 'As directed',
                frequency: med.frequency || 'Daily',
                instructions: med.instructions || 'Extracted from document',
                startDate: input.documentDate || new Date().toISOString().split('T')[0],
                isActive: true,
              })
            }
          }
        } catch (err) {
          console.warn('Could not populate medications relation:', err)
        }
      }

      if (saved) return saved
    } catch (error) {
      console.warn('PostgreSQL write failed in saveStructuredMedicalData, using fallback:', error)
    }
  }

  // Fallback to in-memory store
  const fallbackId = nextStructuredId++
  const fallbackSaved = {
    id: fallbackId,
    documentId: input.documentId,
    userId,
    ocrResultId: fallbackId,
    rawOcrText: input.rawOcrText,
    ocrConfidence:
      input.ocrConfidence !== undefined && input.ocrConfidence !== null
        ? String(input.ocrConfidence)
        : null,
    patientName: input.patientName ?? null,
    documentDate: input.documentDate ?? null,
    doctorName: input.doctorName ?? null,
    diagnosesMentioned: input.diagnosesMentioned || [],
    medications: input.medications || [],
    laboratoryTests: input.laboratoryTests || [],
    uncertainFields: input.uncertainFields || [],
    requiresReview: Boolean(
      input.requiresReview ||
        (input.uncertainFields && input.uncertainFields.length > 0)
    ),
    reviewStatus: input.reviewStatus || 'PENDING_REVIEW',
    clinicalDisclaimer:
      input.clinicalDisclaimer ||
      'Not a confirmed medical diagnosis. Information extracted from document text for informational reference only. Consult your doctor.',
    structuredJson: input.structuredJson || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const current = memoryStructuredData.get(userId) || []
  current.unshift(fallbackSaved)
  memoryStructuredData.set(userId, current)
  return fallbackSaved
}

/**
 * Fetch structured medical data by document ID for the authenticated user.
 */
export async function getStructuredMedicalDataByDocument(
  userId: string,
  documentId: number
) {
  if (!isDbAvailable()) {
    const list = memoryStructuredData.get(userId) || []
    return list.find((d) => d.documentId === documentId) || null
  }
  try {
    const records = await db
      .select()
      .from(structuredMedicalData)
      .where(
        and(
          eq(structuredMedicalData.documentId, documentId),
          eq(structuredMedicalData.userId, userId)
        )
      )
      .orderBy(desc(structuredMedicalData.createdAt))

    return records[0] || null
  } catch (error) {
    markDbUnreachable()
    const list = memoryStructuredData.get(userId) || []
    return list.find((d) => d.documentId === documentId) || null
  }
}

/**
 * Fetch all structured medical data entries for the authenticated user.
 */
export async function getAllStructuredMedicalData(userId: string) {
  if (!isDbAvailable()) {
    return memoryStructuredData.get(userId) || []
  }
  try {
    return await db
      .select()
      .from(structuredMedicalData)
      .where(eq(structuredMedicalData.userId, userId))
      .orderBy(desc(structuredMedicalData.createdAt))
  } catch (error) {
    markDbUnreachable()
    return memoryStructuredData.get(userId) || []
  }
}

/**
 * Update review status of a structured medical data entry.
 */
export async function updateStructuredDataReview(
  userId: string,
  id: number,
  reviewStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED',
  updatedFields?: Partial<StructuredMedicalDataInput>
) {
  if (isDbAvailable()) {
    try {
      const updatePayload: Record<string, any> = {
        reviewStatus,
        requiresReview: reviewStatus === 'PENDING_REVIEW',
        updatedAt: new Date(),
      }

      if (updatedFields?.medications) {
        updatePayload.medications = updatedFields.medications
      }
      if (updatedFields?.laboratoryTests) {
        updatePayload.laboratoryTests = updatedFields.laboratoryTests
      }
      if (updatedFields?.diagnosesMentioned) {
        updatePayload.diagnosesMentioned = updatedFields.diagnosesMentioned
      }
      if (updatedFields?.uncertainFields) {
        updatePayload.uncertainFields = updatedFields.uncertainFields
      }

      const [updated] = await db
        .update(structuredMedicalData)
        .set(updatePayload)
        .where(
          and(
            eq(structuredMedicalData.id, id),
            eq(structuredMedicalData.userId, userId)
          )
        )
        .returning()

      if (updated) return updated
    } catch (error) {
      markDbUnreachable()
    }
  }

  const list = memoryStructuredData.get(userId) || []
  const item = list.find((d) => d.id === id)
  if (item) {
    item.reviewStatus = reviewStatus
    item.requiresReview = reviewStatus === 'PENDING_REVIEW'
    item.updatedAt = new Date()
    return item
  }
  return null
}
