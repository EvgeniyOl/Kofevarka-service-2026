import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Адрес сайта на GitHub Pages — https://evgeniyol.github.io/Kofevarka-service-2026/,
 * то есть сайт лежит не в корне домена. Поэтому base задаём с именем репозитория:
 * иначе пути к файлам в index.html будут вести в никуда.
 *
 * Значение действует для сборки и для проверки собранного сайта (npm run preview):
 * обе команды должны отдавать файлы по одному и тому же адресу. Дев-серверу
 * (npm run dev) base не нужен — там сайт живёт в корне localhost:5000.
 *
 * Если появится свой домен или сайт переедет в корень — поменяйте значение здесь.
 */
const BASE = '/Kofevarka-service-2026/'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : BASE,
  plugins: [react()],
  server: {
    port: 5000,
    open: false,
  },
}))
