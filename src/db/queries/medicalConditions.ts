import { and, eq } from 'drizzle-orm'
import { db, isDbConfigured, isDbAvailable, markDbUnreachable } from '../index.ts'
import { medicalConditions } from '../schema.ts'

const memoryConditions = new Map<string, any[]>()
let nextCondId = 1

export async function getMedicalConditions(userId: string) {
  if (!isDbAvailable()) {
    return memoryConditions.get(userId) || []
  }
  try {
    return await db
      .select()
      .from(medicalConditions)
      .where(eq(medicalConditions.userId, userId))
  } catch (error) {
    markDbUnreachable()
    return memoryConditions.get(userId) || []
  }
}

export async function createMedicalCondition(
  userId: string,
  data: { name: string; diagnosedDate?: string; status?: string; notes?: string }
) {
  if (isDbAvailable()) {
    try {
      const result = await db
        .insert(medicalConditions)
        .values({
          userId,
          name: data.name,
          diagnosedDate: data.diagnosedDate || null,
          status: data.status || 'active',
          notes: data.notes || '',
        })
        .returning()

      if (result[0]) return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallback = {
    id: nextCondId++,
    userId,
    name: data.name,
    diagnosedDate: data.diagnosedDate || null,
    status: data.status || 'active',
    notes: data.notes || '',
    createdAt: new Date(),
  }
  const current = memoryConditions.get(userId) || []
  current.push(fallback)
  memoryConditions.set(userId, current)
  return fallback
}

export async function deleteMedicalCondition(userId: string, id: number) {
  if (isDbAvailable()) {
    try {
      await db
        .delete(medicalConditions)
        .where(and(eq(medicalConditions.id, id), eq(medicalConditions.userId, userId)))
      return true
    } catch (error) {
      markDbUnreachable()
    }
  }
  const current = memoryConditions.get(userId) || []
  memoryConditions.set(
    userId,
    current.filter((c) => c.id !== id)
  )
  return true
}
