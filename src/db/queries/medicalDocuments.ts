import { and, desc, eq } from 'drizzle-orm'
import { db, isDbConfigured, isDbAvailable, markDbUnreachable } from '../index.ts'
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

const memoryDocs = new Map<string, any[]>()
let nextDocId = 1

export async function getMedicalDocuments(userId: string) {
  if (!isDbAvailable()) {
    return memoryDocs.get(userId) || []
  }
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
    markDbUnreachable()
    return memoryDocs.get(userId) || []
  }
}

export async function getMedicalDocumentById(userId: string, documentId: number) {
  if (isDbAvailable()) {
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
      if (doc) {
        return {
          ...doc,
          documentId: String(doc.id),
          originalFilename: doc.originalFilename || doc.fileName,
        }
      }
    } catch (error) {
      markDbUnreachable()
    }
  }

  const userDocs = memoryDocs.get(userId) || []
  return userDocs.find((d) => d.id === documentId) || null
}

export async function createMedicalDocument(
  userId: string,
  data: MedicalDocumentInput
) {
  const origName = data.originalFilename || data.fileName || 'document.pdf'
  const docTitle = data.title || origName || data.docType || 'Medical Document'
  const status = data.processingStatus || 'UPLOADED'

  if (isDbAvailable()) {
    try {
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
      markDbUnreachable()
    }
  }

  const fallback = {
    id: nextDocId++,
    documentId: String(nextDocId),
    userId,
    title: docTitle,
    docType: data.docType || 'General Medical',
    fileUrl: data.fileUrl || '',
    fileName: origName,
    originalFilename: origName,
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || 'application/pdf',
    processingStatus: status,
    uploadedAt: new Date(),
  }
  const current = memoryDocs.get(userId) || []
  current.unshift(fallback)
  memoryDocs.set(userId, current)
  return fallback
}

export async function updateMedicalDocumentStatus(
  userId: string,
  documentId: number,
  status: string
) {
  if (isDbAvailable()) {
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

      if (doc) {
        return {
          ...doc,
          documentId: String(doc.id),
          originalFilename: doc.originalFilename || doc.fileName,
        }
      }
    } catch (error) {
      markDbUnreachable()
    }
  }

  const userDocs = memoryDocs.get(userId) || []
  const target = userDocs.find((d) => d.id === documentId)
  if (target) {
    target.processingStatus = status
    return target
  }
  return null
}

export async function deleteMedicalDocument(userId: string, documentId: number) {
  if (isDbAvailable()) {
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
      markDbUnreachable()
    }
  }
  const userDocs = memoryDocs.get(userId) || []
  memoryDocs.set(
    userId,
    userDocs.filter((d) => d.id !== documentId)
  )
  return { success: true }
}
