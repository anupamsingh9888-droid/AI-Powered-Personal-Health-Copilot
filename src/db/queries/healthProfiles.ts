import { eq } from 'drizzle-orm'
import { db, isDbAvailable, markDbUnreachable } from '../index.ts'
import { healthProfiles } from '../schema.ts'

export interface HealthProfileInput {
  fullName?: string
  dateOfBirth?: string
  emergencyContact?: string
  existingConditions?: string[]
  currentMedications?: string[]
  age?: number
  gender?: string
  height?: string
  heightUnit?: string
  weight?: string
  weightUnit?: string
  bloodGroup?: string
  bmi?: string
  allergies?: string[]
  lifestyleFactors?: Record<string, any>
  onboardingCompleted?: boolean
}

const memoryProfiles = new Map<string, any>()

export async function getHealthProfile(userId: string) {
  if (!isDbAvailable()) {
    return memoryProfiles.get(userId) || null
  }
  try {
    const rows = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, userId))
      .limit(1)

    return rows[0] || null
  } catch (error) {
    markDbUnreachable()
    return memoryProfiles.get(userId) || null
  }
}

export async function upsertHealthProfile(
  userId: string,
  data: HealthProfileInput
) {
  if (isDbAvailable()) {
    try {
      const result = await db
        .insert(healthProfiles)
        .values({
          userId,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          emergencyContact: data.emergencyContact,
          existingConditions: data.existingConditions || [],
          currentMedications: data.currentMedications || [],
          age: data.age,
          gender: data.gender,
          height: data.height,
          heightUnit: data.heightUnit || 'cm',
          weight: data.weight,
          weightUnit: data.weightUnit || 'kg',
          bloodGroup: data.bloodGroup,
          bmi: data.bmi,
          allergies: data.allergies || [],
          lifestyleFactors: data.lifestyleFactors || {},
          onboardingCompleted: data.onboardingCompleted ?? true,
        })
        .onConflictDoUpdate({
          target: healthProfiles.userId,
          set: {
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            emergencyContact: data.emergencyContact,
            existingConditions: data.existingConditions || [],
            currentMedications: data.currentMedications || [],
            age: data.age,
            gender: data.gender,
            height: data.height,
            heightUnit: data.heightUnit || 'cm',
            weight: data.weight,
            weightUnit: data.weightUnit || 'kg',
            bloodGroup: data.bloodGroup,
            bmi: data.bmi,
            allergies: data.allergies || [],
            lifestyleFactors: data.lifestyleFactors || {},
            onboardingCompleted: data.onboardingCompleted ?? true,
            updatedAt: new Date(),
          },
        })
        .returning()

      if (result[0]) return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const existing = memoryProfiles.get(userId) || {}
  const updated = {
    ...existing,
    ...data,
    userId,
    updatedAt: new Date(),
  }
  memoryProfiles.set(userId, updated)
  return updated
}
