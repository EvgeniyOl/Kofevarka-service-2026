/**
 * Редактируемые тексты страницы «Ремонт».
 *
 * Списки (шаги, цены, вопросы) — отдельный механизм: они лежат в базе
 * и правятся по элементам, см. `data/lists.ts` и `components/EditableList.tsx`.
 */
import type { EditableBlock } from '../blockTypes'
import { BLOCK_KEYS } from '../../stores/ContentStore'

export const REPAIR_BLOCKS: Record<string, EditableBlock> = {
  hero: {
    key: BLOCK_KEYS.repairHero,
    name: 'Первый экран ремонта',
    where: 'Страница «Ремонт», начало',
    defaults: {
      title: 'Починим кофемашину — от домашней до кофейной',
      lead: 'Диагностика за один рабочий день, запчасти на складе, выезд мастера по Омску и гарантия 6 месяцев на работу. Ремонтируем любые марки, даже купленные не у нас.',
      actionOne: 'Позвонить',
      actionTwo: 'Оставить заявку',
    },
    fields: [
      { field: 'title', label: 'Заголовок', max: 200 },
      { field: 'lead', label: 'Описание', multiline: true, max: 600 },
      { field: 'actionOne', label: 'Первая кнопка', hint: 'К номеру телефона', max: 60 },
      { field: 'actionTwo', label: 'Вторая кнопка', hint: 'Ведёт на контакты', max: 60 },
    ],
  },

  steps: {
    key: 'repair.stepsTitle',
    name: 'Заголовок блока с шагами',
    where: 'Ремонт, блок «Как проходит ремонт»',
    defaults: { title: 'Как проходит ремонт' },
    fields: [{ field: 'title', label: 'Заголовок', max: 120 }],
  },

  prices: {
    key: 'repair.pricesTitle',
    name: 'Заголовок блока с ценами',
    where: 'Ремонт, блок «Ориентиры по цене»',
    defaults: {
      title: 'Ориентиры по цене',
      lead: 'Точную сумму называем после диагностики: цена зависит от модели, состояния гидросистемы и запчастей. Ниже — обычные для мастерской работы, чтобы вы понимали порядок цифр.',
    },
    fields: [
      { field: 'title', label: 'Заголовок', max: 120 },
      { field: 'lead', label: 'Описание', multiline: true, max: 600 },
    ],
  },

  faq: {
    key: 'repair.faqTitle',
    name: 'Заголовок частых вопросов',
    where: 'Ремонт, блок «Частые вопросы»',
    defaults: { title: 'Частые вопросы' },
    fields: [{ field: 'title', label: 'Заголовок', max: 120 }],
  },

  guarantee: {
    key: 'repair.guarantee',
    name: 'Гарантия',
    where: 'Ремонт, абзац под ценами',
    defaults: {
      text: 'На работу и запчасти даём 6 месяцев. Если та же неисправность вернётся — приедем и исправим за свой счёт.',
    },
    fields: [{ field: 'text', label: 'Текст', multiline: true, max: 600 }],
  },
}
