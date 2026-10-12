/**
 * Помощники для функций: чтение тела запроса, ответы, проверка прав.
 * Функции Vercel работают с обычными Node-объектами запроса и ответа,
 * поэтому и локальный плагин разработки, и продакшен используют один код.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from './db.js'
import { sessionUserId } from './session.js'
import { toPublicUser, type PublicUser, type UserRow } from './types.js'

/*
 * Предел тела запроса. Формам сайта хватает и 100 КБ, но логотип партнёра
 * приезжает как data URL и весит больше: картинка на 400 КБ превращается
 * в строку около 550 КБ после base64. Ограничение на сам логотип отдельное —
 * MAX_LOGO_LENGTH в types.ts.
 */
const MAX_BODY = 1024 * 1024

export const sendJson = (res: ServerResponse, status: number, payload: unknown): void => {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

export const sendError = (res: ServerResponse, status: number, message: string): void => {
  sendJson(res, status, { error: message })
}

export const readJson = async <T>(req: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of req) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > MAX_BODY) throw new HttpError(413, 'Слишком большой запрос')
    chunks.push(buffer)
  }

  if (!chunks.length) return {} as T

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
  } catch {
    // Это ошибка клиента, а не сбой сервера — иначе в логах будет шум,
    // а в ответе 500 вместо понятного 400
    throw new HttpError(400, 'Тело запроса не разобрать как JSON')
  }
}

/** Пользователь по id из сессии, либо null */
export const currentUser = async (req: IncomingMessage): Promise<PublicUser | null> => {
  const id = sessionUserId(req)
  if (!id) return null

  const rows = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] ? toPublicUser(rows[0]) : null
}

/** Требуем вход: возвращаем пользователя или сами отвечаем 401 */
export const requireUser = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<PublicUser | null> => {
  const user = await currentUser(req)
  if (!user) {
    sendError(res, 401, 'Нужно войти в аккаунт')
    return null
  }
  return user
}

/** Требуем роль админа */
export const requireAdmin = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<PublicUser | null> => {
  const user = await requireUser(req, res)
  if (!user) return null

  if (user.role !== 'admin') {
    sendError(res, 403, 'Раздел доступен только администратору')
    return null
  }
  return user
}

/** Ошибка с кодом ответа — чтобы ручки могли её бросить и не городить условия */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export const handleError = (res: ServerResponse, error: unknown): void => {
  if (error instanceof HttpError) {
    sendError(res, error.status, error.message)
    return
  }

  const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
  console.error('[api]', message)
  sendError(res, 500, message)
}

/** Проверка полей формы: пустые значения и лишние пробелы */
export const requireString = (value: unknown, field: string, max = 500): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `Заполните поле «${field}»`)
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    throw new HttpError(400, `Поле «${field}» слишком длинное`)
  }
  return trimmed
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const requireEmail = (value: unknown): string => {
  const email = requireString(value, 'Почта', 200).toLowerCase()
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Проверьте адрес почты')
  return email
}

export const requirePassword = (value: unknown): string => {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 8) throw new HttpError(400, 'Пароль должен быть не короче 8 символов')
  if (password.length > 200) throw new HttpError(400, 'Пароль слишком длинный')
  return password
}
