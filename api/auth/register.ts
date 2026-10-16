/**
 * Регистрация. Первый зарегистрированный пользователь становится админом —
 * иначе в свежей базе некому было бы управлять сайтом.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from '../_lib/db.js'
import {
  handleError,
  readJson,
  requireEmail,
  requirePassword,
  requireString,
  sendJson,
  HttpError,
} from '../_lib/http.js'
import { hashPassword } from '../_lib/password.js'
import { checkAttempts, clearAttempts, registerFailure } from '../_lib/rateLimit.js'
import { createSessionToken, setSessionCookie } from '../_lib/session.js'
import { toPublicUser, type Role, type UserRow } from '../_lib/types.js'

interface Body {
  name?: unknown
  email?: unknown
  password?: unknown
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end()
    return
  }

  try {
    const body = await readJson<Body>(req)
    const name = requireString(body.name, 'Имя', 100)
    const email = requireEmail(body.email)
    const password = requirePassword(body.password)

    // Регистрацию тоже притормаживаем: иначе через неё подбирают,
    // какие адреса уже заняты, и плодят аккаунты пачками
    const attempts = await checkAttempts(req, email)
    if (attempts.blocked) {
      throw new HttpError(
        429,
        `Слишком много попыток. Попробуйте через ${attempts.minutesLeft} мин.`,
      )
    }

    const existing = await query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length) {
      await registerFailure(req, email)
      throw new HttpError(409, 'Такой адрес уже зарегистрирован — войдите')
    }

    const total = await query<{ count: string }>('SELECT count(*)::text AS count FROM users')
    const role: Role = Number(total[0]?.count ?? 0) === 0 ? 'admin' : 'client'

    const rows = await query<UserRow>(
      `INSERT INTO users (email, name, role, password)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, name, role, await hashPassword(password)],
    )

    await clearAttempts(req, email)

    const user = toPublicUser(rows[0])
    const token = createSessionToken(user.id)
    // Токен отдаём и в cookie (веб), и в теле ответа (мобильное приложение)
    setSessionCookie(res, token)
    sendJson(res, 201, { user, token })
  } catch (error) {
    handleError(res, error)
  }
}
