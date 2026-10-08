import { and, eq } from 'drizzle-orm'
import { db, isDbAvailable, markDbUnreachable } from '../index.ts'
import { labReports, labResults } from '../schema.ts'

export interface LabResultInput {
  biomarker: string
  value: string
  unit: string
  referenceRangeLow?: string
  referenceRangeHigh?: string
  status: string
}

export interface LabReportInput {
  testName: string
  testCategory?: string
  testDate: string
  laboratoryName?: string
  summary?: string
  documentId?: number
  results?: LabResultInput[]
}

const memoryLabReports = new Map<string, any[]>()
let nextReportId = 1

export async function getLabReportsWithResults(userId: string) {
  if (!isDbAvailable()) {
    return memoryLabReports.get(userId) || []
  }
  try {
    const reports = await db
      .select()
      .from(labReports)
      .where(eq(labReports.userId, userId))
      .orderBy(labReports.createdAt)

    const reportIds = reports.map((r) => r.id)
    if (reportIds.length === 0) return []

    const allResults = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, userId))

    return reports.map((report) => ({
      ...report,
      results: allResults.filter((res) => res.reportId === report.id),
    }))
  } catch (error) {
    markDbUnreachable()
    return memoryLabReports.get(userId) || []
  }
}

export async function createLabReport(userId: string, data: LabReportInput) {
  if (isDbAvailable()) {
    try {
      const [report] = await db
        .insert(labReports)
        .values({
          userId,
          testName: data.testName,
          testCategory: data.testCategory || 'General',
          testDate: data.testDate,
          laboratoryName: data.laboratoryName || '',
          summary: data.summary || '',
          documentId: data.documentId || null,
        })
        .returning()

      let insertedResults: any[] = []
      if (data.results && data.results.length > 0) {
        insertedResults = await db
          .insert(labResults)
          .values(
            data.results.map((res) => ({
              reportId: report.id,
              userId,
              biomarker: res.biomarker,
              value: res.value,
              unit: res.unit,
              referenceRangeLow: res.referenceRangeLow || null,
              referenceRangeHigh: res.referenceRangeHigh || null,
              status: res.status,
            }))
          )
          .returning()
      }

      return {
        ...report,
        results: insertedResults,
      }
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallbackReport = {
    id: nextReportId++,
    userId,
    testName: data.testName,
    testCategory: data.testCategory || 'General',
    testDate: data.testDate,
    laboratoryName: data.laboratoryName || '',
    summary: data.summary || '',
    documentId: data.documentId || null,
    createdAt: new Date(),
    results: (data.results || []).map((r, i) => ({
      id: i + 1,
      reportId: nextReportId,
      userId,
      ...r,
      createdAt: new Date(),
    })),
  }
  const current = memoryLabReports.get(userId) || []
  current.push(fallbackReport)
  memoryLabReports.set(userId, current)
  return fallbackReport
}
