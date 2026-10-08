import type { IncomingMessage, ServerResponse } from 'node:http'
import { verifyTokenFromHeader } from '../middleware/auth.ts'
import { getOrCreateUser, getUserByUid } from '../db/queries/users.ts'
import {
  getHealthProfile,
  upsertHealthProfile,
} from '../db/queries/healthProfiles.ts'
import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from '../db/queries/medications.ts'
import {
  getMedicalConditions,
  createMedicalCondition,
  deleteMedicalCondition,
} from '../db/queries/medicalConditions.ts'
import {
  getLabReportsWithResults,
  createLabReport,
} from '../db/queries/labReports.ts'
import {
  getSymptoms,
  createSymptom,
  deleteSymptom,
} from '../db/queries/symptoms.ts'
import {
  getHealthMetrics,
  recordHealthMetric,
} from '../db/queries/healthMetrics.ts'
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  addChatMessage,
} from '../db/queries/chat.ts'
import {
  getHealthInsights,
  createHealthInsight,
  acknowledgeInsight,
} from '../db/queries/insights.ts'
import {
  getMedicalDocuments,
  getMedicalDocumentById,
  createMedicalDocument,
  updateMedicalDocumentStatus,
  deleteMedicalDocument,
} from '../db/queries/medicalDocuments.ts'
import {
  runOcrPipeline,
} from '../services/ocrPipeline.ts'
import {
  getStructuredMedicalDataByDocument,
  getAllStructuredMedicalData,
  updateStructuredDataReview,
} from '../db/queries/structuredMedicalData.ts'
import { processHealthChat } from '../services/healthChatService.ts'
import { analyzeHealthTrends } from '../services/healthTrendService.ts'

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

export async function handleApiRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const urlObj = new URL(req.url || '/', 'http://localhost')
  const pathname = urlObj.pathname
  const method = req.method?.toUpperCase() || 'GET'

  if (!pathname.startsWith('/api/')) {
    return false
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )

  if (method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }

  // Verify Auth token
  const authHeader = req.headers.authorization
  const authUser = await verifyTokenFromHeader(authHeader)

  if (!authUser) {
    sendJson(res, 401, {
      error: 'Unauthorized: Valid Firebase ID Token is required',
    })
    return true
  }

  const userId = authUser.uid

  try {
    // 1. User Sync
    if (pathname === '/api/users/sync' && method === 'POST') {
      const body = await parseBody(req)
      const user = await getOrCreateUser(
        userId,
        body.email || authUser.email || '',
        body.displayName || authUser.name,
        body.photoUrl || authUser.picture
      )
      sendJson(res, 200, user)
      return true
    }

    if (pathname === '/api/users/me' && method === 'GET') {
      let user = await getUserByUid(userId)
      if (!user) {
        user = await getOrCreateUser(
          userId,
          authUser.email || '',
          authUser.name,
          authUser.picture
        )
      }
      sendJson(res, 200, user)
      return true
    }

    // 2. Health Profile
    if (pathname === '/api/health-profile') {
      if (method === 'GET') {
        const profile = await getHealthProfile(userId)
        const userRec = await getUserByUid(userId)
        sendJson(res, 200, {
          ...(profile || {}),
          displayName: profile?.fullName || userRec?.displayName || authUser.name || '',
          email: userRec?.email || authUser.email || '',
        })
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)

        // Validate user inputs
        if (body.age !== undefined && body.age !== null && body.age !== '') {
          const ageNum = Number(body.age)
          if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
            sendJson(res, 400, { error: 'Please enter a valid age between 0 and 130.' })
            return true
          }
        }
        if (body.height !== undefined && body.height !== null && body.height !== '') {
          const heightNum = Number(body.height)
          if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
            sendJson(res, 400, { error: 'Please enter a valid height in cm (1-300).' })
            return true
          }
        }
        if (body.weight !== undefined && body.weight !== null && body.weight !== '') {
          const weightNum = Number(body.weight)
          if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
            sendJson(res, 400, { error: 'Please enter a valid weight in kg (1-500).' })
            return true
          }
        }

        const profile = await upsertHealthProfile(userId, body)
        if (body.fullName || body.name) {
          const newName = body.fullName || body.name
          await getOrCreateUser(
            userId,
            authUser.email || '',
            newName,
            authUser.picture
          )
        }
        sendJson(res, 200, profile)
        return true
      }
    }

    // 3. Medications
    if (pathname === '/api/medications') {
      if (method === 'GET') {
        const list = await getMedications(userId)
        sendJson(res, 200, list)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const med = await createMedication(userId, body)
        sendJson(res, 201, med)
        return true
      }
    }

    const medMatch = pathname.match(/^\/api\/medications\/(\d+)$/)
    if (medMatch) {
      const medId = parseInt(medMatch[1], 10)
      if (method === 'PUT') {
        const body = await parseBody(req)
        const updated = await updateMedication(userId, medId, body)
        sendJson(res, 200, updated)
        return true
      }
      if (method === 'DELETE') {
        await deleteMedication(userId, medId)
        sendJson(res, 200, { success: true })
        return true
      }
    }

    // 4. Medical Conditions
    if (pathname === '/api/medical-conditions') {
      if (method === 'GET') {
        const list = await getMedicalConditions(userId)
        sendJson(res, 200, list)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const cond = await createMedicalCondition(userId, body)
        sendJson(res, 201, cond)
        return true
      }
    }

    const condMatch = pathname.match(/^\/api\/medical-conditions\/(\d+)$/)
    if (condMatch && method === 'DELETE') {
      const condId = parseInt(condMatch[1], 10)
      await deleteMedicalCondition(userId, condId)
      sendJson(res, 200, { success: true })
      return true
    }

    // 5. Lab Reports & Results
    if (pathname === '/api/lab-reports') {
      if (method === 'GET') {
        const reports = await getLabReportsWithResults(userId)
        sendJson(res, 200, reports)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const report = await createLabReport(userId, body)
        sendJson(res, 201, report)
        return true
      }
    }

    // 6. Symptoms
    if (pathname === '/api/symptoms') {
      if (method === 'GET') {
        const list = await getSymptoms(userId)
        sendJson(res, 200, list)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const symptom = await createSymptom(userId, body)
        sendJson(res, 201, symptom)
        return true
      }
    }

    const symptomMatch = pathname.match(/^\/api\/symptoms\/(\d+)$/)
    if (symptomMatch && method === 'DELETE') {
      const sId = parseInt(symptomMatch[1], 10)
      await deleteSymptom(userId, sId)
      sendJson(res, 200, { success: true })
      return true
    }

    // 7. Health Metrics
    if (pathname === '/api/health-metrics') {
      if (method === 'GET') {
        const metricType = urlObj.searchParams.get('type') || undefined
        const metrics = await getHealthMetrics(userId, metricType)
        sendJson(res, 200, metrics)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const metric = await recordHealthMetric(userId, body)
        sendJson(res, 201, metric)
        return true
      }
    }

    if (pathname === '/api/health-metrics/batch' && method === 'POST') {
      const body = await parseBody(req)
      const list = Array.isArray(body) ? body : Array.isArray(body.metrics) ? body.metrics : [body]
      const results = []
      for (const item of list) {
        if (item && item.metricType && item.value !== undefined) {
          const rec = await recordHealthMetric(userId, item)
          results.push(rec)
        }
      }
      sendJson(res, 201, results)
      return true
    }

    // AI Health Chat (Phase 1)
    if (pathname === '/api/chat/ask' && method === 'POST') {
      const body = await parseBody(req)
      const message = body.message || body.prompt || body.text || ''
      const sessionId = body.sessionId ? Number(body.sessionId) : undefined
      const response = await processHealthChat({
        userId,
        userMessage: message,
        sessionId,
      })
      sendJson(res, 200, response)
      return true
    }

    // 8. Chat Sessions & Messages
    if (pathname === '/api/chat/sessions') {
      if (method === 'GET') {
        const sessions = await getChatSessions(userId)
        sendJson(res, 200, sessions)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const session = await createChatSession(
          userId,
          body.title || 'Health Inquiry',
          body.category
        )
        sendJson(res, 201, session)
        return true
      }
    }

    const sessionMatch = pathname.match(/^\/api\/chat\/sessions\/(\d+)$/)
    if (sessionMatch && method === 'DELETE') {
      const sId = parseInt(sessionMatch[1], 10)
      await deleteChatSession(userId, sId)
      sendJson(res, 200, { success: true })
      return true
    }

    const sessionMessagesMatch = pathname.match(
      /^\/api\/chat\/sessions\/(\d+)\/messages$/
    )
    if (sessionMessagesMatch) {
      const sId = parseInt(sessionMessagesMatch[1], 10)
      if (method === 'GET') {
        const messages = await getChatMessages(userId, sId)
        sendJson(res, 200, messages)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const msg = await addChatMessage(
          userId,
          sId,
          body.sender || 'user',
          body.text || '',
          body.citations || [],
          body.triageLevel || 'none'
        )
        sendJson(res, 201, msg)
        return true
      }
    }

    // 9. Health Insights
    if (pathname === '/api/insights') {
      if (method === 'GET') {
        const insights = await getHealthInsights(userId)
        sendJson(res, 200, insights)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const insight = await createHealthInsight(userId, body)
        sendJson(res, 201, insight)
        return true
      }
    }

    const ackInsightMatch = pathname.match(
      /^\/api\/insights\/(\d+)\/acknowledge$/
    )
    if (ackInsightMatch && (method === 'POST' || method === 'PUT')) {
      const iId = parseInt(ackInsightMatch[1], 10)
      const updated = await acknowledgeInsight(userId, iId)
      sendJson(res, 200, updated)
      return true
    }

    // Health Trends Engine & AI Insights (Phases 3 & 4)
    if ((pathname === '/api/trends' || pathname === '/api/trends/analyze') && (method === 'GET' || method === 'POST')) {
      const trendResult = await analyzeHealthTrends(userId)
      sendJson(res, 200, trendResult)
      return true
    }

    // 10. Medical Documents
    if (pathname === '/api/medical-documents' || pathname === '/api/documents') {
      if (method === 'GET') {
        const docs = await getMedicalDocuments(userId)
        sendJson(res, 200, docs)
        return true
      }
      if (method === 'POST') {
        const body = await parseBody(req)

        // Validate processing status if specified
        const allowedStatuses = ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED']
        const status = body.processingStatus
          ? String(body.processingStatus).toUpperCase()
          : 'UPLOADED'
        if (body.processingStatus && !allowedStatuses.includes(status)) {
          sendJson(res, 400, {
            error: `Invalid processingStatus. Must be one of: ${allowedStatuses.join(', ')}`,
          })
          return true
        }

        const docType = body.docType || body.documentType || 'General Medical'
        const originalFilename =
          body.originalFilename ||
          body.fileName ||
          body.name ||
          'document.pdf'

        const doc = await createMedicalDocument(userId, {
          title: body.title || originalFilename,
          docType,
          originalFilename,
          fileName: originalFilename,
          fileUrl: body.fileUrl || '',
          fileSize: Number(body.fileSize) || 0,
          mimeType: body.mimeType || 'application/pdf',
          processingStatus: status,
        })
        sendJson(res, 201, doc)
        return true
      }
    }

    const docMatch = pathname.match(/^\/api\/(?:medical-documents|documents)\/(\d+)$/)
    if (docMatch) {
      const docId = parseInt(docMatch[1], 10)
      if (method === 'GET') {
        const doc = await getMedicalDocumentById(userId, docId)
        if (!doc) {
          sendJson(res, 404, { error: 'Document not found' })
          return true
        }
        sendJson(res, 200, doc)
        return true
      }
      if (method === 'PUT' || method === 'PATCH') {
        const body = await parseBody(req)
        const allowedStatuses = ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED']
        const status = String(body.processingStatus || body.status || 'UPLOADED').toUpperCase()
        if (!allowedStatuses.includes(status)) {
          sendJson(res, 400, {
            error: `Invalid processingStatus. Must be one of: ${allowedStatuses.join(', ')}`,
          })
          return true
        }
        const updated = await updateMedicalDocumentStatus(userId, docId, status)
        if (!updated) {
          sendJson(res, 404, { error: 'Document not found or unauthorized' })
          return true
        }
        sendJson(res, 200, updated)
        return true
      }
      if (method === 'DELETE') {
        await deleteMedicalDocument(userId, docId)
        sendJson(res, 200, { success: true })
        return true
      }
    }

    // 11. OCR-to-Structured-Medical-Data Pipeline Routes (OCR -> Gemini -> Structured JSON -> PostgreSQL)
    if (pathname === '/api/pipeline/ocr-to-structured' && method === 'POST') {
      const body = await parseBody(req)
      const rawOcrText = body.rawOcrText || body.rawText || ''
      if (!rawOcrText || typeof rawOcrText !== 'string' || rawOcrText.trim().length === 0) {
        sendJson(res, 400, {
          error: 'rawOcrText is required and must not be empty.',
        })
        return true
      }

      let docId = Number(body.documentId)
      // If no document exists yet, auto-create a linked document record
      if (!docId || isNaN(docId)) {
        const createdDoc = await createMedicalDocument(userId, {
          title: body.title || body.originalFilename || 'Uploaded OCR Document',
          docType: body.docType || body.documentType || 'General Medical',
          originalFilename: body.originalFilename || 'document.pdf',
          processingStatus: 'PROCESSING',
        })
        docId = Number(createdDoc.documentId)
      }

      const result = await runOcrPipeline({
        documentId: docId,
        userId,
        rawOcrText,
        ocrConfidence:
          body.ocrConfidence !== undefined && body.ocrConfidence !== null
            ? Number(body.ocrConfidence)
            : null,
        documentType: body.docType || body.documentType,
        originalFilename: body.originalFilename,
      })

      sendJson(res, 200, result)
      return true
    }

    // Fetch structured data linked to a specific document
    const docStructuredMatch = pathname.match(
      /^\/api\/(?:medical-documents|documents)\/(\d+)\/structured$/
    )
    if (docStructuredMatch && method === 'GET') {
      const docId = parseInt(docStructuredMatch[1], 10)
      const data = await getStructuredMedicalDataByDocument(userId, docId)
      if (!data) {
        sendJson(res, 404, {
          error: 'Structured data not found for this document.',
        })
        return true
      }
      sendJson(res, 200, data)
      return true
    }

    // Trigger OCR pipeline for an existing document
    const docProcessOcrMatch = pathname.match(
      /^\/api\/(?:medical-documents|documents)\/(\d+)\/process-ocr$/
    )
    if (docProcessOcrMatch && method === 'POST') {
      const docId = parseInt(docProcessOcrMatch[1], 10)
      const existingDoc = await getMedicalDocumentById(userId, docId)
      if (!existingDoc) {
        sendJson(res, 404, { error: 'Document not found.' })
        return true
      }

      const body = await parseBody(req)
      const rawOcrText = body.rawOcrText || body.rawText || ''
      if (!rawOcrText) {
        sendJson(res, 400, {
          error: 'rawOcrText is required to process document.',
        })
        return true
      }

      const result = await runOcrPipeline({
        documentId: docId,
        userId,
        rawOcrText,
        ocrConfidence:
          body.ocrConfidence !== undefined && body.ocrConfidence !== null
            ? Number(body.ocrConfidence)
            : null,
        documentType: existingDoc.docType,
        originalFilename: existingDoc.originalFilename || existingDoc.fileName,
      })

      sendJson(res, 200, result)
      return true
    }

    // List all structured medical data records in PostgreSQL for user
    if (pathname === '/api/structured-data' && method === 'GET') {
      const allData = await getAllStructuredMedicalData(userId)
      sendJson(res, 200, allData)
      return true
    }

    // Review & confirm structured medical data
    const reviewMatch = pathname.match(/^\/api\/structured-data\/(\d+)\/review$/)
    if (reviewMatch && (method === 'PATCH' || method === 'POST')) {
      const sId = parseInt(reviewMatch[1], 10)
      const body = await parseBody(req)
      const reviewStatus = body.reviewStatus || 'VERIFIED'
      const updated = await updateStructuredDataReview(
        userId,
        sId,
        reviewStatus,
        body.updatedFields
      )
      sendJson(res, 200, updated)
      return true
    }

    sendJson(res, 404, { error: 'API endpoint not found' })
    return true
  } catch (error: any) {
    console.warn('API error encountered:', error)
    sendJson(res, 500, {
      error: error.message || 'Internal server error while accessing database',
    })
    return true
  }
}
