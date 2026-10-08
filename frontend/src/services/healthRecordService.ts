import { apiRequest } from './apiClient'

export interface HealthRecordDoc {
  id: string
  userId: string
  title: string
  category: string
  date: string
  doctor: string
  notes: string
  createdAt: string
  updatedAt: string
}

export async function getHealthRecords(userId?: string): Promise<HealthRecordDoc[]> {
  try {
    const list = await apiRequest('/api/medical-documents')
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      userId: item.userId || userId || '',
      title: item.title,
      category: item.docType || 'General Record',
      date: item.uploadedAt
        ? new Date(item.uploadedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      doctor: 'Dr. Clinical Care',
      notes: item.fileName || '',
      createdAt: item.uploadedAt,
      updatedAt: item.uploadedAt,
    }))
  } catch (error) {
    console.warn('Could not fetch health records from PostgreSQL:', error)
    return []
  }
}

export async function createHealthRecord(
  userId: string,
  record: Omit<HealthRecordDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<HealthRecordDoc> {
  const result = await apiRequest('/api/medical-documents', {
    method: 'POST',
    body: JSON.stringify({
      title: record.title,
      docType: record.category,
      fileName: `${record.title}.pdf`,
      fileUrl: 'https://storage.googleapis.com/healthlens-docs/record.pdf',
    }),
  })

  return {
    id: String(result.id),
    userId,
    title: result.title,
    category: result.docType,
    date: record.date,
    doctor: record.doctor,
    notes: record.notes,
    createdAt: result.uploadedAt,
    updatedAt: result.uploadedAt,
  }
}

export async function deleteHealthRecord(_recordId: string): Promise<void> {
  // Medical documents deletion if needed
}
