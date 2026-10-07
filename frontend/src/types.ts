export type Lang = 'en' | 'hi'

export interface UserHealthProfile {
  name: string
  email: string
  avatarChar: string
  role: string
  abhaId?: string
  age?: string
  gender?: string
  height?: string
  heightUnit?: string
  weight?: string
  weightUnit?: string
  bloodGroup?: string
  onboarded?: boolean
}

export type HealthConditionId = 'diabetes' | 'blood_pressure' | 'heart' | 'kidney'

export interface HealthMeasurement {
  id: string
  name: string
  value: string
  unit: string
  numericValue: number
  referenceRange: string
  date: string
  status: 'normal' | 'attention' | 'optimal' | 'critical'
  note?: string
}

export interface ConditionInfo {
  id: HealthConditionId
  title: string
  titleHi: string
  subtitle: string
  subtitleHi: string
  simpleExplanation?: string
  simpleExplanationHi?: string
  primaryMeasurementLabel?: string
  primaryMeasurementValue?: string
  primaryMeasurementUnit?: string
  primaryMeasurementDate?: string
  plainStatus?: string
  plainStatusHi?: string
  plainStatusTone?: 'attention' | 'optimal' | 'normal'
  iconName: 'Activity' | 'Heart' | 'Droplets' | 'FlaskConical'
  status: 'attention' | 'optimal' | 'normal' | 'no_data'
  statusLabel: string
  statusLabelHi: string
  keyMetrics: { label: string; value: string; unit: string; status: 'normal' | 'attention' | 'optimal' }[]
  trendSummary: string
  trendSummaryHi: string
  overview: string
  overviewHi: string
  measurements: HealthMeasurement[]
  trendData: { date: string; value: number; label: string; secondary?: number }[]
  relatedMeds: string[]
  relatedReports: { title: string; date: string; summary: string; regionKey?: string; kind?: 'cbc' | 'rx' }[]
  observations: string[]
  aiQuestions: string[]
}

export interface MedicationItem {
  id: string
  name: string
  dose: string
  frequency: string
  frequencyHi?: string
  duration?: string
  dur?: string
  instructions: string
  instructionsHi?: string
  source: string
  conf: number
  status: 'Active' | 'Completed' | 'Pending'
  rxRegion: string
  nextDose?: string
  nextDoseTime?: string
  takenToday?: boolean
  skippedToday?: boolean
  purpose?: string
  purposeHi?: string
  needsVerification?: boolean
  verificationReason?: string
}

export interface DoctorSlot {
  time: string
  available: boolean
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  specialtyHi: string
  clinic: string
  clinicAddress: string
  experience: string
  rating: number
  reviewsCount: number
  avatarChar: string
  availableDates: {
    dateStr: string // e.g. "Tomorrow, 8 Oct"
    displayDay: string // e.g. "Tomorrow"
    slots: string[]
  }[]
}

export interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  specialty: string
  specialtyHi: string
  clinic: string
  date: string
  time: string
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled'
  hasReminder: boolean
  notes?: string
}

export interface HealthAlert {
  id: string
  title: string
  titleHi: string
  description: string
  descriptionHi: string
  type: 'attention' | 'reminder' | 'verification' | 'appointment'
  actionLabel: string
  actionView: string
  source?: string
}
