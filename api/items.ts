/**
 * Универсальные списки сайта: цифры, шаги, цены, вопросы, отзывы, принципы,
 * команда — всё, что выводится повторяющимися карточками.
 *
 * GET    /api/items?kind=repair.faq — элементы одного списка. Доступно всем.
 * GET    /api/items — сразу все списки: страницы грузят их одним запросом.
 * POST   /api/items — добавить элемент (только админ), тело: { kind, fields }
 * PATCH  /api/items — изменить (только админ), тело: { id, fields }
 * DELETE /api/items — удалить (только админ), тело: { id }
 * PUT    /api/items — залить стартовый набор (только админ), тело: { kind, items }
 *
 * Состав полей сервер не знает: он задаётся в коде страницы. Здесь важно
 * только то, что это плоский объект из строк.
 *
 * Стартовые элементы присылает фронтенд при первом обращении к списку: их
 * значения по умолчанию живут в коде, дублировать их на сервере не нужно.
 * Отметка о заливке хранится в site_meta, поэтому удалённые элементы
 * не возвращаются.
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
  MAX_ITEMS,
  MAX_ITEM_FIELDS,
  MAX_ITEM_FIELD_LENGTH,
  toSiteItem,
  type SiteItemRow,
} from './_lib/types.js'

interface Body {
  id?: unknown
  kind?: unknown
  fields?: unknown
  items?: unknown
}

/** Имя списка: идентификатор из кода, вида «repair.faq» */
const ITEM_KIND = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/

const parseKind = (value: unknown): string => {
  const kind = requireString(value, 'Список', 60)
  if (!ITEM_KIND.test(kind)) throw new HttpError(400, 'Недопустимое имя списка')
  return kind
}

/**
 * Поля элемента: плоский объект из строк. Пустые значения выбрасываем,
 * чтобы не хранить мусор, но сам элемент остаётся — у него может быть
 * заполнено только одно поле.
 */
const parseFields = (value: unknown): Record<string, string> => {
  if (value === undefined || value === null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Поле «fields» должно быть объектом')
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length > MAX_ITEM_FIELDS) {
    throw new HttpError(400, `У элемента не может быть больше ${MAX_ITEM_FIELDS} полей`)
  }

  const fields: Record<string, string> = {}

  for (const [name, raw] of entries) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(name)) {
      throw new HttpError(400, `Недопустимое имя поля «${name}»`)
    }

    if (typeof raw !== 'string') {
      throw new HttpError(400, `Поле «${name}» должно быть текстом`)
    }

    const trimmed = raw.trim()
    if (!trimmed) continue
    if (trimmed.length > MAX_ITEM_FIELD_LENGTH) {
      throw new HttpError(400, `Поле «${name}» слишком длинное`)
    }

    fields[name] = trimmed
  }

  return fields
}

const requireId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Не указан элемент')
  return id
}

/** Флаг в site_meta: список уже наполняли стартовым набором */
const seedFlag = (kind: string): string => `items_seeded:${kind}`

const listItems = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const requested = url.searchParams.get('kind')

  // Без kind отдаём все списки разом: страницы грузят их одним запросом
  if (!requested) {
    const [rows, flags] = await Promise.all([
      query<SiteItemRow>('SELECT * FROM site_items ORDER BY kind, position, id'),
      query<{ key: string }>("SELECT key FROM site_meta WHERE key LIKE 'items_seeded:%'"),
    ])

    const lists: Record<string, { items: ReturnType<typeof toSiteItem>[]; seeded: boolean }> = {}

    for (const flag of flags) {
      lists[flag.key.replace('items_seeded:', '')] = { items: [], seeded: true }
    }

    for (const row of rows) {
      lists[row.kind] ??= { items: [], seeded: false }
      lists[row.kind].items.push(toSiteItem(row))
    }

    sendJson(res, 200, { lists })
    return
  }

  const kind = parseKind(requested)

  const [rows, flag] = await Promise.all([
    query<SiteItemRow>('SELECT * FROM site_items WHERE kind = $1 ORDER BY position, id', [kind]),
    query<{ key: string }>('SELECT key FROM site_meta WHERE key = $1', [seedFlag(kind)]),
  ])

  sendJson(res, 200, {
    items: rows.map(toSiteItem),
    // Фронтенд по этому признаку решает, заливать ли стартовый набор:
    // пустой список без отметки — это новый сайт, а не «всё удалили»
    seeded: Boolean(flag.length),
  })
}

const createItem = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const kind = parseKind(body.kind)

  const count = await query<{ total: string }>(
    'SELECT count(*)::text AS total FROM site_items WHERE kind = $1',
    [kind],
  )

  if (Number(count[0]?.total ?? 0) >= MAX_ITEMS) {
    throw new HttpError(409, `В списке не может быть больше ${MAX_ITEMS} элементов`)
  }

  const rows = await query<SiteItemRow>(
    `INSERT INTO site_items (kind, position, fields)
     VALUES (
       $1,
       COALESCE((SELECT max(position) + 1 FROM site_items WHERE kind = $1), 1),
       $2::jsonb
     )
     RETURNING *`,
    [kind, JSON.stringify(parseFields(body.fields))],
  )

  sendJson(res, 201, { item: toSiteItem(rows[0]) })
}

const updateItem = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = requireId(body.id)

  const rows = await query<SiteItemRow>(
    'UPDATE site_items SET fields = $1::jsonb WHERE id = $2 RETURNING *',
    [JSON.stringify(parseFields(body.fields)), id],
  )

  if (!rows.length) throw new HttpError(404, 'Элемент не найден')
  sendJson(res, 200, { item: toSiteItem(rows[0]) })
}

const deleteItem = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const id = requireId(body.id)

  const rows = await query<{ id: number }>('DELETE FROM site_items WHERE id = $1 RETURNING id', [
    id,
  ])
  if (!rows.length) throw new HttpError(404, 'Элемент не найден')

  sendJson(res, 200, { ok: true })
}

/**
 * Заливка стартового набора. Выполняется один раз: повторный вызов
 * ничего не делает, иначе удалённые элементы возвращались бы.
 */
const seedItems = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const kind = parseKind(body.kind)

  if (!Array.isArray(body.items)) throw new HttpError(400, 'Поле «items» должно быть массивом')
  if (body.items.length > MAX_ITEMS) {
    throw new HttpError(400, `В стартовом наборе не может быть больше ${MAX_ITEMS} элементов`)
  }

  const items = body.items.map((item) => parseFields(item))
  const flag = seedFlag(kind)

  const existing = await query<{ key: string }>('SELECT key FROM site_meta WHERE key = $1', [flag])
  if (existing.length) {
    // Уже наполняли: отдаём то, что есть, и ничего не меняем
    const rows = await query<SiteItemRow>(
      'SELECT * FROM site_items WHERE kind = $1 ORDER BY position, id',
      [kind],
    )
    sendJson(res, 200, { items: rows.map(toSiteItem), seeded: true })
    return
  }

  await query(
    `WITH seed AS (
       SELECT * FROM unnest($2::jsonb[]) WITH ORDINALITY AS t(fields, ord)
     )
     INSERT INTO site_items (kind, position, fields)
     SELECT $1, ord, fields FROM seed`,
    [kind, items.map((fields) => JSON.stringify(fields))],
  )

  await query('INSERT INTO site_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [
    flag,
    new Date().toISOString(),
  ])

  const rows = await query<SiteItemRow>(
    'SELECT * FROM site_items WHERE kind = $1 ORDER BY position, id',
    [kind],
  )
  sendJson(res, 200, { items: rows.map(toSiteItem), seeded: true })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      await listItems(req, res)
      return
    }

    if (!(await requireAdmin(req, res))) return

    if (req.method === 'POST') {
      await createItem(req, res)
      return
    }

    if (req.method === 'PATCH') {
      await updateItem(req, res)
      return
    }

    if (req.method === 'DELETE') {
      await deleteItem(req, res)
      return
    }

    if (req.method === 'PUT') {
      await seedItems(req, res)
      return
    }

    res.statusCode = 405
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE, PUT')
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
