/**
 * Текущий пользователь: /api/auth/me.
 *
 * Отдельная ручка от выхода (logout.ts): в файловой маршрутизации Vercel
 * один файл — один путь, поэтому «/api/auth/me» и «/api/auth/logout»
 * не могут жить в одном модуле.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleError, currentUser, sendJson } from '../_lib/http.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end()
    return
  }

  try {
    sendJson(res, 200, { user: await currentUser(req) })
  } catch (error) {
    handleError(res, error)
  }
}
