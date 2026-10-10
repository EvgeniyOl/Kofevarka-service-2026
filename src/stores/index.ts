import { CoffeeStore } from './CoffeeStore'

/**
 * Корневой стор приложения.
 * Когда появятся другие разделы — просто добавьте их сюда.
 */
export class RootStore {
  readonly coffee: CoffeeStore

  constructor() {
    this.coffee = new CoffeeStore()
  }
}

export const rootStore = new RootStore()
