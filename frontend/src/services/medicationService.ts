import { apiRequest } from './apiClient'
import type { MedicationItem } from '../types'

export interface MedicationDoc {
  id: string
  userId: string
  name: string
  dose: string
  frequency: string
  instructions: string
  instructionsHi?: string
  source?: string
  conf?: number
  status?: 'Active' | 'Completed' | 'Pending'
  rxRegion?: string
  takenToday: boolean
  skippedToday: boolean
  createdAt: string
  updatedAt: string
}

export async function getMedications(userId?: string): Promise<MedicationItem[]> {
  try {
    const list = await apiRequest('/api/medications')
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      dose: item.dosage || item.dose || '',
      frequency: item.frequency || 'Once daily',
      instructions: item.instructions || '',
      instructionsHi: item.instructions || '',
      source: 'Prescription',
      conf: 0.95,
      status: item.isActive ? 'Active' : 'Completed',
      rxRegion: 'reg-rx-1',
      takenToday: Boolean(item.adherenceRate && item.adherenceRate >= 100),
      skippedToday: false,
    }))
  } catch (error) {
    console.warn('Could not fetch medications from PostgreSQL:', error)
    return []
  }
}

export async function createMedication(
  userId: string,
  med: { name: string; dose: string; frequency?: string; instructions: string }
): Promise<MedicationDoc> {
  const result = await apiRequest('/api/medications', {
    method: 'POST',
    body: JSON.stringify({
      name: med.name,
      dosage: med.dose,
      frequency: med.frequency || 'Once daily',
      instructions: med.instructions,
      isActive: true,
    }),
  })

  return {
    id: String(result.id),
    userId,
    name: result.name,
    dose: result.dosage || med.dose,
    frequency: result.frequency,
    instructions: result.instructions,
    takenToday: false,
    skippedToday: false,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export async function updateMedicationAdherence(
  medId: string,
  takenToday: boolean,
  skippedToday: boolean
): Promise<void> {
  const numId = parseInt(medId, 10)
  if (!isNaN(numId)) {
    await apiRequest(`/api/medications/${numId}`, {
      method: 'PUT',
      body: JSON.stringify({
        adherenceRate: takenToday ? 100 : skippedToday ? 0 : 80,
      }),
    }).catch((err) => console.warn('Could not update medication adherence:', err))
  }
}

export async function seedInitialMedications(
  userId: string,
  initialList: MedicationItem[]
): Promise<void> {
  for (const item of initialList) {
    await apiRequest('/api/medications', {
      method: 'POST',
      body: JSON.stringify({
        name: item.name,
        dosage: item.dose,
        frequency: item.frequency,
        instructions: item.instructions,
        isActive: true,
      }),
    }).catch(() => {})
  }
}
