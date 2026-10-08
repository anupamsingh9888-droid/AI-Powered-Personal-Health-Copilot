import { and, desc, eq } from 'drizzle-orm'
import { db } from '../index.ts'
import { healthMetrics } from '../schema.ts'

export interface HealthMetricInput {
  metricType: string
  value: string
  unit: string
  source?: string
  recordedAt?: Date | string
}

export async function getHealthMetrics(userId: string, metricType?: string) {
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
    console.error('Database query failed in getHealthMetrics:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function recordHealthMetric(
  userId: string,
  data: HealthMetricInput
) {
  try {
    const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date()

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

    return result[0]
  } catch (error) {
    console.error('Database query failed in recordHealthMetric:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
