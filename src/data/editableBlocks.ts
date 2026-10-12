/**
 * Справочник блоков, которые админ может править из админки.
 *
 * Здесь лежат значения по умолчанию — то, что видно на сайте, пока правок нет.
 * Страница берёт тексты через `content.block(ключ, дефолты)` из ContentStore,
 * а админка строит по этому же списку форму редактирования.
 *
 * Чтобы добавить новый блок: допишите ключ в BLOCK_KEYS (stores/ContentStore),
 * положите сюда дефолты и добавьте запись в EDITABLE_BLOCKS — страница возьмёт
 * тексты оттуда, а форма появится в админке сама.
 */
import { BLOCK_KEYS, type BlockDefaults } from '../stores/ContentStore'

/** Поле формы: как подписать и что это за текст */
export interface EditableField {
  /** Имя поля в BlockText */
  field: keyof BlockDefaults
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
  /** Название блока в админке */
  name: string
  /** Где блок видно на сайте */
  where: string
  defaults: BlockDefaults
  fields: EditableField[]
}

/** Поля первого экрана: одинаковы для всех подобных блоков */
const heroFields: EditableField[] = [
  { field: 'title', label: 'Заголовок', max: 200 },
  { field: 'lead', label: 'Описание', multiline: true, max: 600 },
  { field: 'actionOne', label: 'Первая кнопка', hint: 'К номеру телефона', max: 60 },
  { field: 'actionTwo', label: 'Вторая кнопка', hint: 'Ведёт на контакты', max: 60 },
]

export const EDITABLE_BLOCKS: EditableBlock[] = [
  {
    key: BLOCK_KEYS.repairHero,
    name: 'Первый экран ремонта',
    where: 'Страница «Ремонт», начало',
    defaults: {
      title: 'Починим кофемашину — от домашней до кофейной',
      lead: 'Диагностика за один рабочий день, запчасти на складе, выезд мастера по Омску и гарантия 6 месяцев на работу. Ремонтируем любые марки, даже купленные не у нас.',
      actionOne: 'Позвонить',
      actionTwo: 'Оставить заявку',
    },
    fields: heroFields,
  },
]
