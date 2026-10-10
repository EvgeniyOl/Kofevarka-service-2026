import { makeAutoObservable } from 'mobx'

export type DeliveryMethod = 'courier' | 'pickup' | 'post'

export interface DeliveryZone {
  id: string
  name: string
  courierPrice: number
  days: string
  freeFrom: number
}

export interface DeliveryMethodInfo {
  id: DeliveryMethod
  title: string
  text: string
  priceNote: string
}

export interface FaqEntry {
  question: string
  answer: string
}

export const ZONES: DeliveryZone[] = [
  { id: 'center', name: 'Центр', courierPrice: 290, days: 'в день заказа', freeFrom: 2500 },
  { id: 'city', name: 'Остальной город', courierPrice: 390, days: '1 день', freeFrom: 3500 },
  { id: 'region', name: 'Область', courierPrice: 590, days: '2–3 дня', freeFrom: 6000 },
  { id: 'russia', name: 'Другие регионы', courierPrice: 890, days: '3–7 дней', freeFrom: 9000 },
]

export const METHODS: DeliveryMethodInfo[] = [
  {
    id: 'courier',
    title: 'Курьер',
    text: 'Привезём к двери, предупредим за час. Доставка по городу — каждый день, кроме воскресенья.',
    priceNote: 'по тарифу зоны',
  },
  {
    id: 'pickup',
    title: 'Пункт выдачи',
    text: 'Самовывоз из мастерской или 240 постаматов. Заказ ждёт 7 дней, хранение бесплатное.',
    priceNote: 'бесплатно',
  },
  {
    id: 'post',
    title: 'Почта и СДЭК',
    text: 'Для других регионов: трек-номер приходит в письме, страховка посылки включена.',
    priceNote: 'по тарифу перевозчика',
  },
]

/** Стор раздела доставки: калькулятор стоимости и сроков плюс FAQ */
export class DeliveryStore {
  zones = ZONES
  methods = METHODS

  zoneId = 'center'
  method: DeliveryMethod = 'courier'
  /** Вес заказа в граммах — влияет только на почтовую отправку */
  weight = 500
  /** Сумма заказа, ₽ */
  orderSum = 1800
  openFaqIndex: number | null = 0

  readonly faq: FaqEntry[] = [
    {
      question: 'Когда вы обжариваете и когда отправляете?',
      answer:
        'Ростер работает по вторникам и пятницам. Заказы, оформленные до 12:00 дня обжарки, уезжают в тот же день, остальные — в следующий ростер-день.',
    },
    {
      question: 'Сколько кофе должен отдохнуть после обжарки?',
      answer:
        'Фильтр раскрывается через 5–10 дней, эспрессо — через 10–14. Мы рекомендуем начинать с 7-го дня: к этому моменту дегазация уже не мешает экстракции.',
    },
    {
      question: 'Что если посылка пришла повреждённой?',
      answer:
        'Напишите в течение 3 дней и приложите фото. Заменим пакет или вернём деньги — упаковка едет за наш счёт.',
    },
    {
      question: 'Можно ли забрать заказ самому?',
      answer:
        'Да, мастерская открыта по будням с 10:00 до 19:00. Адрес придёт в письме после оформления, нужен только номер заказа.',
    },
  ]

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get zone(): DeliveryZone {
    return this.zones.find((item) => item.id === this.zoneId) ?? this.zones[0]
  }

  get methodInfo(): DeliveryMethodInfo {
    return this.methods.find((item) => item.id === this.method) ?? this.methods[0]
  }

  /** Итоговая стоимость доставки с учётом порога бесплатной доставки */
  get cost(): number {
    if (this.method === 'pickup') return 0
    if (this.method === 'post') return 190 + Math.ceil(this.weight / 500) * 90
    return this.orderSum >= this.zone.freeFrom ? 0 : this.zone.courierPrice
  }

  get eta(): string {
    if (this.method === 'pickup') return 'сегодня, после 14:00'
    if (this.method === 'post') return `${this.zone.id === 'russia' ? '3–7' : '2–3'} дня`
    return this.zone.days
  }

  get isFree(): boolean {
    return this.cost === 0
  }

  /** Сколько осталось добрать до бесплатной доставки в текущем сценарии */
  get freeFromLeft(): number {
    if (this.method !== 'courier') return 0
    return Math.max(0, this.zone.freeFrom - this.orderSum)
  }

  setZone(id: string): void {
    this.zoneId = id
  }

  setMethod(value: DeliveryMethod): void {
    this.method = value
  }

  setWeight(value: number): void {
    this.weight = Math.max(250, Math.min(5000, Math.round(value / 250) * 250))
  }

  setOrderSum(value: number): void {
    this.orderSum = Math.max(0, Math.min(50000, Math.round(value / 100) * 100))
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index
  }
}
