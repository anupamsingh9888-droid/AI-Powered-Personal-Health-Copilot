import { GoogleGenAI } from '@google/genai'
import { getHealthMetrics, recordHealthMetric } from '../db/queries/healthMetrics.ts'
import { getSymptoms } from '../db/queries/symptoms.ts'
import {
  createHealthInsight,
  getHealthInsights,
} from '../db/queries/insights.ts'

export interface CalculatedMetricTrend {
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

export interface SymptomFrequencyTrend {
  symptomName: string
  hasSufficientData: boolean
  previousCount: number
  currentCount: number
  absoluteChange: number
  direction: 'increased' | 'decreased' | 'stable'
  timePeriod: string
  aiExplanation?: string
}

export interface HealthTrendAnalysisResult {
  userId: string
  analyzedAt: string
  trends: CalculatedMetricTrend[]
  symptomTrends: SymptomFrequencyTrend[]
  insightsCreated: number
  summary: string
}

/**
 * Deterministically analyzes health metrics and symptoms from PostgreSQL.
 * Performs mathematical calculations in application logic.
 */
export async function analyzeHealthTrends(
  userId: string
): Promise<HealthTrendAnalysisResult> {
  // 1. Retrieve all stored historical metrics and symptoms for authenticated user from PostgreSQL
  const [allMetrics, allSymptoms] = await Promise.all([
    getHealthMetrics(userId).catch(() => []),
    getSymptoms(userId).catch(() => []),
  ])

  // Group metrics by normalized type
  const metricGroups = new Map<string, Array<{ value: number; unit: string; date: Date }>>()

  for (const m of allMetrics) {
    const rawType = (m.metricType || '').toLowerCase().trim()
    let normalized = rawType
    if (rawType.includes('sleep')) normalized = 'sleep_duration'
    else if (rawType.includes('step') || rawType.includes('activity')) normalized = 'activity'
    else if (rawType.includes('weight')) normalized = 'weight'
    else if (rawType.includes('heart') || rawType.includes('pulse')) normalized = 'heart_rate'
    else if (rawType.includes('bp') || rawType.includes('blood_pressure') || rawType.includes('systolic'))
      normalized = 'blood_pressure'
    else if (rawType.includes('sugar') || rawType.includes('glucose')) normalized = 'blood_glucose'

    if (!metricGroups.has(normalized)) {
      metricGroups.set(normalized, [])
    }

    const numVal = parseFloat(m.value)
    if (!isNaN(numVal)) {
      metricGroups.get(normalized)!.push({
        value: numVal,
        unit: m.unit,
        date: m.recordedAt ? new Date(m.recordedAt) : new Date(),
      })
    }
  }

  const metricTypeLabels: Record<string, string> = {
    sleep_duration: 'Sleep Duration',
    activity: 'Daily Activity',
    weight: 'Weight',
    heart_rate: 'Resting Heart Rate',
    blood_pressure: 'Blood Pressure',
    blood_glucose: 'Blood Glucose',
  }

  // Calculate deterministic mathematical changes
  const calculatedTrends: CalculatedMetricTrend[] = []

  for (const [mType, readings] of metricGroups.entries()) {
    // Sort chronologically ascending
    readings.sort((a, b) => a.date.getTime() - b.date.getTime())

    if (readings.length < 2) {
      // Phase 3 Rule: Do not generate a trend when insufficient historical data exists
      calculatedTrends.push({
        metricType: mType,
        label: metricTypeLabels[mType] || mType,
        unit: readings[0]?.unit || '',
        hasSufficientData: false,
        currentValue: readings[0]?.value,
        currentDate: readings[0]?.date.toISOString().split('T')[0],
      })
      continue
    }

    const prev = readings[readings.length - 2]
    const curr = readings[readings.length - 1]

    const previousValue = prev.value
    const currentValue = curr.value
    const absoluteChange = Number((currentValue - previousValue).toFixed(2))
    const percentageChange = Number(
      (((currentValue - previousValue) / (previousValue !== 0 ? previousValue : 1)) * 100).toFixed(1)
    )

    let direction: 'increased' | 'decreased' | 'stable' = 'stable'
    if (Math.abs(absoluteChange) >= 0.01) {
      direction = absoluteChange > 0 ? 'increased' : 'decreased'
    }

    const prevDateStr = prev.date.toISOString().split('T')[0]
    const currDateStr = curr.date.toISOString().split('T')[0]

    calculatedTrends.push({
      metricType: mType,
      label: metricTypeLabels[mType] || mType,
      unit: curr.unit,
      hasSufficientData: true,
      previousValue,
      currentValue,
      absoluteChange,
      percentageChange,
      direction,
      timePeriod: `${prevDateStr} to ${currDateStr}`,
      previousDate: prevDateStr,
      currentDate: currDateStr,
    })
  }

  // Symptom frequency trend calculation (last 7 days vs previous 7 days)
  const symptomTrends: SymptomFrequencyTrend[] = []
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000

  const symptomCounts = new Map<string, { current: number; previous: number }>()
  for (const s of allSymptoms) {
    const sDate = s.startedAt ? new Date(s.startedAt).getTime() : 0
    const name = s.symptomName || 'Unspecified Symptom'
    if (!symptomCounts.has(name)) {
      symptomCounts.set(name, { current: 0, previous: 0 })
    }
    const entry = symptomCounts.get(name)!
    if (now - sDate <= sevenDaysMs) {
      entry.current++
    } else if (now - sDate <= fourteenDaysMs) {
      entry.previous++
    }
  }

  for (const [name, counts] of symptomCounts.entries()) {
    const total = counts.current + counts.previous
    if (total === 0) continue

    const change = counts.current - counts.previous
    const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'stable'

    symptomTrends.push({
      symptomName: name,
      hasSufficientData: total >= 1,
      previousCount: counts.previous,
      currentCount: counts.current,
      absoluteChange: change,
      direction,
      timePeriod: 'Last 7 days vs previous 7 days',
    })
  }

  // Phase 4: AI Health Insights generation using verified calculated facts
  const validMetricTrends = calculatedTrends.filter((t) => t.hasSufficientData)
  let generatedInsights: Array<{
    title: string
    description: string
    type: string
    severity: string
  }> = []

  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey && (validMetricTrends.length > 0 || symptomTrends.length > 0)) {
    try {
      const factsPrompt = `VERIFIED FACTUAL HEALTH TRENDS (MATHEMATICALLY CALCULATED):
${validMetricTrends
  .map(
    (t) =>
      `- ${t.label}: Previous = ${t.previousValue} ${t.unit}, Current = ${t.currentValue} ${t.unit}, Change = ${t.absoluteChange! > 0 ? '+' : ''}${t.absoluteChange} ${t.unit} (${t.percentageChange! > 0 ? '+' : ''}${t.percentageChange}%), Direction = ${t.direction}, Period = ${t.timePeriod}`
  )
  .join('\n')}
${symptomTrends
  .map(
    (s) =>
      `- Symptom "${s.symptomName}": Previous 7-day count = ${s.previousCount}, Current 7-day count = ${s.currentCount}, Change = ${s.absoluteChange > 0 ? '+' : ''}${s.absoluteChange}, Direction = ${s.direction}`
  )
  .join('\n')}

SYSTEM INSTRUCTIONS:
Explain these already-calculated numerical facts in natural, encouraging, patient-friendly language.
CRITICAL RULES:
1. DO NOT invent or alter any numbers. Quote exactly the mathematically calculated figures above.
2. DO NOT present insights as definitive clinical diagnoses.
3. Focus on lifestyle context and when to discuss with a physician.

Return a JSON array of insights with objects formatted as:
[
  {
    "title": "Short title (e.g. Sleep Duration Trend)",
    "description": "Factual explanation (e.g. Your average sleep duration decreased by 1.3 hours compared with the previous period (-18%).)",
    "type": "vital" | "exercise" | "food" | "alert",
    "severity": "info" | "warning" | "critical"
  }
]`

      const ai = new GoogleGenAI({})
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: factsPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      })

      const raw = aiResponse.text?.trim()
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          generatedInsights = parsed.map((item) => ({
            title: String(item.title || 'Health Trend Update'),
            description: String(item.description || ''),
            type: ['vital', 'exercise', 'food', 'alert'].includes(item.type)
              ? item.type
              : 'vital',
            severity: ['info', 'warning', 'critical'].includes(item.severity)
              ? item.severity
              : 'info',
          }))
        }
      }
    } catch (err) {
      console.warn('Gemini trend explanation error, using deterministic explanations:', err)
      generatedInsights = buildDeterministicInsights(validMetricTrends, symptomTrends)
    }
  } else {
    // Deterministic factual explanations
    generatedInsights = buildDeterministicInsights(validMetricTrends, symptomTrends)
  }

  // Store new insights in PostgreSQL and link AI explanation to trend objects
  let insightsCreatedCount = 0
  const existingInsights = await getHealthInsights(userId).catch(() => [])

  for (const ins of generatedInsights) {
    // Avoid exact duplicate insights within recent hours
    const duplicate = existingInsights.find(
      (e) => e.title === ins.title && e.description === ins.description
    )
    if (!duplicate) {
      await createHealthInsight(userId, ins).catch((e) =>
        console.warn('Could not store insight in PostgreSQL:', e)
      )
      insightsCreatedCount++
    }
  }

  // Attach explanation to trends
  for (const t of calculatedTrends) {
    if (t.hasSufficientData) {
      const match = generatedInsights.find((i) =>
        i.title.toLowerCase().includes(t.label.toLowerCase())
      )
      t.aiExplanation =
        match?.description ||
        `Your ${t.label.toLowerCase()} ${t.direction} by ${Math.abs(t.absoluteChange!)} ${t.unit} (${Math.abs(t.percentageChange!)}%) compared to the previous reading.`
    } else {
      t.aiExplanation = `Insufficient historical data to calculate a trend for ${t.label}. Record at least two measurements.`
    }
  }

  for (const s of symptomTrends) {
    s.aiExplanation =
      s.direction === 'increased'
        ? `You have recorded ${s.symptomName} more frequently recently (${s.currentCount} vs ${s.previousCount} in the prior period).`
        : s.direction === 'decreased'
        ? `You have recorded ${s.symptomName} less frequently recently (${s.currentCount} vs ${s.previousCount} in the prior period).`
        : `Frequency of ${s.symptomName} remained steady (${s.currentCount} occurrences).`
  }

  const summary =
    validMetricTrends.length > 0
      ? `Successfully analyzed ${validMetricTrends.length} metric trend(s) and generated ${insightsCreatedCount} new insight(s) in PostgreSQL.`
      : 'Insufficient historical measurements to compute longitudinal trends. At least two timestamped readings are required per metric.'

  return {
    userId,
    analyzedAt: new Date().toISOString(),
    trends: calculatedTrends,
    symptomTrends,
    insightsCreated: insightsCreatedCount,
    summary,
  }
}

/**
 * Deterministic explanation builder when Gemini is unavailable.
 * Always strictly quotes the exact calculated numbers without fabricating data.
 */
function buildDeterministicInsights(
  trends: CalculatedMetricTrend[],
  symptoms: SymptomFrequencyTrend[]
) {
  const insights: Array<{
    title: string
    description: string
    type: string
    severity: string
  }> = []

  for (const t of trends) {
    if (!t.hasSufficientData) continue

    const changeSign = t.absoluteChange! > 0 ? '+' : ''
    const pctSign = t.percentageChange! > 0 ? '+' : ''

    if (t.metricType === 'sleep_duration') {
      const isLow = t.currentValue! < 7.0
      insights.push({
        title: 'Sleep Duration Trend',
        description: `Your average sleep duration ${t.direction} by ${Math.abs(t.absoluteChange!)} ${t.unit} (${pctSign}${t.percentageChange}%) compared with the previous period. Current recorded sleep is ${t.currentValue} ${t.unit}.`,
        type: isLow ? 'alert' : 'vital',
        severity: isLow ? 'warning' : 'info',
      })
    } else if (t.metricType === 'activity') {
      insights.push({
        title: 'Activity Level Update',
        description: `Your activity level ${t.direction} compared with the previous period (${changeSign}${t.absoluteChange} ${t.unit}, ${pctSign}${t.percentageChange}%).`,
        type: 'exercise',
        severity: 'info',
      })
    } else if (t.metricType === 'weight') {
      insights.push({
        title: 'Weight Tracking',
        description: `Your weight ${t.direction} by ${Math.abs(t.absoluteChange!)} ${t.unit} (${pctSign}${t.percentageChange}%) between ${t.timePeriod}.`,
        type: 'vital',
        severity: 'info',
      })
    } else if (t.metricType === 'heart_rate') {
      const isElevated = t.currentValue! > 100
      insights.push({
        title: 'Heart Rate Observation',
        description: `Your resting heart rate changed from ${t.previousValue} to ${t.currentValue} ${t.unit} (${changeSign}${t.absoluteChange} ${t.unit}).`,
        type: 'vital',
        severity: isElevated ? 'warning' : 'info',
      })
    } else if (t.metricType === 'blood_glucose') {
      const isHigh = t.currentValue! > 140
      insights.push({
        title: 'Blood Glucose Trend',
        description: `Your recorded blood glucose was ${t.currentValue} ${t.unit} (${changeSign}${t.absoluteChange} ${t.unit} from previous ${t.previousValue} ${t.unit}).`,
        type: isHigh ? 'alert' : 'vital',
        severity: isHigh ? 'warning' : 'info',
      })
    } else if (t.metricType === 'blood_pressure') {
      insights.push({
        title: 'Blood Pressure Record',
        description: `Your systolic blood pressure reading was recorded at ${t.currentValue} ${t.unit} (${changeSign}${t.absoluteChange} ${t.unit} change).`,
        type: 'vital',
        severity: 'info',
      })
    }
  }

  for (const s of symptoms) {
    if (s.direction === 'increased') {
      insights.push({
        title: `Frequent Symptom: ${s.symptomName}`,
        description: `You have recorded "${s.symptomName}" more frequently recently (${s.currentCount} times in the last 7 days compared to ${s.previousCount} previously).`,
        type: 'alert',
        severity: 'warning',
      })
    }
  }

  return insights
}
