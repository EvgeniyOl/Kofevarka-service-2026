import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError, type Direction } from '../api/client'
import { MAX_DIRECTIONS, type DirectionInput } from '../data/directions'

export { MAX_DIRECTIONS, emptyDirection } from '../data/directions'
export type { DirectionInput } from '../data/directions'

/**
 * Стор карточек направлений ремонта.
 *
 * В отличие от текстов блоков, карточки живут в базе целиком: админ может
 * добавлять и удалять их, поэтому «значений по умолчанию» здесь нет —
 * стартовый набор заливает сервер при первом обращении (см. api/directions.ts).
 */
export class DirectionsStore {
  directions: Direction[] = []
  loading = true
  /** Ошибка последнего действия: показывается в форме карточки */
  error: string | null = null
  /** Идёт сохранение: блокируем кнопки, чтобы не отправить дважды */
  busy = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  /** Можно ли добавить ещё карточку */
  get canAdd(): boolean {
    return this.directions.length < MAX_DIRECTIONS
  }

  get limitReached(): boolean {
    return this.directions.length >= MAX_DIRECTIONS
  }

  async load(): Promise<void> {
    try {
      const { directions } = await api.directions()
      runInAction(() => {
        this.directions = directions
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Не удалось загрузить карточки'
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  clearError(): void {
    this.error = null
  }

  async add(values: DirectionInput): Promise<boolean> {
    return this.run(async () => {
      const { direction } = await api.addDirection(values)
      this.directions = [...this.directions, direction]
    })
  }

  async update(id: number, values: DirectionInput): Promise<boolean> {
    return this.run(async () => {
      const { direction } = await api.updateDirection({ id, ...values })
      this.directions = this.directions.map((item) => (item.id === id ? direction : item))
    })
  }

  async remove(id: number): Promise<boolean> {
    return this.run(async () => {
      await api.removeDirection(id)
      this.directions = this.directions.filter((item) => item.id !== id)
    })
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
        this.error = error instanceof ApiError ? error.message : 'Не удалось сохранить карточку'
      })
      return false
    } finally {
      runInAction(() => {
        this.busy = false
      })
    }
  }
}
