/**
 * Разовая уборка: возвращает стартовый список партнёров.
 * Запуск: node scripts/reset-partners.mjs
 *
 * Нужна после проверок: они правят описания, добавляют и удаляют карточки.
 * Скрипт удаляет всё и заливает исходных трёх — тех же, что приходят
 * в свежую базу (см. DEFAULT_PARTNERS_SQL в api/_lib/db.ts).
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const url = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((line) => line.startsWith('DATABASE_URL='))
  .slice('DATABASE_URL='.length)
  .trim()

/** Стартовый набор: должен совпадать с тем, что заливает сервер */
const DEFAULTS = [
  {
    position: 1,
    name: 'Santino',
    note: 'Обжарщик из Омска: зерно для эспрессо и фильтра, знакомое гостям города.',
    logo: '/photos/partners/santino.png',
  },
  {
    position: 2,
    name: 'Skuratov Coffee',
    note: 'Спешелти-обжарка для кофеен: ставим их зерно в аппараты после настройки помола.',
    logo: '/photos/partners/skuratov.png',
  },
  {
    position: 3,
    name: 'Surf Coffee',
    note: 'Кофейни с собственным зерном: обслуживаем технику и подбираем расходники.',
    logo: '/photos/partners/surf.png',
  },
]

const client = new pg.Client({ connectionString: url })
await client.connect()

const removed = await client.query('SELECT name FROM partners')
console.log(`удаляю записей: ${removed.rowCount}`)
for (const row of removed.rows) console.log(`  - ${row.name}`)

await client.query('TRUNCATE partners RESTART IDENTITY')

for (const item of DEFAULTS) {
  await client.query('INSERT INTO partners (position, name, note, logo) VALUES ($1, $2, $3, $4)', [
    item.position,
    item.name,
    item.note,
    item.logo,
  ])
}

const left = await client.query('SELECT position, name, logo FROM partners ORDER BY position')
console.log(`\nвосстановлено партнёров: ${left.rowCount}`)
for (const row of left.rows) console.log(`  ${row.position}. ${row.name} — ${row.logo}`)

await client.end()
