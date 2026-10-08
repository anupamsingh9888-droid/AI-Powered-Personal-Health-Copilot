import type { IncomingMessage, ServerResponse } from 'node:http'
import { adminAuth } from '../lib/firebase-admin.ts'
import type { DecodedIdToken } from 'firebase-admin/auth'

export interface AuthenticatedUser {
  uid: string
  email?: string
  name?: string
  picture?: string
}

export interface AuthRequest extends IncomingMessage {
  user?: AuthenticatedUser
}

export async function verifyTokenFromHeader(
  authHeader: string | undefined
): Promise<AuthenticatedUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split('Bearer ')[1]?.trim()
  if (!token) return null

  // Check demo user mode token
  if (token.startsWith('demo-')) {
    return {
      uid: token,
      email: `${token}@healthlens.demo`,
      name: 'Demo Patient',
    }
  }

  try {
    const decoded: DecodedIdToken = await adminAuth.verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
  } catch (error) {
    console.warn('Firebase ID token verification failed:', error)
    return null
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: ServerResponse,
  next: () => void
) => {
  const authHeader = req.headers.authorization
  const user = await verifyTokenFromHeader(authHeader)

  if (!user) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }))
    return
  }

  req.user = user
  next()
}
