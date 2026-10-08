import { and, desc, eq } from 'drizzle-orm'
import { db, isDbAvailable, markDbUnreachable } from '../index.ts'
import { healthMetrics } from '../schema.ts'

export interface HealthMetricInput {
  metricType: string
  value: string
  unit: string
  source?: string
  recordedAt?: Date | string
}

// In-memory fallback cache when PostgreSQL is offline or unprovisioned
const memoryMetricsStore = new Map<string, any[]>()
let nextMetricId = 1

export async function getHealthMetrics(userId: string, metricType?: string) {
  if (!isDbAvailable()) {
    const userList = memoryMetricsStore.get(userId) || []
    if (metricType) {
      return userList.filter((m) => m.metricType === metricType)
    }
    return userList
  }
  try {
    if (metricType) {
      return await db
        .select()
        .from(healthMetrics)
        .where(
          and(
            eq(healthMetrics.userId, userId),
            eq(healthMetrics.metricType, metricType)
          )
        )
        .orderBy(desc(healthMetrics.recordedAt))
    }

    return await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(desc(healthMetrics.recordedAt))
  } catch (error) {
    markDbUnreachable()
    const userList = memoryMetricsStore.get(userId) || []
    if (metricType) {
      return userList.filter((m) => m.metricType === metricType)
    }
    return userList
  }
}

export async function recordHealthMetric(
  userId: string,
  data: HealthMetricInput
) {
  const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date()

  if (isDbAvailable()) {
    try {
      const result = await db
        .insert(healthMetrics)
        .values({
          userId,
          metricType: data.metricType,
          value: data.value,
          unit: data.unit,
          source: data.source || 'manual',
          recordedAt,
        })
        .returning()

      if (result[0]) return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallbackItem = {
    id: nextMetricId++,
    userId,
    metricType: data.metricType,
    value: String(data.value),
    unit: data.unit,
    source: data.source || 'manual',
    recordedAt,
  }
  const current = memoryMetricsStore.get(userId) || []
  current.unshift(fallbackItem)
  memoryMetricsStore.set(userId, current)
  return fallbackItem
}
