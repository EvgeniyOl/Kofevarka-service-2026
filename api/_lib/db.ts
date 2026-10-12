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
