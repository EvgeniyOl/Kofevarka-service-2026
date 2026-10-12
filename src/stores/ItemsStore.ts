/**
 * Списки сайта: цифры, шаги работы, цены, вопросы, отзывы, принципы, команда.
 *
 * Почему один стор на все списки: набор полей у них разный и меняется
 * от блока к блоку, а поведение одинаковое — админ добавляет, правит
 * и удаляет элементы. Поэтому список определяется строковым ключом
 * («repair.faq»), а сами элементы лежат объектами.
 *
 * Значения по умолчанию живут в коде страниц. Пока список не наполнен,
 * посетитель видит их; админ при загрузке заливает их в базу — дальше
 * источником становится база, и удалённые элементы не возвращаются.
 */
import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError, type SiteItem } from '../api/client'

/** Значения одного элемента списка */
export type ItemValues = Record<string, string>

/** Элемент для показа: из базы или из значений по умолчанию */
export interface ListedItem {
  /** Идентификатор в базе; у элементов из кода его нет */
  id: number | null
  fields: ItemValues
}

/** Ошибка последнего действия: показывается в форме */
interface ListsState {
  items: ListedItem[]
  /** Список уже наполнен в базе: значит, элементы можно править и удалять */
  fromBase: boolean
}

export class ItemsStore {
  private lists = new Map<string, ListsState>()
  loading = true
  error: string | null = null
  busy = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  /**
   * Загружает все списки разом. Незаполненные заливает значениями из кода —
   * это может сделать только админ, поэтому у посетителя они просто
   * показываются как есть.
   */
  async load(defaults: Record<string, ItemValues[]>): Promise<void> {
    const kinds = Object.keys(defaults)

    try {
      const { lists } = await api.items()

      const states = new Map<string, ListsState>()
      const toSeed: string[] = []

      for (const kind of kinds) {
        const saved = lists[kind]

        if (saved?.seeded) {
          states.set(kind, { items: saved.items.map(toListed), fromBase: true })
          continue
        }

        toSeed.push(kind)
        states.set(kind, { items: defaults[kind].map(fromDefaults), fromBase: false })
      }

      runInAction(() => {
        this.lists = states
        this.error = null
      })

      // Наполняем базу стартовыми значениями. У посетителя прав нет —
      // запрос вернёт ошибку, и списки просто останутся из кода
      if (toSeed.length) await this.seedAll(toSeed, defaults)
    } catch (error) {
      runInAction(() => {
        // Тексты не загрузились — показываем варианты из кода,
        // чтобы страницы остались рабочими
        this.lists = new Map(
          kinds.map((kind) => [kind, { items: defaults[kind].map(fromDefaults), fromBase: false }]),
        )
        this.error = error instanceof ApiError ? error.message : 'Не удалось загрузить списки'
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  /** Элементы списка: из базы, а если он ещё не наполнен — из кода */
  items(kind: string, defaults: ItemValues[]): ListedItem[] {
    return this.lists.get(kind)?.items ?? defaults.map(fromDefaults)
  }

  /** Можно ли править элементы: до наполнения базы идентификаторов нет */
  editable(kind: string): boolean {
    return this.lists.get(kind)?.fromBase ?? false
  }

  clearError(): void {
    this.error = null
  }

  async add(kind: string, values: ItemValues): Promise<boolean> {
    return this.run(async () => {
      const { item } = await api.addItem(kind, values)
      const state = this.lists.get(kind)
      this.lists.set(kind, {
        items: [...(state?.items ?? []), toListed(item)],
        fromBase: true,
      })
    })
  }

  async update(id: number, values: ItemValues): Promise<boolean> {
    return this.run(async () => {
      const { item } = await api.updateItem(id, values)

      for (const [kind, state] of this.lists) {
        if (!state.items.some((listed) => listed.id === id)) continue
        this.lists.set(kind, {
          ...state,
          items: state.items.map((listed) => (listed.id === id ? toListed(item) : listed)),
        })
      }
    })
  }

  async remove(id: number): Promise<boolean> {
    return this.run(async () => {
      await api.removeItem(id)

      for (const [kind, state] of this.lists) {
        if (!state.items.some((listed) => listed.id === id)) continue
        this.lists.set(kind, { ...state, items: state.items.filter((listed) => listed.id !== id) })
      }
    })
  }

  /** Заливка стартовых значений: по одному запросу на список */
  private async seedAll(kinds: string[], defaults: Record<string, ItemValues[]>): Promise<void> {
    for (const kind of kinds) {
      try {
        const { items } = await api.seedItems(kind, defaults[kind])
        runInAction(() => {
          this.lists.set(kind, { items: items.map(toListed), fromBase: true })
        })
      } catch {
        // Нет прав или база недоступна: оставляем значения из кода
      }
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
        this.error = error instanceof ApiError ? error.message : 'Не удалось сохранить'
      })
      return false
    } finally {
      runInAction(() => {
        this.busy = false
      })
    }
  }
}

const toListed = (item: SiteItem): ListedItem => ({ id: item.id, fields: item.fields })

/**
 * Элемент из значений по умолчанию. Идентификатора у него нет: править
 * и удалять можно только то, что уже лежит в базе.
 */
const fromDefaults = (fields: ItemValues): ListedItem => ({ id: null, fields })
