/**
 * Сессия: подписанный токен в httpOnly-cookie. Своими руками, без jsonwebtoken —
 * нужен один алгоритм (HMAC-SHA256), а crypto есть в Node из коробки.
 *
 * Токен = base64url(данные).base64url(подпись). Данные содержат id пользователя
 * и срок действия. Cookie httpOnly, поэтому из браузерного скрипта токен не читается.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Role } from './types.js'

const COOKIE_NAME = 'kofevarka_session'
const SESSION_DAYS = 30

interface SessionPayload {
  /** id пользователя */
  sub: number
  /** срок действия, unix-время в секундах */
  exp: number
}

const secret = (): string => {
  const value = process.env.SESSION_SECRET
  if (value && value.length >= 16) return value

  // Без секрета сессии небезопасны, поэтому в продакшене падаем громко.
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV?.includes('preview')) {
    throw new Error('Не задан SESSION_SECRET — без него подпись сессии предсказуема')
  }

  return 'dev-only-insecure-secret'
}

const base64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url')

const sign = (data: string): string =>
  createHmac('sha256', secret()).update(data).digest('base64url')

export const createSessionToken = (userId: number): string => {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60,
  }
  const data = base64url(JSON.stringify(payload))
  return `${data}.${sign(data)}`
}

export const readSessionToken = (token: string | undefined): number | null => {
  if (!token) return null

  const [data, signature] = token.split('.')
  if (!data || !signature) return null

  const expected = sign(data)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload
    if (typeof payload.sub !== 'number') return null
    if (payload.exp * 1000 < Date.now()) return null
    return payload.sub
  } catch {
    return null
  }
}

/** Разбор cookie из запроса: заголовок вида «a=1; b=2» */
export const readCookies = (req: IncomingMessage): Record<string, string> => {
  const header = req.headers.cookie
  if (!header) return {}

  return Object.fromEntries(
    header.split(';').map((part) => {
      const index = part.indexOf('=')
      const key = (index === -1 ? part : part.slice(0, index)).trim()
      const value = index === -1 ? '' : part.slice(index + 1).trim()
      return [key, decodeURIComponent(value)]
    }),
  )
}

export const setSessionCookie = (res: ServerResponse, token: string): void => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure}`,
  )
}

export const clearSessionCookie = (res: ServerResponse): void => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`)
}

export const sessionUserId = (req: IncomingMessage): number | null =>
  readSessionToken(readCookies(req)[COOKIE_NAME])

/** Проверка роли: используется в админских ручках */
export const isAdmin = (role: Role | undefined): boolean => role === 'admin'
