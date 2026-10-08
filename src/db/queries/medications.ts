import { and, eq } from 'drizzle-orm'
import { db, isDbConfigured, isDbAvailable, markDbUnreachable } from '../index.ts'
import { medications } from '../schema.ts'

export interface MedicationInput {
  name: string
  dosage: string
  frequency: string
  timeOfDay?: string[]
  instructions?: string
  startDate?: string
  endDate?: string
  adherenceRate?: number
  isActive?: boolean
}

const memoryMeds = new Map<string, any[]>()
let nextMedId = 1

export async function getMedications(userId: string) {
  if (!isDbAvailable()) {
    return memoryMeds.get(userId) || []
  }
  try {
    return await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(medications.createdAt)
  } catch (error) {
    markDbUnreachable()
    return memoryMeds.get(userId) || []
  }
}

export async function createMedication(userId: string, data: MedicationInput) {
  if (isDbAvailable()) {
    try {
      const result = await db
        .insert(medications)
        .values({
          userId,
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          timeOfDay: data.timeOfDay || [],
          instructions: data.instructions || '',
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          adherenceRate: data.adherenceRate ?? 100,
          isActive: data.isActive ?? true,
        })
        .returning()

      return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallback = {
    id: nextMedId++,
    userId,
    name: data.name,
    dosage: data.dosage,
    frequency: data.frequency,
    timeOfDay: data.timeOfDay || [],
    instructions: data.instructions || '',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    adherenceRate: data.adherenceRate ?? 100,
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const current = memoryMeds.get(userId) || []
  current.push(fallback)
  memoryMeds.set(userId, current)
  return fallback
}

export async function updateMedication(
  userId: string,
  id: number,
  data: Partial<MedicationInput>
) {
  if (isDbAvailable()) {
    try {
      const result = await db
        .update(medications)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(medications.id, id), eq(medications.userId, userId)))
        .returning()

      if (result[0]) return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const current = memoryMeds.get(userId) || []
  const med = current.find((m) => m.id === id)
  if (med) {
    Object.assign(med, data, { updatedAt: new Date() })
    return med
  }
  return null
}

export async function deleteMedication(userId: string, id: number) {
  if (isDbAvailable()) {
    try {
      await db
        .delete(medications)
        .where(and(eq(medications.id, id), eq(medications.userId, userId)))
      return true
    } catch (error) {
      markDbUnreachable()
    }
  }
  const current = memoryMeds.get(userId) || []
  memoryMeds.set(
    userId,
    current.filter((m) => m.id !== id)
  )
  return true
}
