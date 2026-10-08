import { apiRequest } from './apiClient'

export interface LabReportDoc {
  id: string
  userId: string
  testName: string
  date: string
  labName: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export async function getLabReports(userId?: string): Promise<LabReportDoc[]> {
  try {
    const list = await apiRequest('/api/lab-reports')
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      userId: item.userId || userId || '',
      testName: item.testName,
      date: item.testDate,
      labName: item.laboratoryName || 'General Diagnostics',
      status: 'Normal',
      notes: item.summary,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }))
  } catch (error) {
    console.warn('Could not fetch lab reports from PostgreSQL:', error)
    return []
  }
}

export async function createLabReport(
  userId: string,
  report: Omit<LabReportDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<LabReportDoc> {
  const result = await apiRequest('/api/lab-reports', {
    method: 'POST',
    body: JSON.stringify({
      testName: report.testName,
      testDate: report.date,
      laboratoryName: report.labName,
      summary: report.notes || '',
    }),
  })

  return {
    id: String(result.id),
    userId,
    testName: result.testName,
    date: result.testDate,
    labName: result.laboratoryName,
    status: 'Normal',
    notes: result.summary,
    createdAt: result.createdAt,
    updatedAt: result.createdAt,
  }
}
