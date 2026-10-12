/**
 * Тексты блоков, которыми управляет админ.
 *
 * Ключ блока — устойчивый идентификатор вида `repair.hero`. По нему страница
 * находит свои тексты, а в базе хранится только то, что админ менял.
 * Если записи нет, используется текст из кода: так правка одного заголовка
 * не требует дублировать в базе весь контент сайта.
 */
import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError, type SiteContent } from '../api/client'

/** Что можно переопределить в блоке */
export interface BlockText {
  title?: string
  lead?: string
  /** Первая кнопка блока: «Позвонить» или похожая */
  actionOne?: string
  /** Вторая кнопка: «Оставить заявку» или похожая */
  actionTwo?: string
}

/** Тексты по умолчанию: то, что видно, пока админ ничего не менял */
export type BlockDefaults = Required<BlockText>

export const BLOCK_KEYS = {
  repairHero: 'repair.hero',
} as const

/**
 * Стор редактируемых текстов. Загружается один раз при старте приложения,
 * поэтому страницы читают значения синхронно и не мигают пустотой.
 */
export class ContentStore {
  /** Сохранённые в базе блоки, разложенные по ключу */
  private saved = new Map<string, SiteContent>()
  loading = true
  error: string | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async load(): Promise<void> {
    try {
      const { blocks } = await api.content()
      runInAction(() => {
        this.saved = new Map(blocks.map((block) => [block.key, block]))
        this.error = null
      })
    } catch (error) {
      // Сайт информационный: если тексты не загрузились, показываем варианты
      // из кода — страница остаётся рабочей
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Не удалось загрузить тексты'
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  /** Что сохранено для блока — нужно форме в админке */
  savedFor(key: string): SiteContent | undefined {
    return this.saved.get(key)
  }

  /**
   * Тексты блока: сохранённые значения поверх значений из кода.
   * Пустое поле в базе не хранится, поэтому подстановка безопасна.
   */
  block(key: string, defaults: BlockDefaults): BlockDefaults {
    const saved = this.saved.get(key)
    if (!saved) return defaults

    return {
      title: saved.title ?? defaults.title,
      lead: saved.lead ?? defaults.lead,
      actionOne: saved.actionOne ?? defaults.actionOne,
      actionTwo: saved.actionTwo ?? defaults.actionTwo,
    }
  }

  /** Сохранение из админки: возвращает true, если сервер принял правку */
  async save(key: string, values: BlockText): Promise<boolean> {
    this.error = null

    try {
      const { block } = await api.saveContent({ key, ...values })

      runInAction(() => {
        // Пустой ответ значит, что все поля очистили и блок вернулся к тексту из кода
        if (block) this.saved.set(key, block)
        else this.saved.delete(key)
      })
      return true
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof ApiError ? error.message : 'Не удалось сохранить текст'
      })
      return false
    }
  }
}
