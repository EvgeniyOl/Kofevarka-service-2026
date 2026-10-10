import { makeAutoObservable } from 'mobx'
import { findProduct, type Grind, type Product, type Size } from '../data/products'
import type { CartStore } from './CartStore'

export interface HomeStat {
  value: number
  suffix: string
  label: string
}

export interface HomeValue {
  icon: string
  title: string
  text: string
}

export interface HomeStep {
  title: string
  text: string
}

export interface HomeTestimonial {
  name: string
  role: string
  text: string
  initials: string
}

/** Стор главной: герой, витрина избранного, цифры и отзывы */
export class HomeStore {
  private readonly cart: CartStore

  readonly company = 'Kofevarka Service'
  readonly kicker = 'Обжарка малыми партиями · с 2019 года'
  readonly heroTitle = 'Кофе, который пахнет утром'
  readonly heroLead =
    'Обжариваем спешелти-зерно по вторникам и пятницам и отправляем в день обжарки. Восемь лотов, честная цена за 100 грамм и никакого «кофе из ниоткуда».'
  readonly marquee = [
    'светлая обжарка',
    'single origin',
    'ручной отбор',
    'обжарка в день отправки',
    'цена за 100 г',
    'декаф без кофеина',
  ]

  readonly stats: HomeStat[] = [
    { value: 8, suffix: 'лотов', label: 'В постоянной витрине' },
    { value: 2400, suffix: 'кг', label: 'Обжарили за 2026 год' },
    { value: 48, suffix: 'часов', label: 'От обжарки до отправки' },
    { value: 4.9, suffix: '★', label: 'Средняя оценка заказов' },
  ]

  readonly values: HomeValue[] = [
    {
      icon: '🌱',
      title: 'Прямые контракты',
      text: 'Покупаем урожай у станций и фермеров, а не на бирже: знаем высоту, сорт и обработку каждого лота.',
    },
    {
      icon: '🔥',
      title: 'Обжарка под способ',
      text: 'Профиль обжарки подбираем под фильтр, эспрессо или гейзер — а не «средне на всё».',
    },
    {
      icon: '📦',
      title: 'Отправка в день обжарки',
      text: 'Фасуем в клапаны с дегазацией и отдаём курьеру в течение 48 часов после ростера.',
    },
    {
      icon: '📖',
      title: 'Понятные описания',
      text: 'Никаких «нот миндального цвета». Пишем, что реально чувствуется в чашке, и даём рецепт.',
    },
  ]

  readonly steps: HomeStep[] = [
    {
      title: 'Дегустация вслепую',
      text: 'Из 20–30 образцов сезона оставляем 8. Оцениваем сухую пробу, чашку и стабильность партии.',
    },
    {
      title: 'Профиль обжарки',
      text: 'Заводим кривую на роутере: 3–5 тестовых прогонов, замер плотности и экстракции.',
    },
    {
      title: 'Контроль в чашке',
      text: 'Каждую партию пробуем после 24 часов отдыха — по ней и решаем, отдавать ли в продажу.',
    },
  ]

  readonly testimonials: HomeTestimonial[] = [
    {
      name: 'Аня Ковалёва',
      role: 'домашняя эспрессо-машина',
      text: 'Signature наконец-то не горчит в молоке. Беру 2 кг раз в месяц и забываю о магазинном.',
      initials: 'АК',
    },
    {
      name: 'Дмитрий Соловьёв',
      role: 'кофейня на 12 посадочных',
      text: 'Гуji натуральной обработки ушёл в фильтр лучше, чем у поставщика, с которым работали три года.',
      initials: 'ДС',
    },
    {
      name: 'Марго Тимофеева',
      role: 'подписка «Дуэт»',
      text: 'Приятно, что в посылке всегда карточка с рецептом. Для новичка это половина удовольствия.',
      initials: 'МТ',
    },
  ]

  /** Что показываем на главной из витрины */
  readonly featuredIds = ['signature-blend', 'ethiopia-guji', 'kenya-nyeri', 'colombia-huila']

  /** Объём, помол и способ заваривания выбранной карточки */
  size: Size = 250
  grind: Grind = 'beans'
  brews: Array<{ id: string; label: string; ratio: string; time: string; temp: string }> = []
  activeBrewId = 'v60'

  constructor(cart: CartStore) {
    this.cart = cart
    this.brews = [
      { id: 'v60', label: 'V60', ratio: '1:16', time: '2:30', temp: '94 °C' },
      { id: 'aeropress', label: 'Aeropress', ratio: '1:13', time: '1:45', temp: '88 °C' },
      { id: 'espresso', label: 'Эспрессо', ratio: '1:2', time: '27 с', temp: '93 °C' },
      { id: 'french', label: 'Френч-пресс', ratio: '1:15', time: '4:00', temp: '96 °C' },
    ]
    makeAutoObservable<HomeStore, 'cart'>(this, { cart: false }, { autoBind: true })
  }

  get featured(): Product[] {
    return this.featuredIds
      .map((id) => findProduct(id))
      .filter((product): product is Product => Boolean(product))
  }

  get activeBrew(): { id: string; label: string; ratio: string; time: string; temp: string } {
    return this.brews.find((brew) => brew.id === this.activeBrewId) ?? this.brews[0]
  }

  setSize(value: Size): void {
    this.size = value
  }

  setGrind(value: Grind): void {
    this.grind = value
  }

  setBrew(id: string): void {
    this.activeBrewId = id
  }

  addToCart(productId: string): void {
    this.cart.add(productId, this.size, this.grind)
  }
}
