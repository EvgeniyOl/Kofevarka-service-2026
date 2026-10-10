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
    title: 'Kofevarka Service — свежая обжарка с доставкой',
    description: 'Обжариваем спешелти-кофе малыми партиями и отправляем в день обжарки.',
  },
  catalog: {
    path: '/catalog',
    label: 'Витрина',
    title: 'Витрина кофе — Kofevarka Service',
    description: 'Восемь лотов из Эфиопии, Кении, Колумбии и не только: фильтр, эспрессо, декоф.',
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
    description: 'Небольшая обжарочная мастерская: как мы выбираем зерно и жарим.',
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
    description: 'Мастерская, телефон, почта и форма обратной связи.',
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
  ROUTES.catalog,
  ROUTES.subscription,
  ROUTES.about,
  ROUTES.delivery,
  ROUTES.contacts,
]
