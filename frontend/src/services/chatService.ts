import { apiRequest } from './apiClient'

export interface ChatSessionDoc {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessageDoc {
  id: string
  sessionId: string
  userId: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  createdAt: string
}

export async function getChatSessions(userId?: string): Promise<ChatSessionDoc[]> {
  try {
    const list = await apiRequest('/api/chat/sessions')
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      userId: item.userId || userId || '',
      title: item.title,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  } catch (error) {
    console.warn('Could not fetch chat sessions from PostgreSQL:', error)
    return []
  }
}

export async function createChatSession(
  userId: string,
  title: string
): Promise<ChatSessionDoc> {
  const result = await apiRequest('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, category: 'general' }),
  })

  return {
    id: String(result.id),
    userId,
    title: result.title,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export async function getChatMessages(
  sessionId: string,
  userId?: string
): Promise<ChatMessageDoc[]> {
  const numId = parseInt(sessionId, 10)
  if (isNaN(numId)) return []

  try {
    const list = await apiRequest(`/api/chat/sessions/${numId}/messages`)
    if (!Array.isArray(list)) return []
    return list.map((item: any) => ({
      id: String(item.id),
      sessionId: String(item.sessionId),
      userId: item.userId || userId || '',
      sender: item.sender as 'user' | 'assistant',
      text: item.text,
      timestamp: new Date(item.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: item.createdAt,
    }))
  } catch (error) {
    console.warn('Could not fetch chat messages from PostgreSQL:', error)
    return []
  }
}

export async function sendChatMessage(
  sessionId: string,
  userId: string,
  sender: 'user' | 'assistant',
  text: string
): Promise<ChatMessageDoc> {
  const numId = parseInt(sessionId, 10)
  if (isNaN(numId)) {
    return {
      id: `local_${Date.now()}`,
      sessionId,
      userId,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: new Date().toISOString(),
    }
  }

  const result = await apiRequest(`/api/chat/sessions/${numId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ sender, text }),
  })

  return {
    id: String(result.id),
    sessionId: String(result.sessionId),
    userId,
    sender,
    text: result.text,
    timestamp: new Date(result.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    createdAt: result.createdAt,
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const numId = parseInt(sessionId, 10)
  if (!isNaN(numId)) {
    await apiRequest(`/api/chat/sessions/${numId}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Could not delete chat session from PostgreSQL:', err))
  }
}
