/**
 * Единый справочник маршрутов: из него берут ссылки шапка, подвал и карточки.
 * Так название раздела не разъедется между меню и страницей.
 */

export interface RouteMeta {
  path: string
  /** Подпись в навигации */
  label: string
  /** Заголовок страницы для <title> */
  title: string
  /** Короткое описание раздела */
  description: string
}

export const ROUTES = {
  home: {
    path: '/',
    label: 'Главная',
    title: 'Kofevarka Service — ремонт кофемашин и кофе в Омске',
    description:
      'Ремонтируем бытовые и профессиональные кофемашины, продаём кофе, расходники и технику.',
  },
  repair: {
    path: '/repair',
    label: 'Ремонт',
    title: 'Ремонт кофемашин — Kofevarka Service',
    description:
      'Диагностика за день, запчасти на складе, выезд мастера и гарантия 6 месяцев на работы.',
  },
  catalog: {
    path: '/catalog',
    label: 'Витрина',
    title: 'Витрина — кофемашины, кофе и расходники — Kofevarka Service',
    description:
      'Кофемашины и кофемолки с гарантией, зерно обжарщиков, фильтры и средства для ухода.',
  },
  subscription: {
    path: '/subscription',
    label: 'Подписка',
    title: 'Подписка на кофе — Kofevarka Service',
    description: 'Кофе приезжает сам: выбираете объём, помол и ритм доставки.',
  },
  about: {
    path: '/about',
    label: 'О нас',
    title: 'О нас — Kofevarka Service',
    description: 'Мастерская на Декабристов: как мы ремонтируем кофемашины и что продаём.',
  },
  delivery: {
    path: '/delivery',
    label: 'Доставка',
    title: 'Доставка и оплата — Kofevarka Service',
    description: 'Курьер по городу, пункты выдачи и почта. Считаем стоимость и сроки.',
  },
  contacts: {
    path: '/contacts',
    label: 'Контакты',
    title: 'Контакты — Kofevarka Service',
    description: 'Мастерская, телефоны, почта и форма заявки на ремонт.',
  },
  cart: {
    path: '/cart',
    label: 'Корзина',
    title: 'Корзина — Kofevarka Service',
    description: 'Ваш заказ, промокод и итоговая сумма.',
  },
} as const satisfies Record<string, RouteMeta>

export type RouteKey = keyof typeof ROUTES

/** Разделы для меню — без корзины, она живёт отдельной кнопкой в шапке */
export const NAV_ROUTES: RouteMeta[] = [
  ROUTES.home,
  ROUTES.repair,
  ROUTES.catalog,
  ROUTES.subscription,
  ROUTES.about,
  ROUTES.delivery,
  ROUTES.contacts,
]
