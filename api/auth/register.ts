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

    const existing = await query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length) {
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

    const user = toPublicUser(rows[0])
    setSessionCookie(res, createSessionToken(user.id))
    sendJson(res, 201, { user })
  } catch (error) {
    handleError(res, error)
  }
}
