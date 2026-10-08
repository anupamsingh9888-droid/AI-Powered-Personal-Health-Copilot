import { eq } from 'drizzle-orm'
import { db, isDbAvailable, markDbUnreachable } from '../index.ts'
import { users } from '../schema.ts'

const memoryUsers = new Map<string, any>()

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoUrl?: string
) {
  if (isDbAvailable()) {
    try {
      const result = await db
        .insert(users)
        .values({
          uid,
          email: email || `${uid}@unknown.com`,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: email || `${uid}@unknown.com`,
            displayName: displayName || null,
            photoUrl: photoUrl || null,
            updatedAt: new Date(),
          },
        })
        .returning()

      if (result[0]) return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const existing = memoryUsers.get(uid) || {
    uid,
    email: email || `${uid}@unknown.com`,
    displayName: displayName || null,
    photoUrl: photoUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  if (displayName) existing.displayName = displayName
  if (email) existing.email = email
  memoryUsers.set(uid, existing)
  return existing
}

export async function getUserByUid(uid: string) {
  if (isDbAvailable()) {
    try {
      const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1)
      if (rows[0]) return rows[0]
    } catch (error) {
      markDbUnreachable()
    }
  }
  return memoryUsers.get(uid) || null
}
