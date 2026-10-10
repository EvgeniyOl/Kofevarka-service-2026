import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { StoreProvider } from './stores/StoreProvider'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Не найден элемент #root в index.html')
}

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
