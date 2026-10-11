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
    title: 'Доставка по Омску — Kofevarka Service',
    description: 'Курьер по городу бесплатно от 3 кг кофе и самовывоз из мастерской.',
  },
  contacts: {
    path: '/contacts',
    label: 'Контакты',
    title: 'Контакты — Kofevarka Service',
    description: 'Мастерская, телефоны, почта и форма заявки на ремонт.',
  },
  /*
   * Вход, регистрация и админка в меню не выводятся: в шапке для них
   * отдельные кнопки, а админка закрыта ролью (см. RequireAuth).
   */
  login: {
    path: '/login',
    label: 'Вход',
    title: 'Вход — Kofevarka Service',
    description: 'Вход в личный кабинет.',
  },
  register: {
    path: '/register',
    label: 'Регистрация',
    title: 'Регистрация — Kofevarka Service',
    description: 'Создание аккаунта на сайте мастерской.',
  },
  admin: {
    path: '/admin',
    label: 'Админка',
    title: 'Админка — Kofevarka Service',
    description: 'Заявки с сайта и управление пользователями.',
  },
} as const satisfies Record<string, RouteMeta>

/**
 * Разделы для меню. Витрины и корзины в проекте нет: сайт рассказывает
 * о ремонте и подписке, а заказы принимаем по телефону и заявкой.
 */
export const NAV_ROUTES: RouteMeta[] = [
  ROUTES.home,
  ROUTES.repair,
  ROUTES.subscription,
  ROUTES.about,
  ROUTES.delivery,
  ROUTES.contacts,
]
