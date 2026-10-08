import { and, desc, eq } from 'drizzle-orm'
import { db } from '../index.ts'
import { chatMessages, chatSessions } from '../schema.ts'

export async function getChatSessions(userId: string) {
  try {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
  } catch (error) {
    console.error('Database query failed in getChatSessions:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function createChatSession(
  userId: string,
  title: string,
  category = 'general'
) {
  try {
    const result = await db
      .insert(chatSessions)
      .values({
        userId,
        title,
        category,
      })
      .returning()

    return result[0]
  } catch (error) {
    console.error('Database query failed in createChatSession:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function deleteChatSession(userId: string, sessionId: number) {
  try {
    await db
      .delete(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    return true
  } catch (error) {
    console.error('Database query failed in deleteChatSession:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}

export async function getChatMessages(userId: string, sessionId: number) {
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
    console.error('Database query failed in getChatMessages:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
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

    // Update session updatedAt timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))

    return msg
  } catch (error) {
    console.error('Database query failed in addChatMessage:', error)
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    })
  }
}
