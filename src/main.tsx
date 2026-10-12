import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './app/router'
import { LIST_DEFAULTS } from './data/lists'
import { StoreProvider } from './stores/StoreProvider'
import { rootStore } from './stores'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Не найден элемент #root в index.html')
}

/*
 * Спрашиваем сервер, кто вошёл, до отрисовки. Сессия лежит в httpOnly-cookie,
 * поэтому из браузера её не видно — без этого запроса админ при обновлении
 * страницы на секунду видел бы форму входа.
 */
void rootStore.auth.load()

/*
 * Тексты блоков, карточки направлений, партнёров и списки грузим заранее:
 * страницы читают их синхронно, иначе при первом кадре мелькали бы пустые
 * места. Списки, которых нет в базе, наполняются значениями из кода —
 * это делает админ, у остальных они просто показываются.
 */
void rootStore.content.load()
void rootStore.directions.load()
void rootStore.partners.load()
void rootStore.items.load(LIST_DEFAULTS)

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  </StrictMode>,
)
