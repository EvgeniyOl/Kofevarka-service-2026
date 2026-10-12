/**
 * Разовая уборка: возвращает списки сайта к значениям из кода.
 * Запуск: node scripts/reset-lists.mjs
 *
 * Удаляет все элементы списков и отметки о заливке: при следующем заходе
 * админа списки снова наполнятся значениями из `src/data/lists.ts`.
 * Нужна после проверок — они правят, добавляют и удаляют элементы.
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

const before = await client.query(
  'SELECT kind, count(*)::int AS n FROM site_items GROUP BY kind ORDER BY kind',
)
console.log(`списков с элементами: ${before.rowCount}`)
for (const row of before.rows) console.log(`  ${row.kind}: ${row.n}`)

const removed = await client.query('DELETE FROM site_items')
const flags = await client.query("DELETE FROM site_meta WHERE key LIKE 'items_seeded:%'")

console.log(`\nудалено элементов: ${removed.rowCount}, отметок о заливке: ${flags.rowCount}`)
console.log('при следующем заходе админа списки наполнятся значениями из кода')

await client.end()
