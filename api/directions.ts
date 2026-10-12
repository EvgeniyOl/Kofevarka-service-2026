/**
 * Направления ремонта — карточки на странице «Ремонт».
 *
 * GET    /api/directions — список карточек. Доступно всем: страница читает их
 *                          при загрузке. При первом обращении таблица
 *                          наполняется стартовым набором.
 * POST   /api/directions — добавить карточку (только админ)
 * PATCH  /api/directions — изменить карточку (только админ), тело: { id, ... }
 * DELETE /api/directions — удалить карточку (только админ), тело: { id }
 *
 * Карточек не больше MAX_DIRECTIONS: это ограничение и на сервере, и в коде
 * страницы, чтобы список не разрастался в бесконечную простыню.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query, seedDirections } from './_lib/db.js'
import {
  handleError,
  readJson,
  requireAdmin,
  requireString,
  sendJson,
  HttpError,
} from './_lib/http.js'
import { MAX_DIRECTIONS, toDirection, type DirectionRow } from './_lib/types.js'

interface Body {
  id?: unknown
  icon?: unknown
  title?: unknown
  text?: unknown
  points?: unknown
}

/** Поле может быть пустым: иконка и описание не обязательны */
const optionalText = (value: unknown, field: string, max: number): string => {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new HttpError(400, `Поле «${field}» должно быть текстом`)

  const trimmed = value.trim()
  if (trimmed.length > max) throw new HttpError(400, `Поле «${field}» слишком длинное`)
  return trimmed
}

/**
 * Пункты списка приходят массивом строк. Принимаем и одну строку с переносами:
 * в форме админ вводит их построчно.
 */
const parsePoints = (value: unknown): string[] => {
  const raw =
    typeof value === 'string'
      ? value.split('\n')
      : Array.isArray(value)
        ? value.map((item) => String(item))
        : []

  const points = raw
    .map((item) => item.trim())
    .filter(Boolean)
    // Ограничение на пункт и на их количество: карточка должна оставаться короткой
    .map((item) => (item.length > 120 ? item.slice(0, 120) : item))
    .slice(0, 8)

  return points
}

const listDirections = async (res: ServerResponse): Promise<void> => {
  // Наполняем таблицу один раз: дальше карточками распоряжается админ
  await seedDirections()

  const rows = await query<DirectionRow>('SELECT * FROM repair_directions ORDER BY position, id')
  sendJson(res, 200, { directions: rows.map(toDirection) })
}

const createDirection = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const title = requireString(body.title, 'Заголовок', 120)

  const total = await query<{ count: string }>(
    'SELECT count(*)::text AS count FROM repair_directions',
  )

  if (Number(total[0]?.count ?? 0) >= MAX_DIRECTIONS) {
    throw new HttpError(409, `Больше ${MAX_DIRECTIONS} карточек добавить нельзя`)
  }

  const rows = await query<DirectionRow>(
    `INSERT INTO repair_directions (position, icon, title, text, points)
     VALUES (
       COALESCE((SELECT max(position) + 1 FROM repair_directions), 1),
       $1, $2, $3, $4
     )
     RETURNING *`,
    [
      optionalText(body.icon, 'Иконка', 8),
      title,
      optionalText(body.text, 'Описание', 400),
      parsePoints(body.points),
    ],
  )

  sendJson(res, 201, { direction: toDirection(rows[0]) })
}

const updateDirection = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = Number(body.id)

  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Не указана карточка')

  const rows = await query<DirectionRow>(
    `UPDATE repair_directions
       SET icon = $1, title = $2, text = $3, points = $4
     WHERE id = $5
     RETURNING *`,
    [
      optionalText(body.icon, 'Иконка', 8),
      requireString(body.title, 'Заголовок', 120),
      optionalText(body.text, 'Описание', 400),
      parsePoints(body.points),
      id,
    ],
  )

  if (!rows.length) throw new HttpError(404, 'Карточка не найдена')
  sendJson(res, 200, { direction: toDirection(rows[0]) })
}

const deleteDirection = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = Number(body.id)

  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Не указана карточка')

  const rows = await query<{ id: number }>(
    'DELETE FROM repair_directions WHERE id = $1 RETURNING id',
    [id],
  )

  if (!rows.length) throw new HttpError(404, 'Карточка не найдена')
  sendJson(res, 200, { ok: true })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      await listDirections(res)
      return
    }

    if (!(await requireAdmin(req, res))) return

    if (req.method === 'POST') {
      await createDirection(req, res)
      return
    }

    if (req.method === 'PATCH') {
      await updateDirection(req, res)
      return
    }

    if (req.method === 'DELETE') {
      await deleteDirection(req, res)
      return
    }

    res.statusCode = 405
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
