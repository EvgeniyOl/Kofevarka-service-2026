/**
 * Тексты блоков, которыми управляет админ.
 *
 * Ключ блока — устойчивый идентификатор вида `repair.hero`. По нему страница
 * находит свои тексты, а в базе хранится только то, что админ менял.
 * Если записи нет, используется текст из кода: так правка одного заголовка
 * не требует дублировать в базе весь контент сайта.
 *
 * Набор полей у каждого блока свой и задаётся в data/blocks/*.ts,
 * поэтому здесь значения лежат обычным объектом, а не фиксированным списком.
 */
import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError } from '../api/client'

/** Тексты блока: имя поля — значение */
export type BlockValues = Record<string, string>

export const BLOCK_KEYS = {
  homeHero: 'home.hero',
  repairHero: 'repair.hero',
} as const

/**
 * Стор редактируемых текстов. Загружается один раз при старте приложения,
 * поэтому страницы читают значения синхронно и не мигают пустотой.
 */
export class ContentStore {
  /** Сохранённые в базе блоки, разложенные по ключу */
  private saved = new Map<string, BlockValues>()
  loading = true
  error: string | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async load(): Promise<void> {
    try {
      const { blocks } = await api.content()
      runInAction(() => {
        this.saved = new Map(blocks.map((block) => [block.key, block.fields]))
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

  /** Убрать сообщение об ошибке: вызывается при открытии формы */
  clearError(): void {
    this.error = null
  }

  /**
   * Тексты блока: сохранённые значения поверх значений из кода.
   * Пустые поля в базе не хранятся, поэтому подстановка безопасна.
   */
  block(key: string, defaults: BlockValues): BlockValues {
    const saved = this.saved.get(key)
    if (!saved) return defaults

    return { ...defaults, ...saved }
  }

  /** Сохранение правки из блока: возвращает true, если сервер принял текст */
  async save(key: string, values: BlockValues): Promise<boolean> {
    this.error = null

    try {
      const { block } = await api.saveContent({ key, fields: values })

      runInAction(() => {
        // Пустой ответ значит, что все поля очистили и блок вернулся к тексту из кода
        if (block) this.saved.set(key, block.fields)
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
