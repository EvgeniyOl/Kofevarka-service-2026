/**
 * Разовая уборка: возвращает стартовый набор карточек направлений.
 * Запуск: node scripts/reset-directions.mjs
 *
 * Нужна после проверок: они правят, добавляют и удаляют карточки. Скрипт
 * удаляет всё и заливает исходные пять — те же, что приходят в свежую базу
 * (см. DEFAULT_DIRECTIONS_SQL в api/_lib/db.ts).
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
    icon: '🏭',
    title: 'Профессиональные кофемашины',
    text: 'Аппараты для кофеен, баров и офисов: одиночные группы, двухгруппники, автоматические и суперавтоматы.',
    points: [
      'бойлер и гидросистема',
      'замена помпы и клапанов',
      'температура и давление',
      'подменный аппарат на время работ',
    ],
  },
  {
    position: 2,
    icon: '🏠',
    title: 'Бытовые кофемашины',
    text: 'Домашние автоматические и рожковые машины: чистим от накипи, меняем изношенные узлы, восстанавливаем настройки.',
    points: ['накипь и засоры', 'кофемолка и дозатор', 'капучинатор и пар', 'течь и шум помпы'],
  },
  {
    position: 3,
    icon: '⚙️',
    title: 'Кофемолки и техника',
    text: 'Жерновые и ручные кофемолки, капсульные машины, фильтры для воды — всё, что стоит рядом с кофе.',
    points: [
      'замена жерновов',
      'калибровка помола',
      'ремонт капсульных машин',
      'замена картриджей',
    ],
  },
  {
    position: 4,
    icon: '📋',
    title: 'Обслуживание по договору',
    text: 'Для кофеен и офисов: приезжаем по графику, чистим и проверяем технику до того, как она встанет.',
    points: [
      'чистка и декальцинация',
      'проверка помола и давления',
      'отчёт по каждой машине',
      'приоритет при поломке',
    ],
  },
  {
    position: 5,
    icon: '🚚',
    title: 'Выезд мастера',
    text: 'Ремонт на месте: приезжаем с запчастями и инструментом, большинство аппаратов поднимаем за один визит.',
    points: [
      'по Омску и области',
      'запчасти с собой',
      'заберём и вернём машину',
      'работы в удобное время',
    ],
  },
]

const client = new pg.Client({ connectionString: url })
await client.connect()

const removed = await client.query('SELECT title FROM repair_directions')
console.log(`удаляю карточек: ${removed.rowCount}`)
for (const row of removed.rows) console.log(`  - ${row.title}`)

await client.query('TRUNCATE repair_directions RESTART IDENTITY')

for (const item of DEFAULTS) {
  await client.query(
    `INSERT INTO repair_directions (position, icon, title, text, points)
     VALUES ($1, $2, $3, $4, $5)`,
    [item.position, item.icon, item.title, item.text, item.points],
  )
}

const left = await client.query(
  'SELECT position, icon, title, points FROM repair_directions ORDER BY position',
)
console.log(`\nвосстановлено карточек: ${left.rowCount}`)
for (const row of left.rows) {
  console.log(`  ${row.position}. ${row.icon} ${row.title} — пунктов: ${row.points.length}`)
}

await client.end()
