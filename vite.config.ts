import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { apiDevPlugin } from './api-dev-plugin'

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

export default defineConfig(({ command, mode }) => {
  const isVercel = Boolean(process.env.VERCEL)

  /*
   * Секреты базы нужны функциям API, которые в разработке выполняются внутри
   * dev-сервера, — поэтому переносим их из .env.local в process.env.
   * Префикс VITE_ намеренно не используем: такие переменные Vite встраивает
   * в клиентский бандл, а строка подключения к базе не должна попадать в браузер.
   */
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['DATABASE_URL', 'SESSION_SECRET']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    base: command === 'serve' || isVercel ? '/' : GITHUB_PAGES_BASE,
    plugins: [
      react(),
      /*
       * Функции из папки api/ на Vercel выполняет сама платформа, а в разработке
       * их подключает этот плагин — иначе фронтенд локально не смог бы войти
       * и оставить заявку. См. api-dev-plugin.ts
       */
      apiDevPlugin(),
    ],
    server: {
      port: 5000,
      open: false,
    },
  }
})
