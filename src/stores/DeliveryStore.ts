import { makeAutoObservable } from 'mobx'
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../data/contacts'

/**
 * Стор раздела доставки: телефон мастерской.
 *
 * Способы доставки и вопросы с ответами теперь редактируемые — они лежат
 * в `data/lists.ts` и правятся админом прямо на странице, поэтому здесь
 * их больше нет: дублировать данные нельзя, правка не дошла бы до страницы.
 *
 * Заказ оформляем по телефону или заявкой — корзины и калькулятора на сайте
 * нет, поэтому расчётных полей тут тоже не осталось.
 */
export class DeliveryStore {
  readonly phone = CONTACT_PHONE
  readonly phoneHref = CONTACT_PHONE_HREF

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }
}
