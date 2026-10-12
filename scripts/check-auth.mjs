/**
 * Сквозная проверка авторизации: регистрация, вход, роли, права и заявки.
 * Требует запущенного `npm run dev` с подключённой базой.
 *
 * Запуск: npm run check:auth   (или node scripts/check-auth.mjs [адрес])
 *
 * Проверка «первый пользователь становится админом» работает только на пустой
 * таблице пользователей, поэтому скрипт предупреждает, если база не пуста,
 * и в конце удаляет созданные им записи — накопленного мусора не остаётся.
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const BASE = process.argv[2] ?? 'http://localhost:5000'

/** Строка подключения: из окружения или из .env.local */
const connectionString = (() => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    return readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((line) => line.startsWith('DATABASE_URL='))
      ?.slice('DATABASE_URL='.length)
      .trim()
  } catch {
    return undefined
  }
})()

let failed = 0
const results = []
/** Почты, созданные этим прогоном: их удалим в конце */
const createdEmails = []

const check = (name, ok, detail = '') => {
  if (!ok) failed += 1
  results.push(`${ok ? 'ок  ' : 'ОШИБКА'} ${name}${detail ? ` — ${detail}` : ''}`)
}

/** Запрос с cookie: сессия лежит в httpOnly-cookie, её нужно носить с собой */
const call = async (path, { method = 'GET', body, cookie } = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const setCookie = response.headers.getSetCookie?.() ?? []
  // Сырые заголовки нужны, чтобы проверить атрибуты (например, Max-Age=0)
  const rawCookie = setCookie.join(' | ')
  // Берём только пару «имя=значение», без атрибутов
  const cookieValue = setCookie.map((item) => item.split(';')[0]).join('; ')

  // Разбор ответа: сервер всегда отвечает JSON, но на всякий случай
  // не падаем, если пришёл не он
  let payload
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { raw: text }
  }

  return { status: response.status, payload, cookie: cookieValue, rawCookie }
}

// Уникальная почта, чтобы тест можно было запускать повторно
const stamp = Date.now()
const adminEmail = `admin-${stamp}@example.com`
const clientEmail = `client-${stamp}@example.com`
const thirdEmail = `third-${stamp}@example.com`
const password = 'kofevarka-2026'

/*
 * Предупреждаем, если база не пуста: проверка «первый становится админом»
 * имеет смысл только на пустой таблице. Пользователей не удаляем — в базе
 * могут быть настоящие аккаунты.
 */
let usersBefore = null
if (connectionString) {
  const probe = new pg.Client({ connectionString })
  try {
    await probe.connect()
    const count = await probe.query('SELECT count(*)::int AS total FROM users')
    usersBefore = count.rows[0].total
  } catch {
    usersBefore = null
  } finally {
    await probe.end().catch(() => {})
  }
}

if (usersBefore) {
  console.log(
    `ВНИМАНИЕ: в базе уже ${usersBefore} пользовател(ь/я/ей), поэтому первый зарегистрированный\n` +
      'получит роль клиента, а не администратора — часть проверок ниже упадёт.\n' +
      'Для полного прогона очистите данные: npm run db:wipe\n',
  )
}

// — 1. Регистрация первого пользователя: он должен стать админом —
const first = await call('/api/auth/register', {
  method: 'POST',
  body: { name: 'Владелец', email: adminEmail, password },
})
createdEmails.push(adminEmail)
check(
  'первый пользователь зарегистрирован и стал админом',
  first.status === 201 && first.payload?.user?.role === 'admin',
  `HTTP ${first.status}, роль: ${first.payload?.user?.role}`,
)
const adminCookie = first.cookie
check('регистрация выдала cookie сессии', adminCookie.includes('kofevarka_session='))

// — 2. Второй пользователь: роль клиент —
const second = await call('/api/auth/register', {
  method: 'POST',
  body: { name: 'Клиент', email: clientEmail, password },
})
createdEmails.push(clientEmail)
check(
  'второй пользователь получил роль клиента',
  second.status === 201 && second.payload?.user?.role === 'client',
  `роль: ${second.payload?.user?.role}`,
)
const clientCookie = second.cookie

// — 3. Повторная регистрация той же почты —
const duplicate = await call('/api/auth/register', {
  method: 'POST',
  body: { name: 'Дубль', email: adminEmail, password },
})
check('повторная почта отвергается', duplicate.status === 409, `HTTP ${duplicate.status}`)

// — 4. Сессия работает —
const me = await call('/api/auth/me', { cookie: adminCookie })
check(
  'сессия узнаёт админа',
  me.status === 200 && me.payload?.user?.email === adminEmail,
  `почта: ${me.payload?.user?.email}`,
)
check('хеш пароля наружу не отдаётся', !JSON.stringify(me.payload).includes('scrypt$'))

// — 5. Вход с неверным паролем —
const wrong = await call('/api/auth/login', {
  method: 'POST',
  body: { email: adminEmail, password: 'неверный-пароль-123' },
})
check('неверный пароль отвергается', wrong.status === 401, `HTTP ${wrong.status}`)

// — 6. Вход с верным паролем —
const login = await call('/api/auth/login', {
  method: 'POST',
  body: { email: adminEmail, password },
})
check('верный пароль пускает', login.status === 200 && login.payload?.user?.role === 'admin')

// — 7. Права: клиент не видит заявки и пользователей —
const clientRequests = await call('/api/requests', { cookie: clientCookie })
check(
  'клиенту закрыт список заявок',
  clientRequests.status === 403,
  `HTTP ${clientRequests.status}`,
)
const clientUsers = await call('/api/users', { cookie: clientCookie })
check(
  'клиенту закрыт список пользователей',
  clientUsers.status === 403,
  `HTTP ${clientUsers.status}`,
)

// — 8. Админ видит списки —
const adminUsers = await call('/api/users', { cookie: adminCookie })
check(
  'админ видит пользователей',
  adminUsers.status === 200 && Array.isArray(adminUsers.payload?.users),
  `их: ${adminUsers.payload?.users?.length}`,
)
const adminRequests = await call('/api/requests', { cookie: adminCookie })
check('админ видит заявки', adminRequests.status === 200)

// — 9. Заявка с формы: доступна и гостю, и вошедшему —
const guestRequest = await call('/api/requests', {
  method: 'POST',
  body: { name: 'Гость', email: 'guest@example.com', message: 'Заявка от гостя' },
})
check('гость может оставить заявку', guestRequest.status === 201, `HTTP ${guestRequest.status}`)

const userRequest = await call('/api/requests', {
  method: 'POST',
  body: { name: 'Клиент', email: clientEmail, message: 'Заявка от вошедшего' },
  cookie: clientCookie,
})
check('вошедший может оставить заявку', userRequest.status === 201)

const afterRequests = await call('/api/requests', { cookie: adminCookie })
const messages = (afterRequests.payload?.requests ?? []).map((item) => item.message)
check(
  'заявки видны админу',
  messages.includes('Заявка от гостя') && messages.includes('Заявка от вошедшего'),
)

// — 10. Смена роли админом —
const clientId = second.payload?.user?.id
const promote = await call('/api/users', {
  method: 'PATCH',
  body: { id: clientId, role: 'admin' },
  cookie: adminCookie,
})
check(
  'админ может выдать роль администратора',
  promote.status === 200 && promote.payload?.user?.role === 'admin',
  `HTTP ${promote.status}`,
)

// — 11. Себе роль снять нельзя —
const demoteSelf = await call('/api/users', {
  method: 'PATCH',
  body: { id: first.payload?.user?.id, role: 'client' },
  cookie: adminCookie,
})
check('нельзя снять роль с себя', demoteSelf.status === 400, `HTTP ${demoteSelf.status}`)

// — 12. Клиент не может менять роли —
// Проверяем на третьем пользователе: второго мы только что повысили,
// поэтому его cookie теперь соответствует администратору
const third = await call('/api/auth/register', {
  method: 'POST',
  body: { name: 'Третий', email: thirdEmail, password },
})
createdEmails.push(thirdEmail)
const clientPatch = await call('/api/users', {
  method: 'PATCH',
  body: { id: third.payload?.user?.id, role: 'admin' },
  cookie: third.cookie,
})
check('клиент не может менять роли', clientPatch.status === 403, `HTTP ${clientPatch.status}`)

// — 13. Выход стирает сессию —
const logout = await call('/api/auth/logout', { method: 'POST', cookie: adminCookie })
check('выход отвечает успехом', logout.status === 200)
check(
  'выход стирает cookie',
  logout.rawCookie.includes('Max-Age=0') && logout.rawCookie.includes('HttpOnly'),
  logout.rawCookie.slice(0, 70),
)

// — 14. Поддельная cookie не даёт доступа —
// В заголовке cookie допустимы только ASCII-символы, поэтому подпись «поддельная»
const forged = await call('/api/users', { cookie: 'kofevarka_session=ZmFrZQ.forged' })
check('поддельная сессия не даёт доступ', forged.status === 401, `HTTP ${forged.status}`)

/*
 * Убираем за собой: удаляем только те аккаунты и заявки, которые создал
 * этот прогон. Настоящие данные в базе не трогаем.
 */
let cleaned = 0
if (connectionString) {
  const client = new pg.Client({ connectionString })
  try {
    await client.connect()

    // Сначала смотрим, что вообще нашлось: если удаление не сработает,
    // будет видно, в чём причина
    const found = await client.query('SELECT id, email FROM users WHERE email = ANY($1)', [
      createdEmails,
    ])
    const requestsFound = await client.query(
      'SELECT id, email FROM site_requests WHERE email = ANY($1)',
      [['guest@example.com', clientEmail]],
    )

    const users = await client.query('DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id', [
      found.rows.map((row) => row.id),
    ])
    const requests = await client.query(
      'DELETE FROM site_requests WHERE id = ANY($1::int[]) RETURNING id',
      [requestsFound.rows.map((row) => row.id)],
    )

    cleaned = users.rowCount + requests.rowCount

    if (found.rowCount !== users.rowCount || requestsFound.rowCount !== requests.rowCount) {
      console.log(
        `\nВНИМАНИЕ: нашлось ${found.rowCount} пользователей и ${requestsFound.rowCount} заявок, ` +
          `а удалилось ${users.rowCount} и ${requests.rowCount}. Проверьте базу вручную.`,
      )
    }
  } catch (error) {
    console.log(`\nНе удалось убрать тестовые данные: ${error.message}`)
  } finally {
    await client.end().catch(() => {})
  }
}

console.log(results.join('\n'))
if (cleaned) console.log(`\nудалено тестовых записей: ${cleaned}`)
if (usersBefore) {
  console.log('напоминание: база была не пуста, часть проверок ожидаемо упала')
}
console.log(failed ? `\nпровалено проверок: ${failed}` : '\nвсе проверки пройдены')
process.exit(failed ? 1 : 0)
