import { and, eq } from 'drizzle-orm'
import { db, isDbConfigured, isDbAvailable, markDbUnreachable } from '../index.ts'
import { symptoms } from '../schema.ts'

export interface SymptomInput {
  symptomName: string
  severity: string
  startedAt?: Date | string
  resolvedAt?: Date | string
  bodyPart?: string
  notes?: string
}

const memorySymptoms = new Map<string, any[]>()
let nextSymptomId = 1

export async function getSymptoms(userId: string) {
  if (!isDbAvailable()) {
    return memorySymptoms.get(userId) || []
  }
  try {
    return await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.userId, userId))
      .orderBy(symptoms.startedAt)
  } catch (error) {
    markDbUnreachable()
    return memorySymptoms.get(userId) || []
  }
}

export async function createSymptom(userId: string, data: SymptomInput) {
  const started = data.startedAt ? new Date(data.startedAt) : new Date()
  const resolved = data.resolvedAt ? new Date(data.resolvedAt) : null

  if (isDbAvailable()) {
    try {
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
      markDbUnreachable()
    }
  }

  const fallback = {
    id: nextSymptomId++,
    userId,
    symptomName: data.symptomName,
    severity: data.severity,
    startedAt: started,
    resolvedAt: resolved,
    bodyPart: data.bodyPart || '',
    notes: data.notes || '',
    createdAt: new Date(),
  }
  const current = memorySymptoms.get(userId) || []
  current.push(fallback)
  memorySymptoms.set(userId, current)
  return fallback
}

export async function deleteSymptom(userId: string, id: number) {
  if (isDbAvailable()) {
    try {
      await db
        .delete(symptoms)
        .where(and(eq(symptoms.id, id), eq(symptoms.userId, userId)))
      return true
    } catch (error) {
      markDbUnreachable()
    }
  }
  const current = memorySymptoms.get(userId) || []
  memorySymptoms.set(
    userId,
    current.filter((s) => s.id !== id)
  )
  return true
}
