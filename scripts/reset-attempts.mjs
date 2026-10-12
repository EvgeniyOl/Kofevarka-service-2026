/**
 * Снимает блокировку входа, накопленную проверками.
 * Запуск: node scripts/reset-attempts.mjs
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const url = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((line) => line.startsWith('DATABASE_URL='))
  .slice('DATABASE_URL='.length)
  .trim()

const client = new pg.Client({ connectionString: url })
await client.connect()

const rows = await client.query('SELECT key, count, reset_at FROM auth_attempts ORDER BY key')
console.log(`записей о неудачных попытках: ${rows.rowCount}`)
for (const row of rows.rows) {
  console.log(
    `  ${row.key} — попыток ${row.count}, до ${new Date(row.reset_at).toLocaleTimeString('ru-RU')}`,
  )
}

const removed = await client.query('DELETE FROM auth_attempts')
console.log(`\nснято блокировок: ${removed.rowCount}`)

await client.end()
