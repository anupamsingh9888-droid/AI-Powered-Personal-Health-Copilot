import { apiRequest } from './apiClient'

export interface SymptomDoc {
  id: string
  userId: string
  name: string
  severity: string
  notes?: string
  date: string
  createdAt: string
  updatedAt: string
}

export async function getSymptoms(userId?: string): Promise<SymptomDoc[]> {
  try {
    const list = await apiRequest('/api/symptoms')
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      userId: item.userId || userId || '',
      name: item.symptomName,
      severity: item.severity,
      notes: item.notes || '',
      date: item.startedAt
        ? new Date(item.startedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }))
  } catch (error) {
    console.warn('Could not fetch symptoms from PostgreSQL:', error)
    return []
  }
}

export async function logSymptom(
  userId: string,
  symptom: { name: string; severity: string; notes?: string; date?: string }
): Promise<SymptomDoc> {
  const result = await apiRequest('/api/symptoms', {
    method: 'POST',
    body: JSON.stringify({
      symptomName: symptom.name,
      severity: symptom.severity,
      notes: symptom.notes || '',
      startedAt: symptom.date ? new Date(symptom.date).toISOString() : new Date().toISOString(),
    }),
  })

  return {
    id: String(result.id),
    userId,
    name: result.symptomName,
    severity: result.severity,
    notes: result.notes || '',
    date: symptom.date || new Date().toISOString().split('T')[0],
    createdAt: result.createdAt,
    updatedAt: result.createdAt,
  }
}

export async function deleteSymptom(symptomId: string): Promise<void> {
  const numId = parseInt(symptomId, 10)
  if (!isNaN(numId)) {
    await apiRequest(`/api/symptoms/${numId}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Could not delete symptom from PostgreSQL:', err))
  }
}
