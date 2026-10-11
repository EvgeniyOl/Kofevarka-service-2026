import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Базовый путь зависит от того, куда выкладываем сайт:
 *
 * - Vercel и локальная проверка — сайт в корне домена, base не нужен;
 * - GitHub Pages — сайт лежит в подпапке с именем репозитория
 *   (evgeniyol.github.io/Kofevarka-service-2026/), поэтому base обязателен,
 *   иначе пути к файлам в index.html ведут в никуда.
 *
 * Платформу определяем по переменной VERCEL, которую выставляет сам Vercel
 * при сборке. Дев-серверу (npm run dev) base тоже не нужен.
 */
const GITHUB_PAGES_BASE = '/Kofevarka-service-2026/'

/** Переменные окружения без типов Node: читаем через globalThis */
const isVercel = Boolean(
  (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.VERCEL,
)

export default defineConfig(({ command }) => ({
  base: command === 'serve' || isVercel ? '/' : GITHUB_PAGES_BASE,
  plugins: [react()],
  server: {
    port: 5000,
    open: false,
  },
}))
