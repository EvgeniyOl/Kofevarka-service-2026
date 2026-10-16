/**
 * Мои ремонты: список, карточка и создание заявки из мобильного приложения.
 *
 * GET  /api/me/repairs?scope=active|archive — ремонты текущего пользователя
 * GET  /api/me/repairs?id=42                — один ремонт с историей статусов
 * POST /api/me/repairs                      — новая заявка на ремонт
 *
 * Номер заявки передаём параметром запроса, а не сегментом пути: вложенный
 * файл вида api/me/repairs/[id].ts не проходит проверку типов (TypeScript
 * не разрешает относительные импорты с такой глубины), а поведение должно
 * совпадать и на Vercel, и в локальном плагине разработки.
 *
 * Авторизация: заголовок Authorization: Bearer <токен> либо cookie сессии.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  handleError,
  readJson,
  requireString,
  requireUser,
  sendJson,
  HttpError,
} from '../_lib/http.js'
import {
  createRepair,
  parseScope,
  repairForUser,
  repairsForUser,
  type CreateRepairInput,
} from '../_lib/repairs.js'
import { isDeviceKind, isRequestKind, type DeviceKind, type RequestKind } from '../_lib/types.js'

interface Body {
  kind?: unknown
  deviceKind?: unknown
  deviceModel?: unknown
  serial?: unknown
  problem?: unknown
  phone?: unknown
}

/** Необязательный текст: пустая строка и пробелы означают «не указано» */
const optionalString = (value: unknown, field: string, max: number): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new HttpError(400, `Поле «${field}» должно быть текстом`)

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw new HttpError(400, `Поле «${field}» слишком длинное`)
  return trimmed
}

const listRepairs = async (
  req: IncomingMessage,
  res: ServerResponse,
  userId: number,
): Promise<void> => {
  const url = new URL(req.url ?? '/', 'http://localhost')

  // Один ремонт: клиент открывает карточку и передаёт её номер
  const rawId = url.searchParams.get('id')
  if (rawId !== null) {
    const id = Number(rawId)
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Неверный номер заявки')

    sendJson(res, 200, { order: await repairForUser(userId, id) })
    return
  }

  const scope = parseScope(url.searchParams.get('scope'))
  sendJson(res, 200, { orders: await repairsForUser(userId, scope) })
}

const createNewRepair = async (
  req: IncomingMessage,
  res: ServerResponse,
  user: { id: number; name: string; email: string },
): Promise<void> => {
  const body = await readJson<Body>(req)

  const kind: RequestKind = isRequestKind(body.kind) ? body.kind : 'repair'
  const deviceKind: DeviceKind = isDeviceKind(body.deviceKind) ? body.deviceKind : 'coffee_machine'

  const input: CreateRepairInput = {
    kind,
    deviceKind,
    // Модель обязательна: без неё мастер не поймёт, к чему готовиться
    deviceModel: requireString(body.deviceModel, 'Модель техники', 120),
    serial: optionalString(body.serial, 'Серийный номер', 80),
    problem: requireString(body.problem, 'Описание проблемы', 2000),
    phone: optionalString(body.phone, 'Телефон', 40),
  }

  sendJson(res, 201, { order: await createRepair(user, input) })
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const user = await requireUser(req, res)
    if (!user) return

    if (req.method === 'GET') {
      await listRepairs(req, res, user.id)
      return
    }

    if (req.method === 'POST') {
      await createNewRepair(req, res, user)
      return
    }

    res.statusCode = 405
    res.end()
  } catch (error) {
    handleError(res, error)
  }
}
