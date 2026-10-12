/**
 * Разовая уборка: убирает правки текстов, оставшиеся после проверок.
 * Запуск: node scripts/reset-content.mjs
 *
 * После этого все блоки показывают тексты из кода: правки админа не удаляются
 * молча, поэтому скрипт спрашивает подтверждение списком того, что убирает.
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

const rows = await client.query('SELECT key, fields FROM site_content ORDER BY key')
console.log(`правок в базе: ${rows.rowCount}`)
for (const row of rows.rows) {
  console.log(`  ${row.key}:`)
  for (const [name, value] of Object.entries(row.fields)) {
    console.log(`    ${name} = ${String(value).slice(0, 60)}`)
  }
}

if (rows.rowCount) {
  await client.query('DELETE FROM site_content')
  console.log('\nудалено: все блоки вернулись к текстам из кода')
}

await client.end()
