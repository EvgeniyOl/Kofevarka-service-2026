import { makeAutoObservable } from 'mobx'
import { findProduct, type Product } from '../data/products'

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
  readonly company = 'Kofevarka Service'
  readonly kicker = 'Ремонт кофемашин и кофе · мастерская в Омске с 2019 года'
  readonly heroTitle = 'Починим машину, подберём зерно'
  readonly heroLead =
    'Ремонтируем бытовые и профессиональные кофемашины, кофемолки и технику для кофеен: диагностика за день, запчасти на складе, гарантия на работы. И продаём то, в чём разбираемся — зерно, расходники и аксессуары.'

  readonly stats: HomeStat[] = [
    { value: 4200, suffix: 'машин', label: 'Отремонтировали с 2019 года' },
    { value: 6, suffix: 'месяцев', label: 'Гарантия на работу и запчасти' },
    { value: 1, suffix: 'день', label: 'Занимает диагностика' },
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

  /**
   * Подборка на главной: техника, расходник и услуга подменной машины.
   * Кофе не показываем — в карточке негде выбрать объём и помол,
   * для этого есть витрина.
   */
  readonly featuredIds = ['delonghi-magnifica-s', 'service-loan-machine', 'descaler-liquid']

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get featured(): Product[] {
    return this.featuredIds
      .map((id) => findProduct(id))
      .filter((product): product is Product => Boolean(product))
  }
}
