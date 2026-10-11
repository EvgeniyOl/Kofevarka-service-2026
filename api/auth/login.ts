/**
 * Вход по почте и паролю. Ошибка одна и та же для неверной почты и пароля:
 * иначе по тексту ответа можно узнать, какие адреса зарегистрированы.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from '../_lib/db.js'
import {
  handleError,
  readJson,
  requireEmail,
  requirePassword,
  sendJson,
  HttpError,
} from '../_lib/http.js'
import { verifyPassword } from '../_lib/password.js'
import { createSessionToken, setSessionCookie } from '../_lib/session.js'
import { toPublicUser, type UserRow } from '../_lib/types.js'

interface Body {
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
    const email = requireEmail(body.email)
    // Пароль проверяем до запроса в базу: без этого на пустой пароль
    // мы бы сначала сходили в базу и вернули 500 вместо понятной 400
    const password = requirePassword(body.password)

    const rows = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email])
    const row = rows[0]

    if (!row || !(await verifyPassword(password, row.password))) {
      throw new HttpError(401, 'Почта или пароль не подходят')
    }

    const user = toPublicUser(row)
    setSessionCookie(res, createSessionToken(user.id))
    sendJson(res, 200, { user })
  } catch (error) {
    handleError(res, error)
  }
}
