/**
 * Проверка сессии: мобильное приложение ходит с заголовком Authorization,
 * сайт — с cookie. Обе схемы должны давать одного и того же пользователя.
 *
 * Запуск (из корня проекта Kofevarka-service-2026):
 *   node --experimental-strip-types --no-warnings scripts/check-session.ts
 *
 * База данных не нужна: проверяется только разбор и подпись токена.
 */
import type { IncomingMessage } from 'node:http'
import { createSessionToken, readBearerToken, sessionUserId } from '../api/_lib/session.ts'

process.env.SESSION_SECRET ??= 'test-secret-for-local-check-only'

/** Минимальный запрос: из него читаются только нужные заголовки */
const fakeRequest = (headers: Record<string, string>): IncomingMessage =>
  ({ headers }) as unknown as IncomingMessage

let failed = 0

const check = (name: string, actual: unknown, expected: unknown): void => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed += 1
  console.log(
    `${ok ? 'OK  ' : 'ПРОВАЛ'} ${name}${ok ? '' : ` — ждали ${JSON.stringify(expected)}, получили ${JSON.stringify(actual)}`}`,
  )
}

const token = createSessionToken(42)

check(
  'Bearer-токен читается из заголовка',
  readBearerToken(fakeRequest({ authorization: `Bearer ${token}` })),
  token,
)
check(
  'Схема в нижнем регистре тоже работает',
  readBearerToken(fakeRequest({ authorization: `bearer ${token}` })),
  token,
)
check('Без заголовка токена нет', readBearerToken(fakeRequest({})), undefined)
check(
  'Другая схема не принимается',
  readBearerToken(fakeRequest({ authorization: `Basic ${token}` })),
  undefined,
)
check(
  'Пустой Bearer не принимается',
  readBearerToken(fakeRequest({ authorization: 'Bearer ' })),
  undefined,
)

check(
  'Мобильный клиент: пользователь из заголовка',
  sessionUserId(fakeRequest({ authorization: `Bearer ${token}` })),
  42,
)
check(
  'Веб-клиент: пользователь из cookie',
  sessionUserId(fakeRequest({ cookie: `kofevarka_session=${token}` })),
  42,
)
check(
  'Заголовок важнее cookie: чужую cookie не подхватываем',
  sessionUserId(
    fakeRequest({
      authorization: `Bearer ${createSessionToken(7)}`,
      cookie: `kofevarka_session=${token}`,
    }),
  ),
  7,
)
check(
  'Битый токен не проходит',
  sessionUserId(fakeRequest({ authorization: 'Bearer 123.456' })),
  null,
)
check(
  'Подпись от другого секрета не проходит',
  sessionUserId(fakeRequest({ authorization: `Bearer ${token}x` })),
  null,
)

console.log(failed === 0 ? '\nВсе проверки пройдены' : `\nПровалено проверок: ${failed}`)
process.exit(failed === 0 ? 0 : 1)
