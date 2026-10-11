import { AboutStore } from './AboutStore'
import { CatalogStore } from './CatalogStore'
import { ContactsStore } from './ContactsStore'
import { DeliveryStore } from './DeliveryStore'
import { HomeStore } from './HomeStore'
import { RepairStore } from './RepairStore'
import { SubscriptionStore } from './SubscriptionStore'

/**
 * Корневой стор приложения: у каждого раздела свой стор.
 * Корзины нет — сайт информационный, заказы принимаем по телефону и заявкой.
 */
export class RootStore {
  readonly home: HomeStore
  readonly repair: RepairStore
  readonly catalog: CatalogStore
  readonly subscription: SubscriptionStore
  readonly about: AboutStore
  readonly delivery: DeliveryStore
  readonly contacts: ContactsStore

  constructor() {
    this.home = new HomeStore()
    this.repair = new RepairStore()
    this.catalog = new CatalogStore()
    this.subscription = new SubscriptionStore()
    this.about = new AboutStore()
    this.delivery = new DeliveryStore()
    this.contacts = new ContactsStore()
  }
}

export const rootStore = new RootStore()
