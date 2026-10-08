import { apiRequest } from './apiClient'
import type { PersonalHealthData } from '../HealthOnboarding'

export interface HealthProfileDoc {
  userId: string
  fullName: string
  age: string
  gender: string
  height: string
  heightUnit: string
  weight: string
  weightUnit: string
  bloodGroup: string
  bmi: number
  dateOfBirth?: string
  emergencyContact?: string
  allergies?: string[]
  existingConditions?: string[]
  currentMedications?: string[]
  createdAt: string
  updatedAt: string
}

export async function getHealthProfile(userId?: string): Promise<HealthProfileDoc | null> {
  try {
    const data = await apiRequest('/api/health-profile')
    if (!data) return null
    return {
      userId: data.userId || userId || '',
      fullName: data.fullName || data.displayName || '',
      age: data.age !== null && data.age !== undefined ? String(data.age) : '',
      gender: data.gender || '',
      height: data.height ? String(data.height) : '',
      heightUnit: data.heightUnit || 'cm',
      weight: data.weight ? String(data.weight) : '',
      weightUnit: data.weightUnit || 'kg',
      bloodGroup: data.bloodGroup || '',
      bmi: data.bmi ? parseFloat(data.bmi) : 22.0,
      dateOfBirth: data.dateOfBirth || '',
      emergencyContact: data.emergencyContact || '',
      allergies: Array.isArray(data.allergies) ? data.allergies : [],
      existingConditions: Array.isArray(data.existingConditions) ? data.existingConditions : [],
      currentMedications: Array.isArray(data.currentMedications) ? data.currentMedications : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    }
  } catch (error) {
    console.warn('Could not fetch health profile from PostgreSQL:', error)
    return null
  }
}

export async function updateHealthProfile(
  data: {
    fullName?: string
    age?: string
    gender?: string
    height?: string
    heightUnit?: string
    weight?: string
    weightUnit?: string
    bloodGroup?: string
    dateOfBirth?: string
    emergencyContact?: string
    allergies?: string[]
    existingConditions?: string[]
    currentMedications?: string[]
  }
): Promise<HealthProfileDoc> {
  // Input validations
  if (data.age && (isNaN(Number(data.age)) || Number(data.age) < 0 || Number(data.age) > 130)) {
    throw new Error('Please enter a valid age between 0 and 130.')
  }
  if (data.height && (isNaN(Number(data.height)) || Number(data.height) <= 0 || Number(data.height) > 300)) {
    throw new Error('Please enter a valid height (1-300 cm).')
  }
  if (data.weight && (isNaN(Number(data.weight)) || Number(data.weight) <= 0 || Number(data.weight) > 500)) {
    throw new Error('Please enter a valid weight (1-500 kg).')
  }

  let calculatedBmi: number | null = null
  const h = data.height ? parseFloat(data.height) : 0
  const w = data.weight ? parseFloat(data.weight) : 0
  if (h > 0 && w > 0) {
    const heightInMeters = (data.heightUnit || 'cm') === 'cm' ? h / 100 : (h * 30.48) / 100
    const weightInKg = (data.weightUnit || 'kg') === 'kg' ? w : w * 0.453592
    calculatedBmi = +(weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
  }

  const payload: Record<string, any> = {
    fullName: data.fullName,
    age: data.age ? parseInt(data.age, 10) : null,
    gender: data.gender,
    height: data.height,
    heightUnit: data.heightUnit || 'cm',
    weight: data.weight,
    weightUnit: data.weightUnit || 'kg',
    bloodGroup: data.bloodGroup,
    dateOfBirth: data.dateOfBirth,
    emergencyContact: data.emergencyContact,
    allergies: data.allergies || [],
    existingConditions: data.existingConditions || [],
    currentMedications: data.currentMedications || [],
    onboardingCompleted: true,
  }
  if (calculatedBmi) {
    payload.bmi = String(calculatedBmi)
  }

  const saved = await apiRequest('/api/health-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return {
    userId: saved.userId || '',
    fullName: saved.fullName || data.fullName || '',
    age: saved.age ? String(saved.age) : data.age || '',
    gender: saved.gender || data.gender || '',
    height: saved.height ? String(saved.height) : data.height || '',
    heightUnit: saved.heightUnit || data.heightUnit || 'cm',
    weight: saved.weight ? String(saved.weight) : data.weight || '',
    weightUnit: saved.weightUnit || data.weightUnit || 'kg',
    bloodGroup: saved.bloodGroup || data.bloodGroup || '',
    bmi: saved.bmi ? parseFloat(saved.bmi) : (calculatedBmi || 22.0),
    dateOfBirth: saved.dateOfBirth || data.dateOfBirth || '',
    emergencyContact: saved.emergencyContact || data.emergencyContact || '',
    allergies: saved.allergies || data.allergies || [],
    existingConditions: saved.existingConditions || data.existingConditions || [],
    currentMedications: saved.currentMedications || data.currentMedications || [],
    createdAt: saved.createdAt || new Date().toISOString(),
    updatedAt: saved.updatedAt || new Date().toISOString(),
  }
}

export async function saveHealthProfile(
  userId: string,
  data: PersonalHealthData,
  bmi?: number | null
): Promise<HealthProfileDoc> {
  let calculatedBmi = bmi ?? 22.0
  if (!bmi) {
    const h = parseFloat(data.height)
    const w = parseFloat(data.weight)
    if (h > 0 && w > 0) {
      const heightInMeters = data.heightUnit === 'cm' ? h / 100 : (h * 30.48) / 100
      const weightInKg = data.weightUnit === 'kg' ? w : w * 0.453592
      calculatedBmi = +(weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
    }
  }

  const payload = {
    age: data.age ? parseInt(data.age, 10) : null,
    gender: data.gender,
    height: data.height,
    heightUnit: data.heightUnit,
    weight: data.weight,
    weightUnit: data.weightUnit,
    bloodGroup: data.bloodGroup,
    bmi: String(calculatedBmi || 22.0),
    onboardingCompleted: true,
  }

  const saved = await apiRequest('/api/health-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return {
    userId,
    fullName: data.fullName,
    age: data.age,
    gender: data.gender,
    height: data.height,
    heightUnit: data.heightUnit,
    weight: data.weight,
    weightUnit: data.weightUnit,
    bloodGroup: data.bloodGroup,
    bmi: calculatedBmi || 22.0,
    createdAt: saved.createdAt || new Date().toISOString(),
    updatedAt: saved.updatedAt || new Date().toISOString(),
  }
}
