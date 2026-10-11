/**
 * Проверка API в режиме разработки: валидация, права доступа и понятность
 * ошибок. База при этом не нужна — проверяем то, что отвечает до её запроса.
 *
 * Запуск: node check-api.mjs [адрес]
 * Адрес по умолчанию — локальный dev-сервер Vite.
 */
const BASE = process.argv[2] ?? 'http://localhost:5000'

const cases = [
  {
    name: 'короткий пароль',
    path: '/api/auth/register',
    body: { name: 'Тест', email: 'test@example.com', password: '123' },
    expect: 400,
  },
  {
    name: 'почта без собаки',
    path: '/api/auth/register',
    body: { name: 'Тест', email: 'не-почта', password: 'kofevarka-2026' },
    expect: 400,
  },
  {
    name: 'пустое имя',
    path: '/api/auth/register',
    body: { name: '   ', email: 'test@example.com', password: 'kofevarka-2026' },
    expect: 400,
  },
  {
    name: 'слишком длинное сообщение',
    path: '/api/requests',
    body: { name: 'Тест', email: 'a@b.ru', message: 'x'.repeat(2500) },
    expect: 400,
  },
  {
    name: 'вход без пароля',
    path: '/api/auth/login',
    body: { email: 'test@example.com' },
    expect: 400,
  },
  {
    name: 'битый JSON',
    path: '/api/auth/login',
    raw: '{это не json',
    expect: 400,
  },
  {
    name: 'вход с несуществующей почтой',
    path: '/api/auth/login',
    body: { email: 'никого@example.com', password: 'kofevarka-2026' },
    // Базы нет, поэтому ждём 500 с текстом про DATABASE_URL;
    // с базой здесь был бы 401
    expect: [401, 500],
  },
]

let failed = 0

for (const item of cases) {
  const response = await fetch(`${BASE}${item.path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: item.raw ?? JSON.stringify(item.body),
  })

  const text = await response.text()
  const expected = Array.isArray(item.expect) ? item.expect : [item.expect]
  const ok = expected.includes(response.status)

  if (!ok) failed += 1
  console.log(
    `${ok ? 'ок  ' : 'ОШИБКА'} ${item.name}: HTTP ${response.status} — ${text.slice(0, 110)}`,
  )
}

// Без входа список заявок и пользователей отдавать нельзя
for (const path of ['/api/requests', '/api/users']) {
  const response = await fetch(`${BASE}${path}`)
  const ok = response.status === 401
  if (!ok) failed += 1
  console.log(`${ok ? 'ок  ' : 'ОШИБКА'} ${path} без входа: HTTP ${response.status}`)
}

// Несуществующая ручка
{
  const response = await fetch(`${BASE}/api/такой-нет`)
  const ok = response.status === 404
  if (!ok) failed += 1
  console.log(`${ok ? 'ок  ' : 'ОШИБКА'} несуществующая ручка: HTTP ${response.status}`)
}

// Выход без сессии не должен падать
{
  const response = await fetch(`${BASE}/api/auth/logout`, { method: 'POST' })
  const ok = response.ok
  if (!ok) failed += 1
  console.log(`${ok ? 'ок  ' : 'ОШИБКА'} выход без сессии: HTTP ${response.status}`)
}

// Кто вошёл: без cookie должно быть null, а не ошибка
{
  const response = await fetch(`${BASE}/api/auth/me`)
  const payload = await response.json()
  const ok = response.ok && payload.user === null
  if (!ok) failed += 1
  console.log(`${ok ? 'ок  ' : 'ОШИБКА'} сессии нет → user: ${JSON.stringify(payload.user)}`)
}

/*
 * Обход папки api. Здесь важно понимать разделение ответственности:
 *
 * - middleware API не должен сам отдавать файлы вне папки api. Обычный
 *   «/api/../package.json» до сервера даже не доходит — его нормализует клиент.
 *   Поэтому проверяем процентное кодирование: «%2e%2e» доезжает как есть
 *   и раскрывается уже на сервере.
 * - дальше такой запрос уходит в dev-сервер Vite, который отдаёт файлы проекта
 *   в режиме разработки — это его штатное поведение, а не утечка. Секреты Vite
 *   закрывает сам (403 на .env), и в продакшене на Vercel статика ограничена
 *   папкой dist, где никаких .env нет.
 *
 * Значит проверяем главное: секреты наружу не уходят.
 */
for (const attempt of ['/api/%2e%2e/.env', '/api/%2e%2e/.env.local']) {
  const response = await fetch(`${BASE}${attempt}`)
  const text = await response.text()
  const leaked = /SESSION_SECRET|DATABASE_URL\s*=/.test(text)
  const ok = !leaked
  if (!ok) failed += 1
  console.log(
    `${ok ? 'ок  ' : 'ОШИБКА'} секреты через ${attempt}: HTTP ${response.status}, утечка: ${leaked}`,
  )
}

// Необработанный обход не должен превращаться в 500 от нашего кода
{
  const response = await fetch(`${BASE}/api/%2e%2e/package.json`)
  const ok = response.status !== 500
  if (!ok) failed += 1
  console.log(`${ok ? 'ок  ' : 'ОШИБКА'} обход не ломает сервер: HTTP ${response.status}`)
}

console.log(failed ? `\nпровалено проверок: ${failed}` : '\nвсе проверки пройдены')
process.exit(failed ? 1 : 0)
