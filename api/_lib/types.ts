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
 * Редактируемый блок сайта. Все поля, кроме ключа, могут быть пустыми:
 * пустое значение означает «оставить текст из кода», поэтому админ
 * может менять только заголовок, не трогая остальное.
 */
export interface SiteContentRow {
  key: string
  title: string | null
  lead: string | null
  action_one: string | null
  action_two: string | null
  updated_at: string
}

export interface SiteContent {
  key: string
  title?: string
  lead?: string
  actionOne?: string
  actionTwo?: string
  updatedAt: string
}

export const toSiteContent = (row: SiteContentRow): SiteContent => ({
  key: row.key,
  // null превращаем в undefined: так фронтенд отличает «не задано»
  // от «задано пустой строкой»
  title: row.title ?? undefined,
  lead: row.lead ?? undefined,
  actionOne: row.action_one ?? undefined,
  actionTwo: row.action_two ?? undefined,
  updatedAt: row.updated_at,
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
