/**
 * Управление пользователями: только для админа.
 *
 * GET   /api/users        — список всех пользователей
 * PATCH /api/users        — сменить роль: { id, role }
 *
 * Админ не может снять роль с себя: иначе легко остаться без доступа.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from './_lib/db.js'
import { handleError, readJson, requireAdmin, sendJson, HttpError } from './_lib/http.js'
import { toPublicUser, type Role, type UserRow } from './_lib/types.js'

interface Body {
  id?: unknown
  role?: unknown
}

const listUsers = async (res: ServerResponse): Promise<void> => {
  const rows = await query<UserRow>('SELECT * FROM users ORDER BY created_at DESC')
  sendJson(res, 200, { users: rows.map(toPublicUser) })
}

const changeRole = async (
  req: IncomingMessage,
  res: ServerResponse,
  adminId: number,
): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = Number(body.id)
  const role = body.role

  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Не указан пользователь')
  if (role !== 'client' && role !== 'admin') throw new HttpError(400, 'Неизвестная роль')
  if (id === adminId && role !== 'admin') {
    throw new HttpError(400, 'Нельзя снять роль администратора с себя')
  }

  const rows = await query<UserRow>('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', [
    role satisfies Role,
    id,
  ])

  if (!rows.length) throw new HttpError(404, 'Пользователь не найден')
  sendJson(res, 200, { user: toPublicUser(rows[0]) })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return

    if (req.method === 'GET') {
      await listUsers(res)
      return
    }

    if (req.method === 'PATCH') {
      await changeRole(req, res, admin.id)
      return
    }

    res.statusCode = 405
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
