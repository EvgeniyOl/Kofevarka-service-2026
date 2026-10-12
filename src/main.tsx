import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './app/router'
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
 * Тексты блоков, карточки направлений и партнёров грузим заранее: страницы
 * читают их синхронно, иначе при первом кадре мелькали бы пустые места.
 */
void rootStore.content.load()
void rootStore.directions.load()
void rootStore.partners.load()

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  </StrictMode>,
)
