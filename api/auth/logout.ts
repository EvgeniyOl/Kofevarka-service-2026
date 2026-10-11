/**
 * Выход: стираем cookie сессии. Токен подписан и живёт до истечения срока,
 * поэтому без стирания cookie выйти было бы нельзя.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleError, sendJson } from '../_lib/http.js'
import { clearSessionCookie } from '../_lib/session.js'

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end()
      return
    }

    clearSessionCookie(res)
    sendJson(res, 200, { ok: true })
  } catch (error) {
    handleError(res, error)
  }
}
