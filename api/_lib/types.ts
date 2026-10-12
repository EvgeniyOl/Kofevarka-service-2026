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

export interface SiteRequestRow {
  id: number
  user_id: number | null
  name: string
  email: string
  message: string
  status: RequestStatus
  created_at: string
}

export interface SiteRequest {
  id: number
  name: string
  email: string
  message: string
  status: RequestStatus
  createdAt: string
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
  name: row.name,
  email: row.email,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
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
