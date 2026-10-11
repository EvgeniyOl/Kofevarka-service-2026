import { makeAutoObservable } from 'mobx'
import { findProduct, type Grind, type Product } from '../data/products'
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

/**
 * Стор главной: два направления сервиса — ремонт кофемашин и продажа кофе
 * с расходниками. Здесь герой, избранное из витрины, порядок работ, цифры
 * и отзывы.
 */
export class HomeStore {
  private readonly cart: CartStore

  readonly company = 'Kofevarka Service'
  readonly kicker = 'Ремонт кофемашин и кофе · мастерская в Омске с 2019 года'
  readonly heroTitle = 'Починим машину, подберём зерно'
  readonly heroLead =
    'Ремонтируем бытовые и профессиональные кофемашины, кофемолки и технику для кофеен: диагностика за день, запчасти на складе, гарантия на работы. И продаём то, в чём разбираемся — зерно, расходники и аксессуары.'

  readonly marquee = [
    'диагностика за день',
    'запчасти на складе',
    'выезд мастера',
    'обслуживание кофеен',
    'гарантия 6 месяцев',
    'зерно от обжарщиков',
  ]

  readonly stats: HomeStat[] = [
    { value: 4200, suffix: 'машин', label: 'Отремонтировали с 2019 года' },
    { value: 6, suffix: 'месяцев', label: 'Гарантия на работы' },
    { value: 1, suffix: 'день', label: 'На диагностику' },
    { value: 4.9, suffix: '★', label: 'Средняя оценка сервиса' },
  ]

  readonly values: HomeValue[] = [
    {
      icon: '🔧',
      title: 'Мастерская, а не витрина',
      text: 'Технику разбираем и чиним на месте: своя мастерская, стенд для пролива и склад запчастей под частые поломки.',
    },
    {
      icon: '🚚',
      title: 'Выезд мастера',
      text: 'Для кофеен и офисов приезжаем с запчастями: большинство аппаратов поднимаем за один визит.',
    },
    {
      icon: '🧾',
      title: 'Смета до работ',
      text: 'Сначала диагностика и цена, потом ремонт. Без «ещё вот это поменяем» задним числом.',
    },
    {
      icon: '☕',
      title: 'Кофе от обжарщиков',
      text: 'Продаём зерно проверенных обжарщиков и расходники: фильтры, средства от накипи, аксессуары.',
    },
  ]

  readonly steps: HomeStep[] = [
    {
      title: 'Заявка и диагностика',
      text: 'Опрашиваем по телефону, забираем технику или приезжаем сами. Диагностика — день, при ремонте бесплатно.',
    },
    {
      title: 'Смета и согласование',
      text: 'Говорим, что сломалось, сколько стоят запчасти и работа. Начинаем только после вашего «да».',
    },
    {
      title: 'Ремонт',
      text: 'Меняем изношенное, чистим гидросистему от накипи, проверяем помпу, бойлер и группу.',
    },
    {
      title: 'Пролив и гарантия',
      text: 'Настраиваем помол и температуру, отдаём с гарантией 6 месяцев на работу и запчасти.',
    },
  ]

  readonly testimonials: HomeTestimonial[] = [
    {
      name: 'Ирина Логинова',
      role: 'De’Longhi Magnifica, домашняя',
      text: 'Машина перестала тянуть воду. Позвонила утром — вечером забрали, через день вернули рабочей и с новой прокладкой. Сказали цену сразу, ничего не накручивали.',
      initials: 'ИЛ',
    },
    {
      name: 'Артём Ким',
      role: 'кофейня на 12 посадочных',
      text: 'Встала вторая группа в пятницу, к обеду приехал мастер и перебрал её на месте. Для нас простоя на два дня просто не было бы.',
      initials: 'АК',
    },
    {
      name: 'Ольга Павлова',
      role: 'офис, 40 человек',
      text: 'Держим две машины на обслуживании: сами звонят и приезжают чистить. За год ни одной поломки в час пик.',
      initials: 'ОП',
    },
  ]

  /** Что показываем на главной: техника и кофе вперемешку */
  readonly featuredIds = [
    'delonghi-magnifica-s',
    'espresso-blend',
    'eureka-mignon-specialita',
    'descaler-liquid',
  ]

  /** Объём и помол для карточек кофе, а также способ заваривания в рецепте */
  coffeeSize = '250'
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

  setCoffeeSize(value: string): void {
    this.coffeeSize = value
  }

  setGrind(value: Grind): void {
    this.grind = value
  }

  setBrew(id: string): void {
    this.activeBrewId = id
  }

  /** Помол передаём только для кофе: у техники и расходников его нет */
  addToCart(product: Product): void {
    if (product.category === 'coffee') {
      this.cart.add(product.id, this.coffeeSize, this.grind)
    } else {
      this.cart.add(product.id, '1')
    }
  }
}
