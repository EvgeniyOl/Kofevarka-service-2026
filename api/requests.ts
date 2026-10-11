/**
 * Заявки с сайта: сохранение из формы обратной связи и список для админа.
 *
 * POST /api/requests  — оставить заявку (доступно всем, вошедшему привязываем id)
 * GET  /api/requests  — список заявок (только админ)
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from './_lib/db.js'
import {
  currentUser,
  handleError,
  readJson,
  requireAdmin,
  requireEmail,
  requireString,
  sendJson,
} from './_lib/http.js'
import { toSiteRequest, type SiteRequestRow } from './_lib/types.js'

interface Body {
  name?: unknown
  email?: unknown
  message?: unknown
}

const listRequests = async (res: ServerResponse): Promise<void> => {
  const rows = await query<SiteRequestRow>(
    'SELECT * FROM site_requests ORDER BY created_at DESC LIMIT 200',
  )
  sendJson(res, 200, { requests: rows.map(toSiteRequest) })
}

const createRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const name = requireString(body.name, 'Имя', 100)
  const email = requireEmail(body.email)
  const message = requireString(body.message, 'Сообщение', 2000)

  // Если человек вошёл — привязываем заявку к аккаунту, но вход не обязателен
  const user = await currentUser(req)

  const rows = await query<SiteRequestRow>(
    `INSERT INTO site_requests (user_id, name, email, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user?.id ?? null, name, email, message],
  )

  sendJson(res, 201, { request: toSiteRequest(rows[0]) })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === 'POST') {
      await createRequest(req, res)
      return
    }

    if (req.method === 'GET') {
      if (!(await requireAdmin(req, res))) return
      await listRequests(res)
      return
    }

    res.statusCode = 405
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
