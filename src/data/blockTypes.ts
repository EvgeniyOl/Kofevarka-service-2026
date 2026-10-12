/**
 * Типы редактируемых блоков и списков.
 *
 * Живут отдельно от самих блоков, потому что блоки разложены по страницам
 * (`data/blocks/*.ts`) и импортируют эти типы: так не получается циклических
 * импортов через общий справочник.
 */
import type { BlockValues } from '../stores/ContentStore'

/** Поле формы: как подписать и что это за текст */
export interface EditableField {
  /** Имя поля в текстах блока */
  field: string
  label: string
  /** Подсказка под полем */
  hint?: string
  /** Многострочное поле — для описаний */
  multiline?: boolean
  /** Предел длины: совпадает с проверкой на сервере */
  max: number
}

export interface EditableBlock {
  key: string
  /** Название блока: показывается в форме правки */
  name: string
  /** Где блок видно на сайте */
  where: string
  defaults: BlockValues
  fields: EditableField[]
}
