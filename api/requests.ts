/**
 * Заявки с сайта: сохранение из формы обратной связи и список для админа.
 *
 * POST /api/requests          — оставить заявку (доступно всем, вошедшему привязываем id)
 * GET  /api/requests          — список заявок (только админ)
 * GET  /api/requests?scope=mine — свои заявки (для личного кабинета)
 *
 * Подробные ремонты с историей статусов живут в ручках /api/me/repairs.
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
  HttpError,
} from './_lib/http.js'
import {
  isDeviceKind,
  isRequestKind,
  toSiteRequest,
  type DeviceKind,
  type RequestKind,
  type SiteRequestRow,
} from './_lib/types.js'

interface Body {
  name?: unknown
  email?: unknown
  message?: unknown
  /** Поля заявки на ремонт: приходят из мобильного приложения */
  kind?: unknown
  deviceKind?: unknown
  deviceModel?: unknown
  serial?: unknown
  phone?: unknown
}

const listRequests = async (res: ServerResponse): Promise<void> => {
  const rows = await query<SiteRequestRow>(
    'SELECT * FROM site_requests ORDER BY created_at DESC LIMIT 200',
  )
  sendJson(res, 200, { requests: rows.map(toSiteRequest) })
}

/** Свои заявки: их запрашивает личный кабинет в приложении */
const listOwnRequests = async (res: ServerResponse, userId: number): Promise<void> => {
  const rows = await query<SiteRequestRow>(
    'SELECT * FROM site_requests WHERE user_id = $1 ORDER BY updated_at DESC, id DESC LIMIT 100',
    [userId],
  )
  sendJson(res, 200, { requests: rows.map(toSiteRequest) })
}

/** Необязательный текст: пустая строка означает «не указано» */
const optionalString = (value: unknown, field: string, max: number): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new HttpError(400, `Поле «${field}» должно быть текстом`)

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw new HttpError(400, `Поле «${field}» слишком длинное`)
  return trimmed
}

const createRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson<Body>(req)
  const name = requireString(body.name, 'Имя', 100)
  const email = requireEmail(body.email)
  const message = requireString(body.message, 'Сообщение', 2000)

  // Если человек вошёл — привязываем заявку к аккаунту, но вход не обязателен
  const user = await currentUser(req)

  /*
   * Приложение присылает ещё и технику. Для старой формы эти поля пустые:
   * тогда модель выводим из имени, иначе в списке ремонтов была бы пустая строка.
   */
  const kind: RequestKind = isRequestKind(body.kind) ? body.kind : 'repair'
  const deviceKind: DeviceKind = isDeviceKind(body.deviceKind) ? body.deviceKind : 'coffee_machine'
  const deviceModel =
    optionalString(body.deviceModel, 'Модель техники', 120) ?? `Техника клиента ${name}`

  const rows = await query<SiteRequestRow>(
    `INSERT INTO site_requests
       (user_id, name, email, message, kind, device_kind, device_model, serial, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      user?.id ?? null,
      name,
      email,
      message,
      kind,
      deviceKind,
      deviceModel,
      optionalString(body.serial, 'Серийный номер', 80),
      optionalString(body.phone, 'Телефон', 40),
    ],
  )

  const created = rows[0]

  // Первое событие истории: в приложении таймлайн начинается с приёма заявки
  await query(`INSERT INTO request_events (request_id, status, comment) VALUES ($1, 'new', $2)`, [
    created.id,
    'Заявка принята',
  ])

  sendJson(res, 201, { request: toSiteRequest(created) })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method === 'POST') {
      await createRequest(req, res)
      return
    }

    if (req.method === 'GET') {
      const url = new URL(req.url ?? '/', 'http://localhost')

      // Свои заявки доступны любому вошедшему: это его собственные данные
      if (url.searchParams.get('scope') === 'mine') {
        const user = await currentUser(req)
        if (!user) {
          sendJson(res, 401, { error: 'Нужно войти в аккаунт' })
          return
        }
        await listOwnRequests(res, user.id)
        return
      }

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
