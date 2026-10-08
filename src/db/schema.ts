import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// 1. Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 2. Health Profiles table
export const healthProfiles = pgTable('health_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  age: integer('age'),
  gender: text('gender'),
  height: numeric('height', { precision: 5, scale: 2 }),
  heightUnit: text('height_unit').default('cm'),
  weight: numeric('weight', { precision: 5, scale: 2 }),
  weightUnit: text('weight_unit').default('kg'),
  bloodGroup: text('blood_group'),
  bmi: numeric('bmi', { precision: 4, scale: 1 }),
  fullName: text('full_name'),
  dateOfBirth: text('date_of_birth'),
  emergencyContact: text('emergency_contact'),
  existingConditions: jsonb('existing_conditions').default([]),
  currentMedications: jsonb('current_medications').default([]),
  allergies: jsonb('allergies').default([]),
  lifestyleFactors: jsonb('lifestyle_factors').default({}),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 3. Medical Conditions
export const medicalConditions = pgTable('medical_conditions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  diagnosedDate: text('diagnosed_date'),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 4. Medical Documents
export const medicalDocuments = pgTable('medical_documents', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull().default('Medical Document'),
  docType: text('doc_type').notNull(),
  fileUrl: text('file_url').default(''),
  fileName: text('file_name').notNull(),
  originalFilename: text('original_filename'),
  fileSize: integer('file_size').default(0),
  mimeType: text('mime_type').default('application/octet-stream'),
  processingStatus: text('processing_status').notNull().default('UPLOADED'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
})

// 5. OCR Results
export const ocrResults = pgTable('ocr_results', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id')
    .references(() => medicalDocuments.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  rawText: text('raw_text'),
  extractedEntities: jsonb('extracted_entities').default({}),
  confidenceScore: numeric('confidence_score', { precision: 4, scale: 3 }),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
})

// 5b. Structured Medical Data (OCR -> Gemini -> PostgreSQL pipeline)
export const structuredMedicalData = pgTable('structured_medical_data', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id')
    .references(() => medicalDocuments.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  ocrResultId: integer('ocr_result_id').references(() => ocrResults.id, {
    onDelete: 'set null',
  }),
  rawOcrText: text('raw_ocr_text').notNull(),
  ocrConfidence: numeric('ocr_confidence', { precision: 5, scale: 4 }),
  patientName: text('patient_name'),
  documentDate: text('document_date'),
  doctorName: text('doctor_name'),
  diagnosesMentioned: jsonb('diagnoses_mentioned').default([]),
  medications: jsonb('medications').default([]),
  laboratoryTests: jsonb('laboratory_tests').default([]),
  uncertainFields: jsonb('uncertain_fields').default([]),
  requiresReview: boolean('requires_review').default(false),
  reviewStatus: text('review_status').default('PENDING_REVIEW'),
  clinicalDisclaimer: text('clinical_disclaimer').default(
    'Not a confirmed medical diagnosis. Information extracted from document text for informational reference only. Consult your doctor.'
  ),
  structuredJson: jsonb('structured_json').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 6. Medications
export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  timeOfDay: jsonb('time_of_day').default([]),
  instructions: text('instructions'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  adherenceRate: integer('adherence_rate').default(100),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 7. Lab Reports
export const labReports = pgTable('lab_reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  documentId: integer('document_id').references(() => medicalDocuments.id, {
    onDelete: 'set null',
  }),
  testName: text('test_name').notNull(),
  testCategory: text('test_category'),
  testDate: text('test_date').notNull(),
  laboratoryName: text('laboratory_name'),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 8. Lab Results
export const labResults = pgTable('lab_results', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id')
    .references(() => labReports.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  biomarker: text('biomarker').notNull(),
  value: numeric('value', { precision: 8, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  referenceRangeLow: numeric('reference_range_low', { precision: 8, scale: 2 }),
  referenceRangeHigh: numeric('reference_range_high', { precision: 8, scale: 2 }),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 9. Symptoms
export const symptoms = pgTable('symptoms', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  symptomName: text('symptom_name').notNull(),
  severity: text('severity').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  bodyPart: text('body_part'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 10. Health Metrics
export const healthMetrics = pgTable(
  'health_metrics',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.uid, { onDelete: 'cascade' })
      .notNull(),
    metricType: text('metric_type').notNull(),
    value: numeric('value', { precision: 6, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
    source: text('source').default('manual'),
  },
  (table) => [
    index('idx_health_metrics_user_recorded').on(table.userId, table.recordedAt),
    index('idx_health_metrics_user_type_recorded').on(table.userId, table.metricType, table.recordedAt),
  ]
)

// 11. Chat Sessions
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  category: text('category').default('general'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 12. Chat Messages
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id')
      .references(() => chatSessions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.uid, { onDelete: 'cascade' })
      .notNull(),
    sender: text('sender').notNull(),
    text: text('text').notNull(),
    citations: jsonb('citations').default([]),
    triageLevel: text('triage_level').default('none'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_chat_messages_session_created').on(table.sessionId, table.createdAt),
    index('idx_chat_messages_user_created').on(table.userId, table.createdAt),
  ]
)

// 13. Health Insights
export const healthInsights = pgTable('health_insights', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity').default('info'),
  isAcknowledged: boolean('is_acknowledged').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  healthProfile: one(healthProfiles, {
    fields: [users.uid],
    references: [healthProfiles.userId],
  }),
  medicalConditions: many(medicalConditions),
  medicalDocuments: many(medicalDocuments),
  medications: many(medications),
  labReports: many(labReports),
  symptoms: many(symptoms),
  healthMetrics: many(healthMetrics),
  chatSessions: many(chatSessions),
  healthInsights: many(healthInsights),
}))

export const healthProfilesRelations = relations(healthProfiles, ({ one }) => ({
  user: one(users, {
    fields: [healthProfiles.userId],
    references: [users.uid],
  }),
}))

export const medicalDocumentsRelations = relations(medicalDocuments, ({ one }) => ({
  user: one(users, {
    fields: [medicalDocuments.userId],
    references: [users.uid],
  }),
  ocrResult: one(ocrResults, {
    fields: [medicalDocuments.id],
    references: [ocrResults.documentId],
  }),
  structuredData: one(structuredMedicalData, {
    fields: [medicalDocuments.id],
    references: [structuredMedicalData.documentId],
  }),
}))

export const structuredMedicalDataRelations = relations(
  structuredMedicalData,
  ({ one }) => ({
    document: one(medicalDocuments, {
      fields: [structuredMedicalData.documentId],
      references: [medicalDocuments.id],
    }),
    user: one(users, {
      fields: [structuredMedicalData.userId],
      references: [users.uid],
    }),
    ocrResult: one(ocrResults, {
      fields: [structuredMedicalData.ocrResultId],
      references: [ocrResults.id],
    }),
  })
)

export const labReportsRelations = relations(labReports, ({ one, many }) => ({
  user: one(users, {
    fields: [labReports.userId],
    references: [users.uid],
  }),
  document: one(medicalDocuments, {
    fields: [labReports.documentId],
    references: [medicalDocuments.id],
  }),
  results: many(labResults),
}))

export const labResultsRelations = relations(labResults, ({ one }) => ({
  report: one(labReports, {
    fields: [labResults.reportId],
    references: [labReports.id],
  }),
  user: one(users, {
    fields: [labResults.userId],
    references: [users.uid],
  }),
}))

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.uid],
  }),
  messages: many(chatMessages),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.uid],
  }),
}))
