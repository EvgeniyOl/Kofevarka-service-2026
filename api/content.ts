/**
 * Редактируемые тексты сайта.
 *
 * GET  /api/content — все сохранённые блоки. Доступно всем: страницы читают
 *                     тексты при загрузке.
 * PUT  /api/content — сохранить блок (только админ). Тело: { key, fields }
 *
 * В базе лежат только изменённые блоки. Если блока нет, страница показывает
 * текст из кода — поэтому «сбросить правку» можно, очистив все поля: пустая
 * строка не сохраняется, и блок снова берётся из кода.
 *
 * Состав полей сервер не знает: он задаётся в коде страницы, а здесь лежит
 * объектом. Так новый блок не требует правки схемы таблицы.
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
import {
  MAX_BLOCK_FIELDS,
  MAX_FIELD_LENGTH,
  toSiteContent,
  type SiteContentRow,
} from './_lib/types.js'

interface Body {
  key?: unknown
  fields?: unknown
}

/**
 * Поля блока: объект из строк. Пустые значения выбрасываем — они означают
 * «вернуть текст из кода».
 */
const parseFields = (value: unknown): Record<string, string> => {
  if (value === undefined || value === null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Поле «fields» должно быть объектом')
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length > MAX_BLOCK_FIELDS) {
    throw new HttpError(400, `В блоке не может быть больше ${MAX_BLOCK_FIELDS} полей`)
  }

  const fields: Record<string, string> = {}

  for (const [name, raw] of entries) {
    // Имя поля — идентификатор из кода: буквы, цифры, подчёркивание
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(name)) {
      throw new HttpError(400, `Недопустимое имя поля «${name}»`)
    }

    if (typeof raw !== 'string') {
      throw new HttpError(400, `Поле «${name}» должно быть текстом`)
    }

    const trimmed = raw.trim()
    if (!trimmed) continue
    if (trimmed.length > MAX_FIELD_LENGTH) {
      throw new HttpError(400, `Поле «${name}» слишком длинное`)
    }

    fields[name] = trimmed
  }

  return fields
}

const listContent = async (res: ServerResponse): Promise<void> => {
  const rows = await query<SiteContentRow>('SELECT * FROM site_content ORDER BY key')
  sendJson(res, 200, { blocks: rows.map(toSiteContent) })
}

const saveContent = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)

  // Ключ обязателен и ограничен по длине: это идентификатор блока в коде
  const key = requireString(body.key, 'Ключ блока', 100)
  const fields = parseFields(body.fields)

  // Если все поля пустые, строку не храним: блок вернётся к тексту из кода
  if (!Object.keys(fields).length) {
    await query('DELETE FROM site_content WHERE key = $1', [key])
    sendJson(res, 200, { block: null })
    return
  }

  const rows = await query<SiteContentRow>(
    `INSERT INTO site_content (key, fields)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE
       SET fields = EXCLUDED.fields,
           updated_at = now()
     RETURNING *`,
    [key, JSON.stringify(fields)],
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
