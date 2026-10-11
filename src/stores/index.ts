import { AboutStore } from './AboutStore'
import { AuthStore } from './AuthStore'
import { ContactsStore } from './ContactsStore'
import { DeliveryStore } from './DeliveryStore'
import { HomeStore } from './HomeStore'
import { RepairStore } from './RepairStore'
import { SubscriptionStore } from './SubscriptionStore'

/**
 * Корневой стор приложения: у каждого раздела свой стор.
 * Корзины и витрины нет — сайт информационный, заказы принимаем
 * по телефону и заявкой.
 */
export class RootStore {
  readonly home: HomeStore
  readonly repair: RepairStore
  readonly subscription: SubscriptionStore
  readonly about: AboutStore
  readonly delivery: DeliveryStore
  readonly contacts: ContactsStore
  readonly auth: AuthStore

  constructor() {
    this.home = new HomeStore()
    this.repair = new RepairStore()
    this.subscription = new SubscriptionStore()
    this.about = new AboutStore()
    this.delivery = new DeliveryStore()
    this.contacts = new ContactsStore()
    this.auth = new AuthStore()
  }
}

export const rootStore = new RootStore()
