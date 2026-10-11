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
