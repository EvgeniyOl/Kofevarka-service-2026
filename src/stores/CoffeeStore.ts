import { makeAutoObservable } from 'mobx'

/**
 * Стор продажи кофейка.
 *
 * Здесь живёт всё состояние страницы продаж: витрина, корзина, итоговая сумма.
 * Компоненты читают это состояние через observer() и не хранят его у себя.
 */
export class CoffeeStore {
  /** Заголовок страницы */
  title = 'Продажа кофейка'

  constructor() {
    // makeAutoObservable сам помечает поля как observable,
    // геттеры — как computed, методы — как action.
    makeAutoObservable(this)
  }
}
