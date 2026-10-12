/**
 * Работа с базой: подключение к Postgres и схема.
 *
 * Подключение ленивое: пул создаётся при первом запросе, а не при загрузке
 * модуля. Так сборка и локальная разработка проходят даже без DATABASE_URL,
 * а ошибка появляется только когда действительно понадобилась база.
 */
import { Pool } from 'pg'

declare global {
  // В режиме разработки модуль может перезагружаться — пул держим в globalThis,
  // иначе каждый перезапуск оставлял бы висящие соединения.
  var __kofevarkaPool: Pool | undefined
  var __kofevarkaSchemaReady: Promise<void> | undefined
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_requests (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_requests_created_at_idx ON site_requests (created_at DESC);

/*
 * Редактируемые тексты сайта. В таблице лежат только те блоки, которые админ
 * менял: если строки нет, страница показывает текст из кода. Так правка одного
 * заголовка не требует заводить записи для всего сайта.
 * key — устойчивый идентификатор блока («repair.hero»), по нему страница
 * находит свои тексты.
 */
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  title      TEXT,
  lead       TEXT,
  action_one TEXT,
  action_two TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
 * Служебные отметки: например, что стартовый набор карточек уже заливался.
 * Без этого признака удалённые карточки возвращались бы при каждом запросе:
 * таблица пуста — значит, «свежая база».
 */
CREATE TABLE IF NOT EXISTS site_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

/*
 * Направления ремонта — карточки на странице «Ремонт». В отличие от текстов,
 * здесь строки есть всегда: админ может добавлять и удалять карточки, поэтому
 * таблица служит источником данных, а не набором правок.
 * position задаёт порядок вывода, чтобы карточки не перемешивались.
 */
CREATE TABLE IF NOT EXISTS repair_directions (
  id         SERIAL PRIMARY KEY,
  position   INTEGER NOT NULL DEFAULT 0,
  icon       TEXT NOT NULL DEFAULT '',
  title      TEXT NOT NULL,
  text       TEXT NOT NULL DEFAULT '',
  points     TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repair_directions_position_idx ON repair_directions (position, id);

/*
 * Партнёры — блок на странице «О нас». Как и направления, строки есть всегда:
 * админ добавляет и удаляет их сам.
 *
 * logo хранит либо путь к готовому файлу («/photos/partners/santino.png»),
 * либо картинку, загруженную из админки, в виде data URL. Так сервер не
 * зависит от файловой системы: на Vercel она только для чтения, и записать
 * загруженный файл на диск нельзя.
 */
CREATE TABLE IF NOT EXISTS partners (
  id         SERIAL PRIMARY KEY,
  position   INTEGER NOT NULL DEFAULT 0,
  name       TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  logo       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partners_position_idx ON partners (position, id);
`

/** Отметка о том, что стартовые карточки уже залиты */
const DIRECTIONS_SEED_FLAG = 'repair_directions_seeded'

/**
 * Карточки, которые показываются на странице «Ремонт» в свежей базе.
 * Заливаем их один раз и только если таблицу ещё не наполняли: дальше админ
 * распоряжается карточками сам. Если он удалит все, они не вернутся —
 * признак хранится в site_meta, а не выводится из пустоты таблицы.
 */
const DEFAULT_DIRECTIONS_SQL = `
WITH seed(position, icon, title, text, points) AS (
  VALUES
    (1, '🏭', 'Профессиональные кофемашины',
     'Аппараты для кофеен, баров и офисов: одиночные группы, двухгруппники, автоматические и суперавтоматы.',
     ARRAY['бойлер и гидросистема', 'замена помпы и клапанов', 'температура и давление', 'подменный аппарат на время работ']),
    (2, '🏠', 'Бытовые кофемашины',
     'Домашние автоматические и рожковые машины: чистим от накипи, меняем изношенные узлы, восстанавливаем настройки.',
     ARRAY['накипь и засоры', 'кофемолка и дозатор', 'капучинатор и пар', 'течь и шум помпы']),
    (3, '⚙️', 'Кофемолки и техника',
     'Жерновые и ручные кофемолки, капсульные машины, фильтры для воды — всё, что стоит рядом с кофе.',
     ARRAY['замена жерновов', 'калибровка помола', 'ремонт капсульных машин', 'замена картриджей']),
    (4, '📋', 'Обслуживание по договору',
     'Для кофеен и офисов: приезжаем по графику, чистим и проверяем технику до того, как она встанет.',
     ARRAY['чистка и декальцинация', 'проверка помола и давления', 'отчёт по каждой машине', 'приоритет при поломке']),
    (5, '🚚', 'Выезд мастера',
     'Ремонт на месте: приезжаем с запчастями и инструментом, большинство аппаратов поднимаем за один визит.',
     ARRAY['по Омску и области', 'запчасти с собой', 'заберём и вернём машину', 'работы в удобное время'])
)
INSERT INTO repair_directions (position, icon, title, text, points)
SELECT position, icon, title, text, points FROM seed
WHERE NOT EXISTS (SELECT 1 FROM site_meta WHERE key = $1);
`

/** Отметка о том, что стартовый список партнёров уже залит */
const PARTNERS_SEED_FLAG = 'partners_seeded'

/**
 * Партнёры в свежей базе: обжарщики, с которыми работает мастерская.
 * Логотипы лежат в public/photos/partners, поэтому в базе храним только путь.
 */
const DEFAULT_PARTNERS_SQL = `
WITH seed(position, name, note, logo) AS (
  VALUES
    (1, 'Santino',
     'Обжарщик из Омска: зерно для эспрессо и фильтра, знакомое гостям города.',
     '/photos/partners/santino.png'),
    (2, 'Skuratov Coffee',
     'Спешелти-обжарка для кофеен: ставим их зерно в аппараты после настройки помола.',
     '/photos/partners/skuratov.png'),
    (3, 'Surf Coffee',
     'Кофейни с собственным зерном: обслуживаем технику и подбираем расходники.',
     '/photos/partners/surf.png')
)
INSERT INTO partners (position, name, note, logo)
SELECT position, name, note, logo FROM seed
WHERE NOT EXISTS (SELECT 1 FROM site_meta WHERE key = $1);
`

/** Адрес базы: Vercel и Neon кладут его в DATABASE_URL */
export const databaseUrl = (): string | undefined =>
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL

export const getPool = (): Pool => {
  const url = databaseUrl()

  if (!url) {
    throw new Error(
      'Не задан DATABASE_URL. Подключите базу в Vercel (Storage → Neon) или задайте строку подключения в .env.local',
    )
  }

  if (!globalThis.__kofevarkaPool) {
    globalThis.__kofevarkaPool = new Pool({
      connectionString: url,
      // Neon и большинство облачных Postgres требуют TLS, но с самоподписанным
      // сертификатом в цепочке — поэтому rejectUnauthorized: false
      ssl: url.includes('localhost') ? undefined : { rejectUnauthorized: false },
      max: 3,
    })
  }

  return globalThis.__kofevarkaPool
}

/**
 * Схему создаём при первом обращении: отдельная команда миграций для этого
 * проекта — лишний шаг, а SQL идемпотентный (IF NOT EXISTS).
 */
const ensureSchema = async (): Promise<void> => {
  const pool = getPool()
  await pool.query(SCHEMA_SQL)
}

export const ready = (): Promise<void> => {
  if (!globalThis.__kofevarkaSchemaReady) {
    globalThis.__kofevarkaSchemaReady = ensureSchema().catch((error: unknown) => {
      // Не кэшируем неудачу: следующий запрос попробует снова
      globalThis.__kofevarkaSchemaReady = undefined
      throw error
    })
  }
  return globalThis.__kofevarkaSchemaReady
}

/** Запрос с гарантией, что схема уже создана */
export const query = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
  await ready()
  const pool = getPool()
  const result = await pool.query(sql, params)
  return result.rows as T[]
}

/**
 * Наполняет таблицу стартовым набором — один раз за всё время жизни базы.
 * Отметку ставим в site_meta, поэтому если админ удалит все строки,
 * они не вернутся: пустая таблица не считается «свежей базой».
 */
const seedTable = async (flagKey: string, sql: string): Promise<void> => {
  await ready()
  const client = await getPool().connect()

  try {
    await client.query('BEGIN')
    const existing = await client.query('SELECT 1 FROM site_meta WHERE key = $1', [flagKey])

    if (!existing.rowCount) {
      await client.query(sql, [flagKey])
      await client.query('INSERT INTO site_meta (key, value) VALUES ($1, $2)', [
        flagKey,
        new Date().toISOString(),
      ])
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** Стартовые карточки направлений */
export const seedDirections = (): Promise<void> =>
  seedTable(DIRECTIONS_SEED_FLAG, DEFAULT_DIRECTIONS_SQL)

/** Стартовый список партнёров */
export const seedPartners = (): Promise<void> => seedTable(PARTNERS_SEED_FLAG, DEFAULT_PARTNERS_SQL)
