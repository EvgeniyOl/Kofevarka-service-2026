import { makeAutoObservable } from 'mobx'
import { findProduct, priceFor, type Grind, type Size } from '../data/products'

/** Строка корзины: один товар в конкретном объёме и помоле */
export interface CartLine {
  /** Ключ строки: одинаковый кофе в разном помоле — разные строки */
  id: string
  productId: string
  name: string
  country: string
  size: Size
  grind: Grind
  quantity: number
  unitPrice: number
}

const PROMO_CODES: Record<string, number> = {
  KOFE10: 0.1,
  GASTRO15: 0.15,
}

/** Корзина — общий стор: её читает и шапка, и страница заказа */
export class CartStore {
  lines: CartLine[] = []
  promoInput = ''
  appliedPromo: string | null = null
  promoError: string | null = null

  /** Порог бесплатной доставки и её стоимость, ₽ */
  readonly freeShippingFrom = 2500
  readonly shippingPrice = 290

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get count(): number {
    return this.lines.reduce((sum, line) => sum + line.quantity, 0)
  }

  get isEmpty(): boolean {
    return this.lines.length === 0
  }

  get subtotal(): number {
    return this.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  }

  get discountPercent(): number {
    return this.appliedPromo ? (PROMO_CODES[this.appliedPromo] ?? 0) : 0
  }

  get discount(): number {
    return Math.round(this.subtotal * this.discountPercent)
  }

  get payable(): number {
    return Math.max(0, this.subtotal - this.discount)
  }

  get shipping(): number {
    if (this.isEmpty) return 0
    return this.payable >= this.freeShippingFrom ? 0 : this.shippingPrice
  }

  get total(): number {
    return this.payable + this.shipping
  }

  /** Сколько ещё добрать до бесплатной доставки */
  get freeShippingLeft(): number {
    return Math.max(0, this.freeShippingFrom - this.payable)
  }

  get freeShippingProgress(): number {
    return Math.min(100, Math.round((this.payable / this.freeShippingFrom) * 100))
  }

  add(productId: string, size: Size, grind: Grind, quantity = 1): void {
    const product = findProduct(productId)
    if (!product) return

    const id = `${productId}:${size}:${grind}`
    const existing = this.lines.find((line) => line.id === id)

    if (existing) {
      existing.quantity += quantity
      return
    }

    this.lines.push({
      id,
      productId,
      name: product.name,
      country: product.country,
      size,
      grind,
      quantity,
      unitPrice: priceFor(product, size),
    })
  }

  remove(lineId: string): void {
    this.lines = this.lines.filter((line) => line.id !== lineId)
  }

  setQuantity(lineId: string, quantity: number): void {
    const line = this.lines.find((item) => item.id === lineId)
    if (!line) return
    line.quantity = Math.max(1, Math.min(20, Math.round(quantity)))
  }

  increment(lineId: string): void {
    const line = this.lines.find((item) => item.id === lineId)
    if (line) line.quantity = Math.min(20, line.quantity + 1)
  }

  decrement(lineId: string): void {
    const line = this.lines.find((item) => item.id === lineId)
    if (line) line.quantity = Math.max(1, line.quantity - 1)
  }

  clear(): void {
    this.lines = []
    this.appliedPromo = null
    this.promoInput = ''
    this.promoError = null
  }

  setPromoInput(value: string): void {
    this.promoInput = value
    this.promoError = null
  }

  applyPromo(): void {
    const code = this.promoInput.trim().toUpperCase()

    if (!code) {
      this.promoError = 'Введите промокод'
      return
    }

    if (!(code in PROMO_CODES)) {
      this.promoError = `Промокод «${code}» не найден`
      return
    }

    this.appliedPromo = code
    this.promoError = null
  }

  resetPromo(): void {
    this.appliedPromo = null
    this.promoInput = ''
    this.promoError = null
  }
}
