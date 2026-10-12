import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError, type Partner } from '../api/client'
import type { PartnerInput } from '../data/partners'

export type { PartnerInput } from '../data/partners'
export { emptyPartner } from '../data/partners'

/**
 * Стор партнёров: логотипы обжарщиков и короткие подписи к ним.
 *
 * Как и карточки направлений, партнёры живут в базе целиком: админ добавляет
 * и удаляет их сам, поэтому «значений по умолчанию» тут нет — стартовый список
 * заливает сервер при первом обращении (см. api/partners.ts).
 */
export class PartnersStore {
  partners: Partner[] = []
  loading = true
  /** Ошибка последнего действия: показывается в форме */
  error: string | null = null
  busy = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async load(): Promise<void> {
    try {
      const { partners } = await api.partners()
      runInAction(() => {
        this.partners = partners
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Не удалось загрузить партнёров'
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

  async add(values: PartnerInput): Promise<boolean> {
    return this.run(async () => {
      const { partner } = await api.addPartner(values)
      this.partners = [...this.partners, partner]
    })
  }

  async update(id: number, values: PartnerInput): Promise<boolean> {
    return this.run(async () => {
      const { partner } = await api.updatePartner({ id, ...values })
      this.partners = this.partners.map((item) => (item.id === id ? partner : item))
    })
  }

  async remove(id: number): Promise<boolean> {
    return this.run(async () => {
      await api.removePartner(id)
      this.partners = this.partners.filter((item) => item.id !== id)
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
        this.error = error instanceof ApiError ? error.message : 'Не удалось сохранить партнёра'
      })
      return false
    } finally {
      runInAction(() => {
        this.busy = false
      })
    }
  }
}
