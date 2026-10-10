import type { ReactNode } from 'react'
import { rootStore, type RootStore } from './index'
import { StoreContext } from './context'

interface StoreProviderProps {
  /** Свой набор сторов — удобно подставлять в тестах */
  store?: RootStore
  children: ReactNode
}

/**
 * Провайдер сторов.
 * Файл экспортирует только компонент — так Fast Refresh обновляет его
 * без полной перезагрузки страницы.
 */
export function StoreProvider({ store = rootStore, children }: StoreProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
