/**
 * Партнёры — блок на странице «О нас».
 *
 * GET    /api/partners — список партнёров. Доступно всем: страница читает его
 *                        при загрузке. При первом обращении таблица наполняется
 *                        стартовым списком обжарщиков.
 * POST   /api/partners — добавить партнёра (только админ)
 * PATCH  /api/partners — изменить (только админ), тело: { id, name, note, logo }
 * DELETE /api/partners — удалить (только админ), тело: { id }
 *
 * Логотип приходит либо путём к файлу в public/photos/partners, либо data URL:
 * на Vercel файловая система только для чтения, поэтому загруженный из админки
 * файл нельзя положить на диск — он едет в базу вместе с записью.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query, seedPartners } from './_lib/db.js'
import {
  handleError,
  readJson,
  requireAdmin,
  requireString,
  sendJson,
  HttpError,
} from './_lib/http.js'
import { MAX_LOGO_LENGTH, toPartner, type PartnerRow } from './_lib/types.js'

interface Body {
  id?: unknown
  name?: unknown
  note?: unknown
  logo?: unknown
}

const optionalText = (value: unknown, field: string, max: number): string => {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new HttpError(400, `Поле «${field}» должно быть текстом`)

  const trimmed = value.trim()
  if (trimmed.length > max) throw new HttpError(400, `Поле «${field}» слишком длинное`)
  return trimmed
}

/**
 * Логотип: путь к файлу или картинка целиком.
 * Принимаем только то, что безопасно показать в <img>: http(s), data-картинка
 * или путь от корня сайта. Иначе через поле можно подсунуть javascript: и
 * выполнить код на странице.
 */
const parseLogo = (value: unknown): string => {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new HttpError(400, 'Поле «Логотип» должно быть текстом')

  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed.length > MAX_LOGO_LENGTH) {
    throw new HttpError(413, 'Логотип слишком большой: загрузите картинку меньшего размера')
  }

  const allowed =
    trimmed.startsWith('/') ||
    /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(trimmed) ||
    /^https?:\/\//i.test(trimmed)

  if (!allowed) {
    throw new HttpError(400, 'Логотип должен быть путём к файлу или загруженной картинкой')
  }

  return trimmed
}

const listPartners = async (res: ServerResponse): Promise<void> => {
  // Наполняем таблицу один раз: дальше партнёрами распоряжается админ
  await seedPartners()

  const rows = await query<PartnerRow>('SELECT * FROM partners ORDER BY position, id')
  sendJson(res, 200, { partners: rows.map(toPartner) })
}

const createPartner = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const name = requireString(body.name, 'Название', 120)

  const rows = await query<PartnerRow>(
    `INSERT INTO partners (position, name, note, logo)
     VALUES (
       COALESCE((SELECT max(position) + 1 FROM partners), 1),
       $1, $2, $3
     )
     RETURNING *`,
    [name, optionalText(body.note, 'Описание', 300), parseLogo(body.logo)],
  )

  sendJson(res, 201, { partner: toPartner(rows[0]) })
}

const updatePartner = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = Number(body.id)

  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Не указан партнёр')

  const rows = await query<PartnerRow>(
    `UPDATE partners SET name = $1, note = $2, logo = $3 WHERE id = $4 RETURNING *`,
    [
      requireString(body.name, 'Название', 120),
      optionalText(body.note, 'Описание', 300),
      parseLogo(body.logo),
      id,
    ],
  )

  if (!rows.length) throw new HttpError(404, 'Партнёр не найден')
  sendJson(res, 200, { partner: toPartner(rows[0]) })
}

const deletePartner = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = Number(body.id)

  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Не указан партнёр')

  const rows = await query<{ id: number }>('DELETE FROM partners WHERE id = $1 RETURNING id', [id])
  if (!rows.length) throw new HttpError(404, 'Партнёр не найден')

  sendJson(res, 200, { ok: true })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      await listPartners(res)
      return
    }

    if (!(await requireAdmin(req, res))) return

    if (req.method === 'POST') {
      await createPartner(req, res)
      return
    }

    if (req.method === 'PATCH') {
      await updatePartner(req, res)
      return
    }

    if (req.method === 'DELETE') {
      await deletePartner(req, res)
      return
    }

    res.statusCode = 405
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
