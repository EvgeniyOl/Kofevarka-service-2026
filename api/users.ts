/**
 * Список пользователей: только для админа.
 *
 * GET /api/users — все зарегистрированные, свежие сверху.
 *
 * Роли не меняются: администратор в проекте один — тот, кто зарегистрировался
 * первым (см. api/auth/register.ts). Смена роли убрана вместе с ручкой PATCH:
 * меньше поверхности для ошибок и никто не может выдать себе права.
 * Если однажды понадобится несколько админов, роль придётся менять в базе.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from './_lib/db.js'
import { handleError, requireAdmin, sendJson } from './_lib/http.js'
import { toPublicUser, type UserRow } from './_lib/types.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end()
    return
  }

  try {
    if (!(await requireAdmin(req, res))) return

    const rows = await query<UserRow>('SELECT * FROM users ORDER BY created_at DESC')
    sendJson(res, 200, { users: rows.map(toPublicUser) })
  } catch (error) {
    handleError(res, error)
  }
}
