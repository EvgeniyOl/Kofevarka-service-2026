/**
 * Общие типы бэкенда. Этот код выполняется на сервере — в функциях Vercel,
 * а при разработке в самом Vite (см. apiDevPlugin в vite.config.ts).
 * Поэтому здесь нет ничего из браузерного окружения.
 */

export type Role = 'client' | 'admin'

export interface UserRow {
  id: number
  email: string
  name: string
  role: Role
  created_at: string
  /** Хеш пароля. Нужен только для проверки входа и наружу не отдаётся */
  password: string
}

/** Пользователь в том виде, в каком его отдаём на фронтенд: без хеша пароля */
export interface PublicUser {
  id: number
  email: string
  name: string
  role: Role
  createdAt: string
}

export type RequestStatus = 'new' | 'in_progress' | 'done'

/**
 * Статусы ремонта для личного кабинета клиента. Значения должны совпадать
 * с REPAIR_STATUSES в packages/shared проекта KofevarkaMob: приложение
 * показывает подписи по этим ключам.
 */
export const REPAIR_STATUSES = [
  'new',
  'accepted',
  'diagnostics',
  'approval',
  'waiting_parts',
  'repair',
  'ready',
  'issued',
  'declined',
  'canceled',
] as const

export type RepairStatus = (typeof REPAIR_STATUSES)[number]

/** Статус заявки: старые значения тоже встречаются — их проставили до кабинета */
export type AnyRequestStatus = RequestStatus | RepairStatus

export const isRepairStatus = (value: unknown): value is RepairStatus =>
  typeof value === 'string' && (REPAIR_STATUSES as readonly string[]).includes(value)

/** Виды техники: те же ключи, что в приложении */
export const DEVICE_KINDS = [
  'coffee_machine',
  'professional',
  'grinder',
  'coffee_maker',
  'kettle',
  'other',
] as const

export type DeviceKind = (typeof DEVICE_KINDS)[number]

export const isDeviceKind = (value: unknown): value is DeviceKind =>
  typeof value === 'string' && (DEVICE_KINDS as readonly string[]).includes(value)

/** Что нужно клиенту: ремонт, диагностика, обслуживание, вывоз техники */
export const REQUEST_KINDS = [
  'diagnostics',
  'repair',
  'maintenance',
  'pickup',
  'consultation',
] as const

export type RequestKind = (typeof REQUEST_KINDS)[number]

export const isRequestKind = (value: unknown): value is RequestKind =>
  typeof value === 'string' && (REQUEST_KINDS as readonly string[]).includes(value)

export interface SiteRequestRow {
  id: number
  user_id: number | null
  name: string
  email: string
  message: string
  status: AnyRequestStatus
  kind: RequestKind
  device_kind: DeviceKind
  device_model: string
  serial: string | null
  phone: string | null
  master_comment: string | null
  price: number | null
  warranty_days: number | null
  created_at: string
  updated_at: string
}

export interface SiteRequest {
  id: number
  userId: number | null
  name: string
  email: string
  message: string
  /**
   * Описание проблемы теми же словами, что в message. Колонка в базе одна
   * (message — историческое имя для формы сайта), но мобильному приложению
   * нужно поле problem: он показывает его клиенту как «что случилось».
   */
  problem: string
  status: AnyRequestStatus
  kind: RequestKind
  deviceKind: DeviceKind
  deviceModel: string
  serial: string | null
  phone: string | null
  masterComment: string | null
  price: number | null
  warrantyDays: number | null
  createdAt: string
  updatedAt: string
}

/** Событие истории ремонта: точка на таймлайне в приложении */
export interface RequestEventRow {
  id: number
  request_id: number
  status: string
  comment: string
  created_at: string
}

export interface RequestEvent {
  id: number
  status: AnyRequestStatus
  comment: string
  createdAt: string
}

/** Ремонт в личном кабинете: заявка вместе с историей статусов */
export interface RepairOrder extends SiteRequest {
  events: RequestEvent[]
}

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  createdAt: row.created_at,
})

export const toSiteRequest = (row: SiteRequestRow): SiteRequest => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  email: row.email,
  message: row.message,
  problem: row.message,
  status: row.status,
  kind: row.kind,
  deviceKind: row.device_kind,
  deviceModel: row.device_model,
  serial: row.serial,
  phone: row.phone,
  masterComment: row.master_comment,
  price: row.price,
  warrantyDays: row.warranty_days,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const toRequestEvent = (row: RequestEventRow): RequestEvent => ({
  id: row.id,
  status: row.status as AnyRequestStatus,
  comment: row.comment,
  createdAt: row.created_at,
})

export const toRepairOrder = (row: SiteRequestRow, events: RequestEventRow[]): RepairOrder => ({
  ...toSiteRequest(row),
  events: events.map(toRequestEvent),
})

/**
 * Редактируемый блок сайта. Поля лежат объектом: у каждого блока свой набор,
 * поэтому схема таблицы не знает, какие именно тексты в нём. Пустое значение
 * означает «оставить текст из кода» — админ может поменять только заголовок,
 * не трогая остальное.
 */
export interface SiteContentRow {
  key: string
  fields: Record<string, string>
  updated_at: string
}

export interface SiteContent {
  key: string
  fields: Record<string, string>
  updatedAt: string
}

export const toSiteContent = (row: SiteContentRow): SiteContent => ({
  key: row.key,
  fields: row.fields ?? {},
  updatedAt: row.updated_at,
})

/** Сколько полей может быть в одном блоке */
export const MAX_BLOCK_FIELDS = 12

/** Предел длины одного поля блока */
export const MAX_FIELD_LENGTH = 600

/** Сколько полей может быть у элемента списка */
export const MAX_ITEM_FIELDS = 12

/** Предел длины одного поля элемента списка: в отзывах бывают длинные тексты */
export const MAX_ITEM_FIELD_LENGTH = 1200

/** Сколько элементов разрешено держать в одном списке */
export const MAX_ITEMS = 60

/** Элемент универсального списка: набор полей зависит от списка */
export interface SiteItemRow {
  id: number
  kind: string
  position: number
  fields: Record<string, string>
}

export interface SiteItem {
  id: number
  fields: Record<string, string>
}

export const toSiteItem = (row: SiteItemRow): SiteItem => ({
  id: row.id,
  fields: row.fields ?? {},
})

/** Сколько карточек направлений разрешено держать */
export const MAX_DIRECTIONS = 6

export interface DirectionRow {
  id: number
  position: number
  icon: string
  title: string
  text: string
  points: string[]
}

export interface Direction {
  id: number
  icon: string
  title: string
  text: string
  points: string[]
}

export const toDirection = (row: DirectionRow): Direction => ({
  id: row.id,
  icon: row.icon,
  title: row.title,
  text: row.text,
  points: row.points,
})

/** Партнёр: логотип и короткая подпись */
export interface PartnerRow {
  id: number
  position: number
  name: string
  note: string
  logo: string
}

export interface Partner {
  id: number
  name: string
  note: string
  /**
   * Путь к файлу («/photos/partners/santino.png») или data URL, если логотип
   * загрузили из админки.
   */
  logo: string
}

export const toPartner = (row: PartnerRow): Partner => ({
  id: row.id,
  name: row.name,
  note: row.note,
  logo: row.logo,
})

/**
 * Предел размера логотипа. Картинка хранится в базе как data URL, поэтому
 * ограничение нужно: иначе одна загрузка раздувает ответ API на мегабайты.
 */
export const MAX_LOGO_LENGTH = 700_000
