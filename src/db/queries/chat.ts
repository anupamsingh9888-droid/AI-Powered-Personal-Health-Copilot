import { and, desc, eq } from 'drizzle-orm'
import { db, isDbConfigured, isDbAvailable, markDbUnreachable } from '../index.ts'
import { chatMessages, chatSessions } from '../schema.ts'

const memorySessions = new Map<string, any[]>()
const memoryMessages = new Map<string, any[]>() // key: `${userId}_${sessionId}`
let nextSessionId = 1
let nextMessageId = 1

export async function getChatSessions(userId: string) {
  if (!isDbAvailable()) {
    return memorySessions.get(userId) || []
  }
  try {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
  } catch (error) {
    markDbUnreachable()
    return memorySessions.get(userId) || []
  }
}

export async function createChatSession(
  userId: string,
  title: string,
  category = 'general'
) {
  if (isDbAvailable()) {
    try {
      const result = await db
        .insert(chatSessions)
        .values({
          userId,
          title,
          category,
        })
        .returning()

      if (result[0]) return result[0]
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallback = {
    id: nextSessionId++,
    userId,
    title,
    category,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const current = memorySessions.get(userId) || []
  current.unshift(fallback)
  memorySessions.set(userId, current)
  return fallback
}

export async function deleteChatSession(userId: string, sessionId: number) {
  if (isDbAvailable()) {
    try {
      await db
        .delete(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      return true
    } catch (error) {
      markDbUnreachable()
    }
  }
  const current = memorySessions.get(userId) || []
  memorySessions.set(
    userId,
    current.filter((s) => s.id !== sessionId)
  )
  memoryMessages.delete(`${userId}_${sessionId}`)
  return true
}

export async function getChatMessages(userId: string, sessionId: number) {
  if (!isDbAvailable()) {
    return memoryMessages.get(`${userId}_${sessionId}`) || []
  }
  try {
    return await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.sessionId, sessionId),
          eq(chatMessages.userId, userId)
        )
      )
      .orderBy(chatMessages.createdAt)
  } catch (error) {
    markDbUnreachable()
    return memoryMessages.get(`${userId}_${sessionId}`) || []
  }
}

export async function addChatMessage(
  userId: string,
  sessionId: number,
  sender: string,
  text: string,
  citations: any[] = [],
  triageLevel = 'none'
) {
  if (isDbAvailable()) {
    try {
      const [msg] = await db
        .insert(chatMessages)
        .values({
          sessionId,
          userId,
          sender,
          text,
          citations,
          triageLevel,
        })
        .returning()

      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))

      if (msg) return msg
    } catch (error) {
      markDbUnreachable()
    }
  }

  const fallbackMsg = {
    id: nextMessageId++,
    sessionId,
    userId,
    sender,
    text,
    citations,
    triageLevel,
    createdAt: new Date(),
  }
  const key = `${userId}_${sessionId}`
  const current = memoryMessages.get(key) || []
  current.push(fallbackMsg)
  memoryMessages.set(key, current)
  return fallbackMsg
}
