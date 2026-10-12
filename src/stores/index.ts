import { AuthStore } from './AuthStore'
import { ContactsStore } from './ContactsStore'
import { ContentStore } from './ContentStore'
import { DeliveryStore } from './DeliveryStore'
import { DirectionsStore } from './DirectionsStore'
import { ItemsStore } from './ItemsStore'
import { PartnersStore } from './PartnersStore'

/**
 * Корневой стор приложения: у каждого раздела свой стор.
 * Корзины и витрины нет — сайт информационный, заказы принимаем
 * по телефону и заявкой.
 *
 * Данные страниц «Ремонт», «О нас» и «Доставка» живут не в сторах, а
 * в редактируемых списках и блоках: их правит админ прямо на странице.
 * Сторы этих разделов поэтому не нужны — состояние интерфейса держат они сами.
 */
export class RootStore {
  readonly delivery: DeliveryStore
  readonly contacts: ContactsStore
  readonly auth: AuthStore
  /** Тексты блоков, которые правит админ */
  readonly content: ContentStore
  /** Карточки направлений ремонта: их можно добавлять и удалять */
  readonly directions: DirectionsStore
  /** Партнёры: логотипы и подписи на странице «О нас» */
  readonly partners: PartnersStore
  /** Списки сайта: цифры, шаги, цены, вопросы, отзывы, принципы, команда */
  readonly items: ItemsStore

  constructor() {
    this.delivery = new DeliveryStore()
    this.contacts = new ContactsStore()
    this.auth = new AuthStore()
    this.content = new ContentStore()
    this.directions = new DirectionsStore()
    this.partners = new PartnersStore()
    this.items = new ItemsStore()
  }
}

export const rootStore = new RootStore()
