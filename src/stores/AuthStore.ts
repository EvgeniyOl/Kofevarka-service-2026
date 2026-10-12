import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError, type PublicUser, type SiteRequest, type RequestStatus } from '../api/client'

export type { RequestStatus }

/**
 * Стор авторизации: кто вошёл и что доступно по его роли.
 *
 * Сессия живёт в httpOnly-cookie на сервере, поэтому в сторе только
 * отражение состояния: при загрузке страницы спрашиваем сервер, кто вошёл.
 */
export class AuthStore {
  user: PublicUser | null = null
  /** Первая проверка сессии ещё идёт — показываем заглушку вместо формы */
  loading = true
  /** Ошибка последнего действия: показывается в форме входа или регистрации */
  error: string | null = null
  /** Признак, что идёт отправка формы */
  busy = false

  /** Заявки: список для админа */
  requests: SiteRequest[] = []
  requestsLoading = false

  /** Пользователи: список для админа */
  users: PublicUser[] = []
  usersLoading = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get isAuthenticated(): boolean {
    return this.user !== null
  }

  get isAdmin(): boolean {
    return this.user?.role === 'admin'
  }

  /** Проверка сессии при старте приложения */
  async load(): Promise<void> {
    try {
      const { user } = await api.me()
      runInAction(() => {
        this.user = user
      })
    } catch {
      // Сервер недоступен или базы нет — считаем, что вход не выполнен
      runInAction(() => {
        this.user = null
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  setError(message: string | null): void {
    this.error = message
  }

  async login(email: string, password: string): Promise<boolean> {
    return this.run(async () => {
      const { user } = await api.login({ email, password })
      this.user = user
    })
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    return this.run(async () => {
      const { user } = await api.register({ name, email, password })
      this.user = user
    })
  }

  async logout(): Promise<void> {
    try {
      await api.logout()
    } finally {
      runInAction(() => {
        this.user = null
        this.requests = []
        this.users = []
      })
    }
  }

  async loadRequests(): Promise<void> {
    this.requestsLoading = true
    try {
      const { requests } = await api.requests()
      runInAction(() => {
        this.requests = requests
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Не удалось загрузить заявки'
      })
    } finally {
      runInAction(() => {
        this.requestsLoading = false
      })
    }
  }

  async loadUsers(): Promise<void> {
    this.usersLoading = true
    try {
      const { users } = await api.users()
      runInAction(() => {
        this.users = users
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Не удалось загрузить список'
      })
    } finally {
      runInAction(() => {
        this.usersLoading = false
      })
    }
  }

  /** Общая обвязка: сбросить ошибку, отправить, запомнить результат */
  private async run(action: () => Promise<void>): Promise<boolean> {
    this.busy = true
    this.error = null

    try {
      await action()
      return true
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Что-то пошло не так'
      })
      return false
    } finally {
      runInAction(() => {
        this.busy = false
      })
    }
  }
}
