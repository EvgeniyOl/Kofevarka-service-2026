import { makeAutoObservable } from 'mobx'
import {
  CATEGORY_LABELS,
  PRODUCTS,
  ROAST_LABELS,
  type Badge,
  type Category,
  type Grind,
  type Product,
  type Roast,
} from '../data/products'
import type { CartStore } from './CartStore'

export type SortKey = 'popular' | 'price-asc' | 'price-desc'
export type CategoryFilter = Category | 'all'

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'price-asc', label: 'Сначала дешёвые' },
  { value: 'price-desc', label: 'Сначала дорогие' },
]

export const CATEGORY_FILTERS: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'Всё' },
  { value: 'coffee', label: 'Кофе' },
  { value: 'machines', label: 'Техника' },
  { value: 'supplies', label: 'Расходники' },
]

const BADGE_WEIGHT: Record<Badge, number> = { hit: 3, new: 2, limited: 1 }

/** Витрина: фильтры по категории и обжарке, сортировка и добавление в корзину */
export class CatalogStore {
  private readonly cart: CartStore

  search = ''
  category: CategoryFilter = 'all'
  /** Обжарка есть только у кофе, поэтому фильтр работает в паре с категорией */
  roast: Roast | 'all' = 'all'
  decafOnly = false
  sort: SortKey = 'popular'
  /** Объём кофе и помол, выбранные в карточках витрины */
  coffeeSize = '250'
  grind: Grind = 'beans'
  /** id товара, который только что добавили — для вспышки «добавлено» */
  lastAddedId: string | null = null

  constructor(cart: CartStore) {
    this.cart = cart
    makeAutoObservable<CatalogStore, 'cart'>(this, { cart: false }, { autoBind: true })
  }

  get visible(): Product[] {
    const query = this.search.trim().toLowerCase()

    const filtered = PRODUCTS.filter((product) => {
      if (this.category !== 'all' && product.category !== this.category) return false
      if (this.roast !== 'all' && product.roast !== this.roast) return false
      if (this.decafOnly && !product.decaf) return false
      if (!query) return true

      const haystack = [
        product.name,
        product.subtitle,
        product.kind,
        product.description,
        ...(product.notes ?? []),
        ...(product.specs ?? []),
        ...(product.compatibleWith ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })

    return [...filtered].sort((a, b) => {
      switch (this.sort) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
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
      this.category !== 'all' ||
      this.roast !== 'all' ||
      this.decafOnly ||
      this.sort !== 'popular'
    )
  }

  get categorySummary(): string {
    return this.category === 'all' ? 'все категории' : CATEGORY_LABELS[this.category].toLowerCase()
  }

  get roastSummary(): string {
    if (this.roast === 'all') return 'любая обжарка'
    return ROAST_LABELS[this.roast]
  }

  /** Обжарка и декоф имеют смысл только для кофе */
  get coffeeFiltersAvailable(): boolean {
    return this.category === 'all' || this.category === 'coffee'
  }

  setSearch(value: string): void {
    this.search = value
  }

  setCategory(value: CategoryFilter): void {
    this.category = value
    if (value !== 'all' && value !== 'coffee') {
      this.roast = 'all'
      this.decafOnly = false
    }
  }

  setRoast(value: Roast | 'all'): void {
    this.roast = value
  }

  toggleDecaf(): void {
    this.decafOnly = !this.decafOnly
  }

  setSort(value: SortKey): void {
    this.sort = value
  }

  setCoffeeSize(value: string): void {
    this.coffeeSize = value
  }

  setGrind(value: Grind): void {
    this.grind = value
  }

  /** Помол передаём только для кофе — в корзине у техники его нет */
  addToCart(product: Product): void {
    if (product.category === 'coffee') {
      this.cart.add(product.id, this.coffeeSize, this.grind)
    } else {
      this.cart.add(product.id, '1')
    }
    this.lastAddedId = product.id
  }

  resetFilters(): void {
    this.search = ''
    this.category = 'all'
    this.roast = 'all'
    this.decafOnly = false
    this.sort = 'popular'
  }
}
