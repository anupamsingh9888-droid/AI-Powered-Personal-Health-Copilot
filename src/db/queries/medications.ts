import { and, eq } from 'drizzle-orm'
import { db } from '../index.ts'
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

export async function getMedications(userId: string) {
  try {
    return await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(medications.createdAt)
  } catch (error) {
    console.error('Database query failed in getMedications:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function createMedication(userId: string, data: MedicationInput) {
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
    console.error('Database query failed in createMedication:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function updateMedication(
  userId: string,
  id: number,
  data: Partial<MedicationInput>
) {
  try {
    const result = await db
      .update(medications)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(medications.id, id), eq(medications.userId, userId)))
      .returning()

    return result[0] || null
  } catch (error) {
    console.error('Database query failed in updateMedication:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function deleteMedication(userId: string, id: number) {
  try {
    await db
      .delete(medications)
      .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    return true
  } catch (error) {
    console.error('Database query failed in deleteMedication:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
