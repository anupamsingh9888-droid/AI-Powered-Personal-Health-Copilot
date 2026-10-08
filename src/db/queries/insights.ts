import { and, desc, eq } from 'drizzle-orm'
import { db } from '../index.ts'
import { healthInsights } from '../schema.ts'

export interface InsightInput {
  type: string
  title: string
  description: string
  severity?: string
}

export async function getHealthInsights(userId: string) {
  try {
    return await db
      .select()
      .from(healthInsights)
      .where(eq(healthInsights.userId, userId))
      .orderBy(desc(healthInsights.createdAt))
  } catch (error) {
    console.error('Database query failed in getHealthInsights:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function createHealthInsight(userId: string, data: InsightInput) {
  try {
    const [insight] = await db
      .insert(healthInsights)
      .values({
        userId,
        type: data.type,
        title: data.title,
        description: data.description,
        severity: data.severity || 'info',
        isAcknowledged: false,
      })
      .returning()

    return insight
  } catch (error) {
    console.error('Database query failed in createHealthInsight:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function acknowledgeInsight(userId: string, insightId: number) {
  try {
    const [updated] = await db
      .update(healthInsights)
      .set({ isAcknowledged: true })
      .where(
        and(
          eq(healthInsights.id, insightId),
          eq(healthInsights.userId, userId)
        )
      )
      .returning()

    return updated || null
  } catch (error) {
    console.error('Database query failed in acknowledgeInsight:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
