/**
 * Личный кабинет клиента: ремонты и их история.
 *
 * Заявка с сайта и заявка на ремонт — одна таблица site_requests: мастер ведёт
 * один список, а не два. Здесь только запросы, разбор входных данных и ответы
 * лежат в ручках (api/me/repairs.ts).
 */
import { query } from './db.js'
import { HttpError } from './http.js'
import {
  toRepairOrder,
  toSiteRequest,
  type AnyRequestStatus,
  type DeviceKind,
  type RepairOrder,
  type RepairStatus,
  type RequestEventRow,
  type RequestKind,
  type SiteRequest,
  type SiteRequestRow,
} from './types.js'

/** Идущие ремонты: всё, что ещё не закрыто */
const ACTIVE_STATUSES: RepairStatus[] = [
  'new',
  'accepted',
  'diagnostics',
  'approval',
  'waiting_parts',
  'repair',
  'ready',
]

/**
 * Завершённые ремонты. Кроме выдачи сюда попадают отказ и отмена, а также
 * старые статусы сайта: `done` проставляли заявкам до появления кабинета,
 * и такие заявки должны оказаться в архиве, а не пропасть из списка.
 * Поэтому тип — AnyRequestStatus, а не только статусы ремонта.
 */
const ARCHIVE_STATUSES: AnyRequestStatus[] = ['issued', 'declined', 'canceled', 'done']

export type RepairScope = 'active' | 'archive'

export const parseScope = (value: unknown): RepairScope =>
  value === 'archive' ? 'archive' : 'active'

const listForUser = async (userId: number, scope: RepairScope): Promise<SiteRequestRow[]> => {
  // Список статусов передаём параметром: свой для активных, свой для архива
  const statuses = scope === 'archive' ? ARCHIVE_STATUSES : ACTIVE_STATUSES

  return query<SiteRequestRow>(
    `SELECT * FROM site_requests
     WHERE user_id = $1 AND status = ANY($2::text[])
     ORDER BY updated_at DESC, id DESC
     LIMIT 100`,
    [userId, statuses],
  )
}

/** Ремонты клиента без истории: список в приложении историю не показывает */
export const repairsForUser = async (userId: number, scope: RepairScope): Promise<SiteRequest[]> =>
  (await listForUser(userId, scope)).map(toSiteRequest)

/**
 * Один ремонт вместе с историей статусов.
 * Чужую заявку не отдаём даже админу: для правки есть ручки админки, а
 * смешивать «мои ремонты» с «всеми заявками» — верный способ показать лишнее.
 */
export const repairForUser = async (userId: number, id: number): Promise<RepairOrder> => {
  const rows = await query<SiteRequestRow>(
    'SELECT * FROM site_requests WHERE id = $1 AND user_id = $2',
    [id, userId],
  )
  const row = rows[0]
  if (!row) throw new HttpError(404, 'Заявка не найдена')

  const events = await query<RequestEventRow>(
    'SELECT * FROM request_events WHERE request_id = $1 ORDER BY created_at DESC, id DESC',
    [id],
  )

  return toRepairOrder(row, events)
}

export interface CreateRepairInput {
  kind: RequestKind
  deviceKind: DeviceKind
  deviceModel: string
  serial: string | null
  problem: string
  phone: string | null
}

/**
 * Новая заявка из приложения. Первое событие пишем сразу: клиент открывает
 * карточку и видит хотя бы одну точку на таймлайне.
 */
export const createRepair = async (
  user: { id: number; name: string; email: string },
  input: CreateRepairInput,
): Promise<RepairOrder> => {
  const rows = await query<SiteRequestRow>(
    `INSERT INTO site_requests
       (user_id, name, email, message, status, kind, device_kind, device_model, serial, phone)
     VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      user.id,
      user.name,
      user.email,
      input.problem,
      input.kind,
      input.deviceKind,
      input.deviceModel,
      input.serial,
      input.phone,
    ],
  )

  const created = rows[0]
  const events = await query<RequestEventRow>(
    `INSERT INTO request_events (request_id, status, comment)
     VALUES ($1, 'new', 'Заявка принята')
     RETURNING *`,
    [created.id],
  )

  return toRepairOrder(created, events)
}

/**
 * Смена статуса ремонта. Нужна мастеру: без неё клиенту нечего отслеживать,
 * а в базе навсегда остаётся «new».
 */
export const updateRepairStatus = async (
  id: number,
  status: RepairStatus,
  comment: string,
): Promise<RepairOrder> => {
  const rows = await query<SiteRequestRow>(
    `UPDATE site_requests
     SET status = $2, master_comment = COALESCE(NULLIF($3, ''), master_comment), updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, comment],
  )

  const updated = rows[0]
  if (!updated) throw new HttpError(404, 'Заявка не найдена')

  await query(`INSERT INTO request_events (request_id, status, comment) VALUES ($1, $2, $3)`, [
    id,
    status,
    comment,
  ])

  return repairForUser(updated.user_id ?? 0, id)
}
