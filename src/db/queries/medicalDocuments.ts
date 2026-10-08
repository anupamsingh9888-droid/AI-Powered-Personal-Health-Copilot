import { and, desc, eq } from 'drizzle-orm'
import { db } from '../index.ts'
import { medicalDocuments, ocrResults } from '../schema.ts'

export interface MedicalDocumentInput {
  title?: string
  docType: string
  fileUrl?: string
  fileName?: string
  originalFilename?: string
  fileSize?: number
  mimeType?: string
  processingStatus?: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string
}

export async function getMedicalDocuments(userId: string) {
  try {
    const docs = await db
      .select()
      .from(medicalDocuments)
      .where(eq(medicalDocuments.userId, userId))
      .orderBy(desc(medicalDocuments.uploadedAt))

    const docIds = docs.map((d) => d.id)
    if (docIds.length === 0) return []

    const ocrs = await db
      .select()
      .from(ocrResults)
      .where(eq(ocrResults.userId, userId))

    return docs.map((doc) => ({
      ...doc,
      documentId: String(doc.id),
      originalFilename: doc.originalFilename || doc.fileName,
      ocrResult: ocrs.find((o) => o.documentId === doc.id) || null,
    }))
  } catch (error) {
    console.error('Database query failed in getMedicalDocuments:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function getMedicalDocumentById(userId: string, documentId: number) {
  try {
    const [doc] = await db
      .select()
      .from(medicalDocuments)
      .where(
        and(
          eq(medicalDocuments.id, documentId),
          eq(medicalDocuments.userId, userId)
        )
      )
    if (!doc) return null
    return {
      ...doc,
      documentId: String(doc.id),
      originalFilename: doc.originalFilename || doc.fileName,
    }
  } catch (error) {
    console.error('Database query failed in getMedicalDocumentById:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function createMedicalDocument(
  userId: string,
  data: MedicalDocumentInput
) {
  try {
    const origName = data.originalFilename || data.fileName || 'document.pdf'
    const docTitle = data.title || origName || data.docType || 'Medical Document'
    const status = data.processingStatus || 'UPLOADED'

    const [doc] = await db
      .insert(medicalDocuments)
      .values({
        userId,
        title: docTitle,
        docType: data.docType || 'General Medical',
        fileUrl: data.fileUrl || '',
        fileName: origName,
        originalFilename: origName,
        fileSize: data.fileSize || 0,
        mimeType: data.mimeType || 'application/pdf',
        processingStatus: status,
      })
      .returning()

    return {
      ...doc,
      documentId: String(doc.id),
      originalFilename: doc.originalFilename || doc.fileName,
    }
  } catch (error) {
    console.error('Database query failed in createMedicalDocument:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function updateMedicalDocumentStatus(
  userId: string,
  documentId: number,
  status: string
) {
  try {
    const [doc] = await db
      .update(medicalDocuments)
      .set({
        processingStatus: status,
      })
      .where(
        and(
          eq(medicalDocuments.id, documentId),
          eq(medicalDocuments.userId, userId)
        )
      )
      .returning()

    if (!doc) return null
    return {
      ...doc,
      documentId: String(doc.id),
      originalFilename: doc.originalFilename || doc.fileName,
    }
  } catch (error) {
    console.error('Database query failed in updateMedicalDocumentStatus:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function deleteMedicalDocument(userId: string, documentId: number) {
  try {
    await db
      .delete(medicalDocuments)
      .where(
        and(
          eq(medicalDocuments.id, documentId),
          eq(medicalDocuments.userId, userId)
        )
      )
    return { success: true }
  } catch (error) {
    console.error('Database query failed in deleteMedicalDocument:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
