import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { apiRequest } from './apiClient'
import type { UserProfile } from '../Login'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider)
  const fbUser = result.user
  return syncUserToPostgres(fbUser)
}

export async function signInWithEmailPassword(
  email: string,
  pass: string
): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass)
  const fbUser = result.user
  return syncUserToPostgres(fbUser)
}

export async function signUpWithEmailPassword(
  email: string,
  pass: string,
  displayName: string
): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass)
  const fbUser = result.user
  if (displayName) {
    try {
      await updateProfile(fbUser, { displayName })
    } catch {}
  }
  return syncUserToPostgres(fbUser)
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

export const syncUserToFirestore = syncUserToPostgres

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function syncUserToPostgres(fbUser: FirebaseUser): Promise<UserProfile> {
  const token = await fbUser.getIdToken()

  // Upsert user into PostgreSQL `users` table
  const pgUser = await apiRequest('/api/users/sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoUrl: fbUser.photoURL,
    }),
  }).catch((err) => {
    console.warn('PostgreSQL user sync warning:', err)
    return null
  })

  // Check health profile from PostgreSQL `health_profiles` table
  let profile = await apiRequest('/api/health-profile', {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  const name =
    profile?.fullName ||
    pgUser?.displayName ||
    fbUser.displayName ||
    (fbUser.email ? fbUser.email.split('@')[0] : 'Health User')
  const email = pgUser?.email || fbUser.email || 'user@health.org'

  return {
    name,
    email,
    avatarChar: name.charAt(0).toUpperCase(),
    role: 'Personal account',
    abhaId: '91-4820-1928-3341',
    age: profile?.age ? String(profile.age) : '34',
    gender: profile?.gender || 'Male',
    height: profile?.height ? String(profile.height) : '178',
    heightUnit: profile?.heightUnit || 'cm',
    weight: profile?.weight ? String(profile.weight) : '68',
    weightUnit: profile?.weightUnit || 'kg',
    bloodGroup: profile?.bloodGroup || 'O+',
    dateOfBirth: profile?.dateOfBirth || '',
    emergencyContact: profile?.emergencyContact || '',
    allergies: Array.isArray(profile?.allergies) ? profile.allergies : [],
    existingConditions: Array.isArray(profile?.existingConditions) ? profile.existingConditions : [],
    currentMedications: Array.isArray(profile?.currentMedications) ? profile.currentMedications : [],
    onboarded: profile ? Boolean(profile.onboardingCompleted) : false,
    hasRecords: Boolean(profile),
  }
}
