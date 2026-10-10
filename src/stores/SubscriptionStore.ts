import { makeAutoObservable } from 'mobx'
import { findProduct, priceFor, type Grind, type Size } from '../data/products'
import type { CartStore } from './CartStore'

export type PlanKind = 'solo' | 'duo' | 'office'
export type FrequencyWeeks = 1 | 2 | 4

export interface PlanConfig {
  id: PlanKind
  title: string
  bags: number
  discount: number
  text: string
}

export const PLANS: PlanConfig[] = [
  {
    id: 'solo',
    title: 'Соло',
    bags: 1,
    discount: 0.1,
    text: 'Один пакет на доставку — чтобы кофе всегда был свежим, а не лежал полгода.',
  },
  {
    id: 'duo',
    title: 'Дуэт',
    bags: 2,
    discount: 0.15,
    text: 'Два пакета: один на будни, второй на выходные эксперименты.',
  },
  {
    id: 'office',
    title: 'Офис',
    bags: 4,
    discount: 0.2,
    text: 'Четыре пакета для команды. Меняем лоты каждый месяц, чтобы не приедалось.',
  },
]

export const FREQUENCIES: ReadonlyArray<{ value: FrequencyWeeks; label: string }> = [
  { value: 1, label: 'Каждую неделю' },
  { value: 2, label: 'Раз в 2 недели' },
  { value: 4, label: 'Раз в месяц' },
]

/** Стор подписки: конструктор плана и расчёт стоимости */
export class SubscriptionStore {
  private readonly cart: CartStore

  plan: PlanKind = 'solo'
  frequency: FrequencyWeeks = 2
  size: Size = 250
  grind: Grind = 'beans'
  productId = 'signature-blend'
  email = ''
  subscribed = false
  emailError: string | null = null

  constructor(cart: CartStore) {
    this.cart = cart
    makeAutoObservable<SubscriptionStore, 'cart'>(this, { cart: false }, { autoBind: true })
  }

  get plans(): PlanConfig[] {
    return PLANS
  }

  get currentPlan(): PlanConfig {
    return PLANS.find((item) => item.id === this.plan) ?? PLANS[0]
  }

  get product() {
    return findProduct(this.productId)
  }

  /** Цена одной доставки с учётом скидки подписки */
  get deliveryPrice(): number {
    const product = this.product
    if (!product) return 0
    const base = priceFor(product, this.size) * this.currentPlan.bags
    return Math.round(base * (1 - this.currentPlan.discount))
  }

  /** Цена без скидки — чтобы показать выгоду */
  get deliveryPriceBase(): number {
    const product = this.product
    if (!product) return 0
    return priceFor(product, this.size) * this.currentPlan.bags
  }

  get savingPerDelivery(): number {
    return this.deliveryPriceBase - this.deliveryPrice
  }

  /** Сколько доставок в месяц при выбранном ритме */
  get deliveriesPerMonth(): number {
    return Math.round((4 / this.frequency) * 10) / 10
  }

  get monthlyPrice(): number {
    return Math.round(this.deliveryPrice * this.deliveriesPerMonth)
  }

  get monthlySaving(): number {
    return Math.round(this.savingPerDelivery * this.deliveriesPerMonth)
  }

  get discountPercent(): number {
    return Math.round(this.currentPlan.discount * 100)
  }

  /** Дата следующей доставки от сегодняшнего дня */
  get nextDelivery(): string {
    const date = new Date()
    date.setDate(date.getDate() + this.frequency * 7)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email.trim())
  }

  setPlan(value: PlanKind): void {
    this.plan = value
  }

  setFrequency(value: FrequencyWeeks): void {
    this.frequency = value
  }

  setSize(value: Size): void {
    this.size = value
  }

  setGrind(value: Grind): void {
    this.grind = value
  }

  setProduct(value: string): void {
    this.productId = value
  }

  setEmail(value: string): void {
    this.email = value
    this.emailError = null
  }

  /** Первая доставка уезжает в корзину, подписка отмечается оформленной */
  subscribe(): boolean {
    if (!this.isEmailValid) {
      this.emailError = 'Нужна почта, чтобы присылать напоминания о доставке'
      return false
    }

    for (let index = 0; index < this.currentPlan.bags; index += 1) {
      this.cart.add(this.productId, this.size, this.grind)
    }

    this.subscribed = true
    this.emailError = null
    return true
  }

  reset(): void {
    this.subscribed = false
    this.email = ''
    this.emailError = null
  }
}
