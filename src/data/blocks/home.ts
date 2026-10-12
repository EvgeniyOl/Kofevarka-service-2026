/**
 * Редактируемые тексты главной страницы.
 *
 * Каждый блок — это то, что админ видит на странице и может поправить
 * по кнопке «Изменить»: заголовки секций, описания и подписи кнопок.
 * Значения по умолчанию берутся отсюда, пока админ ничего не менял.
 */
import type { EditableBlock, EditableField } from '../blockTypes'
import { BLOCK_KEYS } from '../../stores/ContentStore'

/** Заголовок секции: надзаголовок, название и подпись под ним */
const sectionFields = (withLead: boolean): EditableField[] => [
  { field: 'kicker', label: 'Надзаголовок', hint: 'Короткая строка над названием', max: 60 },
  { field: 'title', label: 'Заголовок', max: 200 },
  ...(withLead
    ? [{ field: 'lead', label: 'Описание', multiline: true, max: 600 } as EditableField]
    : []),
]

export const HOME_BLOCKS: Record<string, EditableBlock> = {
  hero: {
    key: BLOCK_KEYS.homeHero,
    name: 'Первый экран главной',
    where: 'Главная страница, начало',
    defaults: {
      kicker: 'Ремонт кофемашин и кофе · мастерская в Омске с 2019 года',
      title: 'Kofevarka Service',
      subtitle: 'Починим машину, подберём зерно',
      lead: 'Ремонтируем бытовые и профессиональные кофемашины, кофемолки и технику для кофеен: диагностика за день, запчасти на складе, гарантия на работы. И продаём то, в чём разбираемся — зерно, расходники и аксессуары.',
    },
    fields: [
      { field: 'kicker', label: 'Надзаголовок', hint: 'Строка над названием', max: 120 },
      { field: 'title', label: 'Название', max: 60 },
      { field: 'subtitle', label: 'Подзаголовок', max: 120 },
      { field: 'lead', label: 'Описание', multiline: true, max: 600 },
    ],
  },

  featured: {
    key: 'home.featured',
    name: 'Что берут вместе с ремонтом',
    where: 'Главная, блок с подборкой товаров',
    defaults: {
      kicker: 'Что мы делаем',
      title: 'Что берут вместе с ремонтом',
      lead: 'Технику привозим и настраиваем, расходники и подменную машину подбираем вместе с ремонтом. Наличие и цену уточняйте по телефону — соберём заказ и привезём.',
    },
    fields: sectionFields(true),
  },

  values: {
    key: 'home.values',
    name: 'Правила работы',
    where: 'Главная, блок «Как мы работаем»',
    defaults: {
      kicker: 'Как мы работаем',
      title: 'Четыре правила, из которых ничего не выкинуть',
      lead: '',
    },
    fields: sectionFields(false),
  },

  steps: {
    key: 'home.steps',
    name: 'Как проходит ремонт',
    where: 'Главная, блок «Процесс»',
    defaults: {
      kicker: 'Процесс',
      title: 'Как проходит ремонт',
      lead: 'Четыре шага, после которых машина снова варит, а не шипит. Диагностика бесплатна, если ремонт делаем мы.',
    },
    fields: sectionFields(true),
  },

  testimonials: {
    key: 'home.testimonials',
    name: 'Отзывы',
    where: 'Главная, блок «Отзывы»',
    defaults: {
      kicker: 'Отзывы',
      title: 'Домашние машины, кофейни и офисы',
      lead: '',
    },
    fields: sectionFields(false),
  },

  cta: {
    key: 'home.cta',
    name: 'Призыв в конце главной',
    where: 'Главная, блок перед подвалом',
    defaults: {
      title: 'Машина встала в самый неподходящий день',
      lead: 'Опишите симптом по телефону — скажем, ремонт это или настройка, и когда сможем забрать технику. Кофе и расходники привезём вместе с мастером.',
      action: 'Оставить заявку',
    },
    fields: [
      { field: 'title', label: 'Заголовок', max: 200 },
      { field: 'lead', label: 'Описание', multiline: true, max: 600 },
      { field: 'action', label: 'Надпись на кнопке', hint: 'Ведёт на контакты', max: 60 },
    ],
  },
}
