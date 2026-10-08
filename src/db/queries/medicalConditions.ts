import { and, eq } from 'drizzle-orm'
import { db } from '../index.ts'
import { medicalConditions } from '../schema.ts'

export async function getMedicalConditions(userId: string) {
  try {
    return await db
      .select()
      .from(medicalConditions)
      .where(eq(medicalConditions.userId, userId))
  } catch (error) {
    console.error('Database query failed in getMedicalConditions:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function createMedicalCondition(
  userId: string,
  data: { name: string; diagnosedDate?: string; status?: string; notes?: string }
) {
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

    return result[0]
  } catch (error) {
    console.error('Database query failed in createMedicalCondition:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function deleteMedicalCondition(userId: string, id: number) {
  try {
    await db
      .delete(medicalConditions)
      .where(and(eq(medicalConditions.id, id), eq(medicalConditions.userId, userId)))
    return true
  } catch (error) {
    console.error('Database query failed in deleteMedicalCondition:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
