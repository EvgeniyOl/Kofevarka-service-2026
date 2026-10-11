import { AboutStore } from './AboutStore'
import { CartStore } from './CartStore'
import { CatalogStore } from './CatalogStore'
import { ContactsStore } from './ContactsStore'
import { DeliveryStore } from './DeliveryStore'
import { HomeStore } from './HomeStore'
import { RepairStore } from './RepairStore'
import { SubscriptionStore } from './SubscriptionStore'

/**
 * Корневой стор приложения: у каждого раздела свой стор,
 * а корзина — общая, её читает и шапка, и страница заказа.
 */
export class RootStore {
  readonly cart: CartStore
  readonly home: HomeStore
  readonly repair: RepairStore
  readonly catalog: CatalogStore
  readonly subscription: SubscriptionStore
  readonly about: AboutStore
  readonly delivery: DeliveryStore
  readonly contacts: ContactsStore

  constructor() {
    this.cart = new CartStore()
    this.home = new HomeStore(this.cart)
    this.repair = new RepairStore()
    this.catalog = new CatalogStore(this.cart)
    this.subscription = new SubscriptionStore(this.cart)
    this.about = new AboutStore()
    this.delivery = new DeliveryStore()
    this.contacts = new ContactsStore()
  }
}

export const rootStore = new RootStore()
