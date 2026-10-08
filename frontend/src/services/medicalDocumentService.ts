import { apiRequest } from './apiClient'

export type ProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface MedicalDocument {
  id: number | string
  documentId: string
  userId: string
  title?: string
  docType: string
  fileName: string
  originalFilename: string
  fileSize?: number
  mimeType?: string
  fileUrl?: string
  processingStatus: ProcessingStatus
  uploadedAt: string
}

export interface UploadDocumentInput {
  docType: string
  originalFilename: string
  title?: string
  fileSize?: number
  mimeType?: string
  fileUrl?: string
  processingStatus?: ProcessingStatus
}

/**
 * Upload medical document metadata to PostgreSQL.
 * Associates record with the authenticated user's Firebase UID on the backend.
 */
export async function uploadMedicalDocument(
  input: UploadDocumentInput
): Promise<MedicalDocument> {
  const result = await apiRequest<MedicalDocument>('/api/medical-documents', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title || input.originalFilename,
      docType: input.docType,
      originalFilename: input.originalFilename,
      fileName: input.originalFilename,
      fileSize: input.fileSize || 0,
      mimeType: input.mimeType || 'application/pdf',
      fileUrl: input.fileUrl || '',
      processingStatus: input.processingStatus || 'UPLOADED',
    }),
  })

  return {
    ...result,
    documentId: String(result.id || result.documentId),
    originalFilename: result.originalFilename || result.fileName,
    processingStatus: (result.processingStatus as ProcessingStatus) || 'UPLOADED',
  }
}

/**
 * Fetch all medical documents belonging to the authenticated user from PostgreSQL.
 */
export async function getMedicalDocuments(): Promise<MedicalDocument[]> {
  const result = await apiRequest<MedicalDocument[]>('/api/medical-documents')
  if (!Array.isArray(result)) return []
  return result.map((item) => ({
    ...item,
    documentId: String(item.id || item.documentId),
    originalFilename: item.originalFilename || item.fileName,
    processingStatus: (item.processingStatus as ProcessingStatus) || 'UPLOADED',
  }))
}

/**
 * Fetch a single medical document by ID for the authenticated user from PostgreSQL.
 */
export async function getMedicalDocument(id: number | string): Promise<MedicalDocument> {
  const result = await apiRequest<MedicalDocument>(`/api/medical-documents/${id}`)
  return {
    ...result,
    documentId: String(result.id || result.documentId),
    originalFilename: result.originalFilename || result.fileName,
    processingStatus: (result.processingStatus as ProcessingStatus) || 'UPLOADED',
  }
}

/**
 * Update the processing status of a medical document in PostgreSQL.
 */
export async function updateDocumentProcessingStatus(
  id: number | string,
  status: ProcessingStatus
): Promise<MedicalDocument> {
  const result = await apiRequest<MedicalDocument>(`/api/medical-documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ processingStatus: status }),
  })
  return {
    ...result,
    documentId: String(result.id || result.documentId),
    originalFilename: result.originalFilename || result.fileName,
    processingStatus: (result.processingStatus as ProcessingStatus) || status,
  }
}

/**
 * Delete a medical document from PostgreSQL.
 */
export async function deleteMedicalDocument(id: number | string): Promise<void> {
  await apiRequest(`/api/medical-documents/${id}`, {
    method: 'DELETE',
  })
}
