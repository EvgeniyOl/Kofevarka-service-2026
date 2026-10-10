import { makeAutoObservable } from 'mobx'
import {
  PRODUCTS,
  ROAST_LABELS,
  type Grind,
  type Product,
  type Roast,
  type Size,
  type Badge,
} from '../data/products'
import type { CartStore } from './CartStore'

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'roast-asc'

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'price-asc', label: 'Сначала дешёвые' },
  { value: 'price-desc', label: 'Сначала дорогие' },
  { value: 'roast-asc', label: 'От светлой к тёмной' },
]

const BADGE_WEIGHT: Record<Badge, number> = { hit: 3, new: 2, limited: 1 }

/** Стор витрины: фильтры, сортировка и добавление в корзину */
export class CatalogStore {
  private readonly cart: CartStore

  search = ''
  roast: Roast | 'all' = 'all'
  country = 'all'
  decafOnly = false
  sort: SortKey = 'popular'
  /** Объём и помол, выбранные в карточках витрины */
  size: Size = 250
  grind: Grind = 'beans'
  /** id товара, который только что добавили — для вспышки «добавлено» */
  lastAddedId: string | null = null

  constructor(cart: CartStore) {
    this.cart = cart
    makeAutoObservable<CatalogStore, 'cart'>(this, { cart: false }, { autoBind: true })
  }

  get countries(): string[] {
    return [...new Set(PRODUCTS.map((product) => product.country))]
  }

  get visible(): Product[] {
    const query = this.search.trim().toLowerCase()

    const filtered = PRODUCTS.filter((product) => {
      if (this.roast !== 'all' && product.roast !== this.roast) return false
      if (this.country !== 'all' && product.country !== this.country) return false
      if (this.decafOnly && !product.decaf) return false
      if (!query) return true

      const haystack = [product.name, product.country, product.region, ...product.notes]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })

    return [...filtered].sort((a, b) => {
      switch (this.sort) {
        case 'price-asc':
          return a.price250 - b.price250
        case 'price-desc':
          return b.price250 - a.price250
        case 'roast-asc':
          return a.roast - b.roast
        default: {
          const weightA = a.badge ? BADGE_WEIGHT[a.badge] : 0
          const weightB = b.badge ? BADGE_WEIGHT[b.badge] : 0
          return weightB - weightA
        }
      }
    })
  }

  get totalCount(): number {
    return PRODUCTS.length
  }

  get visibleCount(): number {
    return this.visible.length
  }

  get hasFilters(): boolean {
    return (
      this.search.trim() !== '' ||
      this.roast !== 'all' ||
      this.country !== 'all' ||
      this.decafOnly ||
      this.sort !== 'popular'
    )
  }

  get roastSummary(): string {
    if (this.roast === 'all') return 'любая обжарка'
    return ROAST_LABELS[this.roast]
  }

  setSearch(value: string): void {
    this.search = value
  }

  setRoast(value: Roast | 'all'): void {
    this.roast = value
  }

  setCountry(value: string): void {
    this.country = value
  }

  toggleDecaf(): void {
    this.decafOnly = !this.decafOnly
  }

  setSort(value: SortKey): void {
    this.sort = value
  }

  setSize(value: Size): void {
    this.size = value
  }

  setGrind(value: Grind): void {
    this.grind = value
  }

  addToCart(productId: string): void {
    this.cart.add(productId, this.size, this.grind)
    this.lastAddedId = productId
  }

  resetFilters(): void {
    this.search = ''
    this.roast = 'all'
    this.country = 'all'
    this.decafOnly = false
    this.sort = 'popular'
  }
}
