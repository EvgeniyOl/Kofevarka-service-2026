/**
 * Ограничение попыток входа.
 *
 * Без него пароль можно перебирать сколько угодно: сервер отвечает быстро
 * и ничего не считает. Считаем неудачные попытки в базе, а не в памяти
 * процесса: на Vercel функции выполняются в нескольких экземплярах сразу,
 * и счётчик в памяти каждый из них видел бы свой.
 *
 * Ключ — пара «адрес клиента + почта»: так перебор одного аккаунта
 * не блокирует остальных, а один адрес не может долбить один адрес почты.
 */
import type { IncomingMessage } from 'node:http'
import { query } from './db.js'

/** Сколько неудачных попыток разрешено в окне */
const MAX_ATTEMPTS = 10

/** Длина окна в минутах */
const WINDOW_MINUTES = 15

/**
 * Адрес клиента. На Vercel запрос приходит через прокси, поэтому реальный
 * адрес лежит в x-forwarded-for: первый адрес в списке — клиентский.
 */
export const clientAddress = (req: IncomingMessage): string => {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const first = raw?.split(',')[0]?.trim()
  return first || req.socket.remoteAddress || 'unknown'
}

const attemptKey = (req: IncomingMessage, email: string): string =>
  `${clientAddress(req)}|${email.toLowerCase()}`

/** Сколько попыток уже было и сколько ждать разблокировки */
export interface AttemptState {
  blocked: boolean
  /** Через сколько минут окно сбросится: показываем в сообщении */
  minutesLeft: number
}

export const checkAttempts = async (req: IncomingMessage, email: string): Promise<AttemptState> => {
  const key = attemptKey(req, email)

  const rows = await query<{ count: number; reset_at: string }>(
    'SELECT count, reset_at FROM auth_attempts WHERE key = $1',
    [key],
  )

  const row = rows[0]
  if (!row) return { blocked: false, minutesLeft: 0 }

  const resetAt = new Date(row.reset_at).getTime()
  if (resetAt <= Date.now()) return { blocked: false, minutesLeft: 0 }

  return {
    blocked: row.count >= MAX_ATTEMPTS,
    minutesLeft: Math.max(1, Math.ceil((resetAt - Date.now()) / 60000)),
  }
}

/** Запоминаем неудачную попытку: счётчик растёт, окно сдвигается только вначале */
export const registerFailure = async (req: IncomingMessage, email: string): Promise<void> => {
  const key = attemptKey(req, email)

  await query(
    `INSERT INTO auth_attempts (key, count, reset_at)
     VALUES ($1, 1, now() + ($2 || ' minutes')::interval)
     ON CONFLICT (key) DO UPDATE
       SET count = CASE
             WHEN auth_attempts.reset_at < now() THEN 1
             ELSE auth_attempts.count + 1
           END,
           reset_at = CASE
             WHEN auth_attempts.reset_at < now() THEN now() + ($2 || ' minutes')::interval
             ELSE auth_attempts.reset_at
           END`,
    [key, String(WINDOW_MINUTES)],
  )

  // Заодно подчищаем просроченные записи: отдельной задачи для этого не нужно
  await query('DELETE FROM auth_attempts WHERE reset_at < now()')
}

/** Удачный вход снимает счётчик: человек доказал, что пароль его */
export const clearAttempts = async (req: IncomingMessage, email: string): Promise<void> => {
  await query('DELETE FROM auth_attempts WHERE key = $1', [attemptKey(req, email)])
}
