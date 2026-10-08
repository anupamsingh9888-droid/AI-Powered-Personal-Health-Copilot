import { and, eq } from 'drizzle-orm'
import { db } from '../index.ts'
import { symptoms } from '../schema.ts'

export interface SymptomInput {
  symptomName: string
  severity: string
  startedAt?: Date | string
  resolvedAt?: Date | string
  bodyPart?: string
  notes?: string
}

export async function getSymptoms(userId: string) {
  try {
    return await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.userId, userId))
      .orderBy(symptoms.startedAt)
  } catch (error) {
    console.error('Database query failed in getSymptoms:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function createSymptom(userId: string, data: SymptomInput) {
  try {
    const started = data.startedAt ? new Date(data.startedAt) : new Date()
    const resolved = data.resolvedAt ? new Date(data.resolvedAt) : null

    const result = await db
      .insert(symptoms)
      .values({
        userId,
        symptomName: data.symptomName,
        severity: data.severity,
        startedAt: started,
        resolvedAt: resolved,
        bodyPart: data.bodyPart || '',
        notes: data.notes || '',
      })
      .returning()

    return result[0]
  } catch (error) {
    console.error('Database query failed in createSymptom:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function deleteSymptom(userId: string, id: number) {
  try {
    await db
      .delete(symptoms)
      .where(and(eq(symptoms.id, id), eq(symptoms.userId, userId)))
    return true
  } catch (error) {
    console.error('Database query failed in deleteSymptom:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
