/**
 * Кто в базе: пользователи с ролями и заявки.
 * Запуск: node db-status.mjs
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const url = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((line) => line.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()

if (!url) {
  console.error('Не нашёл DATABASE_URL в .env.local')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()

const tables = await client.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
)
console.log('таблицы:', tables.rows.map((row) => row.tablename).join(', ') || 'нет')

const users = await client.query('SELECT id, name, email, role, created_at FROM users ORDER BY id')
console.log(`\nпользователей: ${users.rows.length}`)
for (const user of users.rows) {
  const date = new Date(user.created_at).toLocaleString('ru-RU')
  console.log(`  #${user.id} ${user.name} <${user.email}> — ${user.role} — ${date}`)
}

const requests = await client.query(
  'SELECT id, name, email, left(message, 40) AS message, status FROM site_requests ORDER BY id',
)
console.log(`\nзаявок: ${requests.rows.length}`)
for (const item of requests.rows) {
  console.log(`  #${item.id} ${item.name} <${item.email}> — ${item.message} — ${item.status}`)
}

await client.end()
