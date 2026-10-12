/**
 * Редактируемые тексты сайта.
 *
 * GET  /api/content — все сохранённые блоки. Доступно всем: страницы читают
 *                     тексты при загрузке.
 * PUT  /api/content — сохранить блок (только админ). Тело:
 *                     { key, title?, lead?, actionOne?, actionTwo? }
 *
 * В базе лежат только изменённые блоки. Если блока нет, страница показывает
 * текст из кода — поэтому «сбросить правку» можно, очистив все поля: пустая
 * строка сохраняется как NULL, и блок снова берётся из кода.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from './_lib/db.js'
import {
  handleError,
  readJson,
  requireAdmin,
  requireString,
  sendJson,
  HttpError,
} from './_lib/http.js'
import { toSiteContent, type SiteContentRow } from './_lib/types.js'

interface Body {
  key?: unknown
  title?: unknown
  lead?: unknown
  actionOne?: unknown
  actionTwo?: unknown
}

/** Поле может быть пустым: это значит «вернуть текст из кода» */
const optionalText = (value: unknown, field: string, max: number): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new HttpError(400, `Поле «${field}» должно быть текстом`)

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw new HttpError(400, `Поле «${field}» слишком длинное`)

  return trimmed
}

const listContent = async (res: ServerResponse): Promise<void> => {
  const rows = await query<SiteContentRow>('SELECT * FROM site_content ORDER BY key')
  sendJson(res, 200, { blocks: rows.map(toSiteContent) })
}

const saveContent = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)

  // Ключ обязателен и ограничен по длине: это идентификатор блока в коде
  const key = requireString(body.key, 'Ключ блока', 100)

  const values = [
    key,
    optionalText(body.title, 'Заголовок', 200),
    optionalText(body.lead, 'Описание', 600),
    optionalText(body.actionOne, 'Первая кнопка', 60),
    optionalText(body.actionTwo, 'Вторая кнопка', 60),
  ]

  // Если все поля пустые, строку не храним: блок вернётся к тексту из кода
  if (values.slice(1).every((value) => value === null)) {
    await query('DELETE FROM site_content WHERE key = $1', [key])
    sendJson(res, 200, { block: null })
    return
  }

  const rows = await query<SiteContentRow>(
    `INSERT INTO site_content (key, title, lead, action_one, action_two)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (key) DO UPDATE
       SET title = EXCLUDED.title,
           lead = EXCLUDED.lead,
           action_one = EXCLUDED.action_one,
           action_two = EXCLUDED.action_two,
           updated_at = now()
     RETURNING *`,
    values,
  )

  sendJson(res, 200, { block: toSiteContent(rows[0]) })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      await listContent(res)
      return
    }

    if (req.method === 'PUT') {
      if (!(await requireAdmin(req, res))) return
      await saveContent(req, res)
      return
    }

    res.statusCode = 405
    res.setHeader('Allow', 'GET, PUT')
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
