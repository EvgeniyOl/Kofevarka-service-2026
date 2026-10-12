/**
 * Обращения к бэкенду. Все ручки живут по путям /api/*, и в разработке,
 * и в продакшене — поэтому базовый адрес указывать не нужно.
 *
 * credentials: 'include' обязателен: сессия лежит в httpOnly-cookie, и без
 * этого браузер не отправит её на другие страницы сайта.
 */
import type {
  Direction,
  Partner,
  PublicUser,
  SiteContent,
  SiteRequest,
  RequestStatus,
} from '../../api/_lib/types'

export type { Direction, Partner, PublicUser, SiteContent, SiteRequest, RequestStatus }

/** Ошибка с текстом от сервера: показываем её прямо в форме */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    })
  } catch {
    throw new ApiError(0, 'Сервер не отвечает. Проверьте соединение и попробуйте снова')
  }

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new ApiError(response.status, 'Сервер вернул неожиданный ответ')
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Ошибка ${response.status}`
    throw new ApiError(response.status, message)
  }

  return payload as T
}

export const api = {
  /** Кто сейчас вошёл */
  me: () => request<{ user: PublicUser | null }>('/auth/me'),

  register: (data: { name: string; email: string; password: string }) =>
    request<{ user: PublicUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: PublicUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  /** Заявка с формы обратной связи */
  createRequest: (data: { name: string; email: string; message: string }) =>
    request<{ request: SiteRequest }>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Заявки для админа */
  requests: () => request<{ requests: SiteRequest[] }>('/requests'),

  /**
   * Список пользователей для админа.
   * Смены роли здесь нет: администратор один и назначается при регистрации.
   */
  users: () => request<{ users: PublicUser[] }>('/users'),

  /** Редактируемые тексты блоков: читают все, сохраняет только админ */
  content: () => request<{ blocks: SiteContent[] }>('/content'),

  saveContent: (data: {
    key: string
    title?: string
    lead?: string
    actionOne?: string
    actionTwo?: string
  }) =>
    request<{ block: SiteContent | null }>('/content', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Карточки направлений ремонта: читают все, меняет только админ */
  directions: () => request<{ directions: Direction[] }>('/directions'),

  addDirection: (data: { icon: string; title: string; text: string; points: string[] }) =>
    request<{ direction: Direction }>('/directions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDirection: (data: {
    id: number
    icon: string
    title: string
    text: string
    points: string[]
  }) =>
    request<{ direction: Direction }>('/directions', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removeDirection: (id: number) =>
    request<{ ok: true }>('/directions', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),

  /** Партнёры: читают все, меняет только админ */
  partners: () => request<{ partners: Partner[] }>('/partners'),

  addPartner: (data: { name: string; note: string; logo: string }) =>
    request<{ partner: Partner }>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePartner: (data: { id: number; name: string; note: string; logo: string }) =>
    request<{ partner: Partner }>('/partners', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removePartner: (id: number) =>
    request<{ ok: true }>('/partners', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
}
