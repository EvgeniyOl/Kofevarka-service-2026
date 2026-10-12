/**
 * Очистка тестовых данных, оставшихся после прогона проверок.
 * Запуск: node reset-db.mjs
 *
 * Нужна после check-auth.mjs: он создаёт пользователей с почтой вида
 * admin-<время>@example.com и пару заявок. Если их не убрать, первый
 * зарегистрированный человек получит роль клиента, а не администратора.
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const fromEnvFile = () => {
  try {
    const line = readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((item) => item.startsWith('DATABASE_URL='))
    return line?.slice('DATABASE_URL='.length).trim()
  } catch {
    return undefined
  }
}

const connectionString = process.argv[2] ?? process.env.DATABASE_URL ?? fromEnvFile()

if (!connectionString) {
  console.error('Не нашёл строку подключения: передайте аргументом или задайте DATABASE_URL')
  process.exit(1)
}

const client = new pg.Client({ connectionString })
await client.connect()

const before = await client.query('SELECT count(*)::int AS users FROM users')
const requests = await client.query('SELECT count(*)::int AS requests FROM site_requests')

await client.query('TRUNCATE site_requests, users RESTART IDENTITY CASCADE')

console.log(`удалено пользователей: ${before.rows[0].users}`)
console.log(`удалено заявок: ${requests.rows[0].requests}`)
console.log('теперь первый зарегистрированный станет администратором')

await client.end()
