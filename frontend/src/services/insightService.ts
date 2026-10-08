import { apiRequest } from './apiClient'

export interface HealthInsightDoc {
  id: string
  userId: string
  title: string
  description: string
  type: 'alert' | 'food' | 'exercise' | 'vital'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export async function getHealthInsights(userId?: string): Promise<HealthInsightDoc[]> {
  try {
    const list = await apiRequest('/api/insights')
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      userId: item.userId || userId || '',
      title: item.title,
      description: item.description,
      type: (item.type as any) || 'vital',
      priority: item.severity === 'critical' ? 'high' : item.severity === 'warning' ? 'medium' : 'low',
      createdAt: item.createdAt,
    }))
  } catch (error) {
    console.warn('Could not fetch health insights from PostgreSQL:', error)
    return []
  }
}

export async function createHealthInsight(
  userId: string,
  insight: Omit<HealthInsightDoc, 'id' | 'userId' | 'createdAt'>
): Promise<HealthInsightDoc> {
  const result = await apiRequest('/api/insights', {
    method: 'POST',
    body: JSON.stringify({
      title: insight.title,
      description: insight.description,
      type: insight.type,
      severity: insight.priority === 'high' ? 'critical' : insight.priority === 'medium' ? 'warning' : 'info',
    }),
  })

  return {
    id: String(result.id),
    userId,
    title: result.title,
    description: result.description,
    type: insight.type,
    priority: insight.priority,
    createdAt: result.createdAt,
  }
}
