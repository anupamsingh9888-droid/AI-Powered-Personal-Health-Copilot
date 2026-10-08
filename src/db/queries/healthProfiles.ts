import { eq } from 'drizzle-orm'
import { db } from '../index.ts'
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

export async function getHealthProfile(userId: string) {
  try {
    const rows = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, userId))
      .limit(1)

    return rows[0] || null
  } catch (error) {
    console.error('Database query failed in getHealthProfile:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function upsertHealthProfile(
  userId: string,
  data: HealthProfileInput
) {
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

    return result[0]
  } catch (error) {
    console.error('Database query failed in upsertHealthProfile:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
