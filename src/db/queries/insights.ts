import { and, desc, eq } from 'drizzle-orm'
import { db, isDbConfigured, isDbAvailable, markDbUnreachable } from '../index.ts'
import { healthInsights } from '../schema.ts'

export interface InsightInput {
  type: string
  title: string
  description: string
  severity?: string
}

// In-memory fallback cache when PostgreSQL is offline or unprovisioned
const memoryInsightsStore = new Map<string, any[]>()
let nextInsightId = 1

export async function getHealthInsights(userId: string) {
  if (!isDbAvailable()) {
    return memoryInsightsStore.get(userId) || []
  }
  try {
    return await db
      .select()
      .from(healthInsights)
      .where(eq(healthInsights.userId, userId))
      .orderBy(desc(healthInsights.createdAt))
  } catch (error) {
    markDbUnreachable()
    return memoryInsightsStore.get(userId) || []
  }
}

export async function createHealthInsight(userId: string, data: InsightInput) {
  if (isDbAvailable()) {
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

      if (insight) return insight
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallback = {
    id: nextInsightId++,
    userId,
    type: data.type,
    title: data.title,
    description: data.description,
    severity: data.severity || 'info',
    isAcknowledged: false,
    createdAt: new Date(),
  }
  const current = memoryInsightsStore.get(userId) || []
  current.unshift(fallback)
  memoryInsightsStore.set(userId, current)
  return fallback
}

export async function acknowledgeInsight(userId: string, insightId: number) {
  if (isDbAvailable()) {
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

      if (updated) return updated
    } catch (error) {
      markDbUnreachable()
    }
  }

  const current = memoryInsightsStore.get(userId) || []
  const item = current.find((i) => i.id === insightId)
  if (item) item.isAcknowledged = true
  return item || null
}
