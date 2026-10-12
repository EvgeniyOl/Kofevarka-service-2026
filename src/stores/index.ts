import { AboutStore } from './AboutStore'
import { AuthStore } from './AuthStore'
import { ContactsStore } from './ContactsStore'
import { ContentStore } from './ContentStore'
import { DeliveryStore } from './DeliveryStore'
import { DirectionsStore } from './DirectionsStore'
import { HomeStore } from './HomeStore'
import { PartnersStore } from './PartnersStore'
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
  /** Тексты блоков, которые правит админ */
  readonly content: ContentStore
  /** Карточки направлений ремонта: их можно добавлять и удалять */
  readonly directions: DirectionsStore
  /** Партнёры: логотипы и подписи на странице «О нас» */
  readonly partners: PartnersStore

  constructor() {
    this.home = new HomeStore()
    this.repair = new RepairStore()
    this.subscription = new SubscriptionStore()
    this.about = new AboutStore()
    this.delivery = new DeliveryStore()
    this.contacts = new ContactsStore()
    this.auth = new AuthStore()
    this.content = new ContentStore()
    this.directions = new DirectionsStore()
    this.partners = new PartnersStore()
  }
}

export const rootStore = new RootStore()
