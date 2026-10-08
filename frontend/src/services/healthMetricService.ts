import { apiRequest } from './apiClient'

export interface HealthMetricDoc {
  id: number
  userId: string
  metricType: string
  value: string
  unit: string
  recordedAt: string
  source?: string
}

export interface MetricTrendItem {
  metricType: string
  label: string
  unit: string
  hasSufficientData: boolean
  previousValue?: number
  currentValue?: number
  absoluteChange?: number
  percentageChange?: number
  direction?: 'increased' | 'decreased' | 'stable'
  timePeriod?: string
  previousDate?: string
  currentDate?: string
  aiExplanation?: string
}

export interface SymptomTrendItem {
  symptomName: string
  hasSufficientData: boolean
  previousCount: number
  currentCount: number
  absoluteChange: number
  direction: 'increased' | 'decreased' | 'stable'
  timePeriod: string
  aiExplanation?: string
}

export interface HealthTrendsResponse {
  userId: string
  analyzedAt: string
  trends: MetricTrendItem[]
  symptomTrends: SymptomTrendItem[]
  insightsCreated: number
  summary: string
}

export async function getHealthMetrics(metricType?: string): Promise<HealthMetricDoc[]> {
  try {
    const url = metricType ? `/api/health-metrics?type=${encodeURIComponent(metricType)}` : '/api/health-metrics'
    const list = await apiRequest(url)
    return Array.isArray(list) ? list : []
  } catch (err) {
    console.warn('Could not fetch health metrics from PostgreSQL:', err)
    return []
  }
}

export async function recordHealthMetric(
  metric: {
    metricType: string
    value: number | string
    unit: string
    recordedAt?: string
    source?: string
  }
): Promise<HealthMetricDoc> {
  const result = await apiRequest('/api/health-metrics', {
    method: 'POST',
    body: JSON.stringify({
      metricType: metric.metricType,
      value: String(metric.value),
      unit: metric.unit,
      recordedAt: metric.recordedAt || new Date().toISOString(),
      source: metric.source || 'manual',
    }),
  })
  return result
}

export async function recordBatchHealthMetrics(
  metrics: Array<{
    metricType: string
    value: number | string
    unit: string
    recordedAt?: string
    source?: string
  }>
): Promise<HealthMetricDoc[]> {
  const result = await apiRequest('/api/health-metrics/batch', {
    method: 'POST',
    body: JSON.stringify({ metrics }),
  })
  return Array.isArray(result) ? result : []
}

export async function getHealthTrends(): Promise<HealthTrendsResponse | null> {
  try {
    const result = await apiRequest<HealthTrendsResponse>('/api/trends')
    return result
  } catch (err) {
    console.warn('Could not fetch health trends from PostgreSQL:', err)
    return null
  }
}

export async function triggerTrendAnalysis(): Promise<HealthTrendsResponse | null> {
  try {
    const result = await apiRequest<HealthTrendsResponse>('/api/trends/analyze', {
      method: 'POST',
    })
    return result
  } catch (err) {
    console.warn('Could not trigger trend analysis in PostgreSQL:', err)
    return null
  }
}
