/**
 * Локальная разработка API: подключает функции из папки `api/` к dev-серверу Vite.
 *
 * В продакшене эти файлы выполняет Vercel как отдельные функции, поэтому
 * локально их нужно смонтировать руками — иначе фронтенд при разработке
 * не смог бы обратиться к /api/auth/login и остальным ручкам.
 * Обработчики пишутся под обычные Node-объекты запроса и ответа, поэтому
 * один и тот же код работает и здесь, и на Vercel.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import type { Connect, Plugin, ViteDevServer } from 'vite'

/** Что подставить, если запрос пришёл на саму папку */
const INDEX_FILES = ['index.ts', 'index.js', 'index.mjs']

/**
 * Приводит адрес запроса к чистому виду. Без этого «/api/../package.json»
 * формально начинается с /api/, а «/api/../../secret» после склейки путей
 * выглядел бы как допустимый путь внутри проекта.
 */
const normalizePathname = (rawUrl: string): string | null => {
  try {
    const decoded = decodeURIComponent(rawUrl.split('?')[0])
    return new URL(decoded, 'http://localhost').pathname
  } catch {
    // Битая процентная последовательность в адресе — считаем адрес неверным
    return null
  }
}

/**
 * Находит файл ручки. Путь из запроса может содержать «../», поэтому
 * результат обязательно проверяем: он должен остаться внутри папки api.
 *
 * Динамические сегменты ищем так же, как это делает Vercel: запрос
 * «/api/me/repairs/42» обслуживает файл «api/me/repairs/[id].ts». Без этого
 * ручки с параметром пути работали бы только в продакшене.
 */
const resolveHandler = (apiDir: string, pathname: string): string | null => {
  const relative = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '')
  const base = resolve(apiDir, relative)

  if (base !== apiDir && !base.startsWith(apiDir + sep)) return null

  for (const candidate of [`${base}.ts`, `${base}.js`, `${base}.mjs`]) {
    if (existsSync(candidate)) return candidate
  }

  for (const indexFile of INDEX_FILES) {
    const candidate = join(base, indexFile)
    if (existsSync(candidate)) return candidate
  }

  // Последний сегмент пути может быть параметром: api/me/repairs/[id].ts
  const parent = resolve(base, '..')
  if (parent === apiDir || parent.startsWith(apiDir + sep)) {
    const dynamic = readdirSync(parent).find(
      (entry) => entry.startsWith('[') && entry.endsWith('].ts'),
    )
    if (dynamic) return join(parent, dynamic)
  }

  return null
}

const sendJson = (
  res: Parameters<Connect.NextHandleFunction>[1],
  status: number,
  payload: unknown,
) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export function apiDevPlugin(): Plugin {
  const apiDir = resolve(process.cwd(), 'api')

  return {
    name: 'kofevarka-api-dev',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      const middleware: Connect.NextHandleFunction = (req, res, next) => {
        const pathname = normalizePathname(req.url ?? '')

        // Адрес проверяем уже нормализованным: «/api/../package.json» сюда не пройдёт
        if (!pathname || !pathname.startsWith('/api/')) {
          next()
          return
        }

        const file = resolveHandler(apiDir, pathname)

        if (!file) {
          sendJson(res, 404, { error: `Ручка ${pathname} не найдена` })
          return
        }

        // ssrLoadModule прогоняет файл через Vite: TypeScript и импорты работают
        server.ssrLoadModule(file).then(
          (module: { default?: unknown }) => {
            const handler = module.default
            if (typeof handler !== 'function') {
              sendJson(res, 500, { error: 'Обработчик не экспортирует функцию по умолчанию' })
              return
            }

            Promise.resolve((handler as (a: unknown, b: unknown) => unknown)(req, res)).catch(
              (error: unknown) => {
                const message = error instanceof Error ? error.message : 'Ошибка обработчика'
                console.error('[api-dev]', message)
                if (!res.headersSent) sendJson(res, 500, { error: message })
              },
            )
          },
          (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Не удалось загрузить ручку'
            console.error('[api-dev]', message)
            sendJson(res, 500, { error: message })
          },
        )
      }

      // Ставим middleware в начало, чтобы /api не перехватил SPA-фолбэк Vite
      server.middlewares.use(middleware)
      server.config.logger.info('  API доступно локально: /api/* → папка api/')
    },
  }
}
