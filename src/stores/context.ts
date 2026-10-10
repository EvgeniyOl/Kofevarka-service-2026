import { createContext, useContext } from 'react'
import { rootStore, type RootStore } from './index'

/**
 * Контекст сторов. Живёт отдельно от компонента-провайдера:
 * файл без компонентов не ломает Fast Refresh.
 */
export const StoreContext = createContext<RootStore>(rootStore)

/**
 * Хук доступа к сторам: const { coffee } = useStore()
 */
export function useStore(): RootStore {
  return useContext(StoreContext)
}
