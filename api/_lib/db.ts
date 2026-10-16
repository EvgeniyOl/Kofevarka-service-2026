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
 * Личный кабинет клиента (мобильное приложение). Заявка с сайта и заявка на
 * ремонт — одна сущность: мастер ведёт их в одном списке, а не в двух.
 * Колонки добавляем отдельными ALTER: таблица уже существует в проде,
 * и CREATE TABLE её не тронет.
 *
 * created_at у заявки — момент приёма, updated_at — последнее изменение
 * (по нему сортируется список «мои ремонты»).
 */
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'repair';
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS device_kind TEXT NOT NULL DEFAULT 'coffee_machine';
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS device_model TEXT NOT NULL DEFAULT '';
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS serial TEXT;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS master_comment TEXT;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS warranty_days INTEGER;
ALTER TABLE site_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

/*
 * Статусы ремонта. Старые значения (in_progress, done) оставляем в CHECK:
 * их проставили заявкам до появления кабинета, и запрет сломал бы чтение
 * существующих строк. Значения должны совпадать с REPAIR_STATUSES
 * в packages/shared проекта KofevarkaMob.
 */
ALTER TABLE site_requests DROP CONSTRAINT IF EXISTS site_requests_status_check;
ALTER TABLE site_requests ADD CONSTRAINT site_requests_status_check
  CHECK (status IN (
    'new', 'in_progress', 'done',
    'accepted', 'diagnostics', 'approval', 'waiting_parts',
    'repair', 'ready', 'issued', 'declined', 'canceled'
  ));

CREATE INDEX IF NOT EXISTS site_requests_user_idx ON site_requests (user_id, updated_at DESC);

/*
 * История ремонта: что и когда менялось. Без неё клиент видит только текущий
 * статус, а вопрос «когда это случилось» остаётся без ответа.
 */
CREATE TABLE IF NOT EXISTS request_events (
  id         SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES site_requests(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  comment    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS request_events_request_idx ON request_events (request_id, created_at DESC);

/*
 * Первое событие для заявок, которые уже были в базе: иначе у ремонта
 * с историей пусто, и таймлайн в приложении начинается с середины.
 * Повторный запуск миграции ничего не добавит — проверяем наличие событий.
 */
INSERT INTO request_events (request_id, status, comment, created_at)
SELECT r.id, r.status, 'Заявка принята', r.created_at
FROM site_requests r
WHERE r.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM request_events e WHERE e.request_id = r.id);

/*
 * Редактируемые тексты сайта. В таблице лежат только те блоки, которые админ
 * менял: если строки нет, страница показывает текст из кода. Так правка одного
 * заголовка не требует заводить записи для всего сайта.
 * key — устойчивый идентификатор блока («repair.hero»), по нему страница
 * находит свои тексты.
 *
 * Поля блока лежат в JSONB, а не в отдельных колонках: у разных блоков свой
 * набор — у первого экрана ремонта это заголовок и подписи кнопок, у главной
 * ещё и надзаголовок с подзаголовком. С колонками пришлось бы делать миграцию
 * под каждый новый блок, а так состав полей задаётся в коде страницы.
 */
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  fields     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
 * Если таблица уже была со старой схемой, CREATE TABLE её не тронет —
 * колонку добавляем отдельно. Так миграция работает и на свежей базе,
 * и на той, где тексты уже правили.
 */
ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS fields JSONB NOT NULL DEFAULT '{}'::jsonb;

/*
 * Переносим тексты из прежней схемы с колонками title/lead/action_one/action_two.
 * Выполняется один раз: после переноса колонки удаляются.
 */
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'title'
  ) THEN
    UPDATE site_content
    SET fields = jsonb_strip_nulls(jsonb_build_object(
      'title', title,
      'lead', lead,
      'actionOne', action_one,
      'actionTwo', action_two
    ))
    WHERE fields = '{}'::jsonb;

    ALTER TABLE site_content
      DROP COLUMN IF EXISTS title,
      DROP COLUMN IF EXISTS lead,
      DROP COLUMN IF EXISTS action_one,
      DROP COLUMN IF EXISTS action_two;
  END IF;
END $$;

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

/*
 * Универсальные списки сайта: цифры, шаги работы, цены, вопросы, отзывы,
 * принципы, команда — всё, что выводится повторяющимися карточками.
 *
 * Одна таблица на все списки, потому что набор полей у них разный и меняется
 * от блока к блоку. kind — идентификатор списка из кода («repair.faq»),
 * fields — сам элемент объектом. Так новый список не требует ни таблицы,
 * ни миграции: достаточно описать поля на странице.
 *
 * Стартовые элементы заливаются один раз при первом обращении к списку:
 * их присылает фронтенд, потому что значения по умолчанию живут в коде.
 */
CREATE TABLE IF NOT EXISTS site_items (
  id         SERIAL PRIMARY KEY,
  kind       TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  fields     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_items_kind_idx ON site_items (kind, position, id);

/*
 * Неудачные попытки входа: защита от перебора пароля.
 * Ключ — «адрес клиента|почта», count — сколько раз ошиблись,
 * reset_at — когда счётчик обнулится сам.
 */
CREATE TABLE IF NOT EXISTS auth_attempts (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_attempts_reset_idx ON auth_attempts (reset_at);
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

/**
 * Neon на serverless подключают через пулер.
 *
 * Прямое подключение держит отдельный процесс базы на каждое соединение,
 * а функций Vercel несколько, и каждая открывает своё. У Neon на это жёсткий
 * лимит: когда он исчерпан, новые подключения не отказывают сразу, а висят —
 * API просто перестаёт отвечать. Пулер держит соединения с базой сам и
 * раздаёт их функциям, поэтому хост у него со словом `-pooler`.
 *
 * Если адрес не от Neon или пулер уже указан, ничего не меняем.
 */
export const withPooler = (url: string): string => {
  if (url.includes('-pooler')) return url

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('.neon.tech')) return url

    /*
     * У Neon пулер отличается словом в имени эндпоинта, а не в конце хоста:
     * прямой адрес — ep-cool-1.us-east-2.aws.neon.tech,
     * через пулер — ep-cool-1-pooler.us-east-2.aws.neon.tech.
     */
    const [endpoint, ...rest] = parsed.hostname.split('.')
    parsed.hostname = [`${endpoint}-pooler`, ...rest].join('.')
    return parsed.toString()
  } catch {
    // Адрес нестандартный — оставляем как есть, подключение разберётся само
    return url
  }
}

export const getPool = (): Pool => {
  const url = databaseUrl()

  if (!url) {
    throw new Error(
      'Не задан DATABASE_URL. Подключите базу в Vercel (Storage → Neon) или задайте строку подключения в .env.local',
    )
  }

  if (!globalThis.__kofevarkaPool) {
    const connection = withPooler(url)

    globalThis.__kofevarkaPool = new Pool({
      connectionString: connection,
      // Neon и большинство облачных Postgres требуют TLS, но с самоподписанным
      // сертификатом в цепочке — поэтому rejectUnauthorized: false
      ssl: connection.includes('localhost') ? undefined : { rejectUnauthorized: false },
      /*
       * Каждая функция Vercel — отдельный процесс со своим пулом, поэтому
       * держим по одному соединению: иначе десяток параллельных запросов
       * съедает лимит подключений Neon и часть запросов встаёт в очередь.
       */
      max: 1,
      // Не ждём соединение бесконечно: лучше честная ошибка, чем зависший ответ
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10_000,
      // И не даём одному запросу держать соединение дольше десяти секунд
      statement_timeout: 10_000,
    })
  }

  return globalThis.__kofevarkaPool
}

/**
 * Схему создаём при первом обращении: отдельная команда миграций для этого
 * проекта — лишний шаг, а SQL идемпотентный (IF NOT EXISTS, DROP ... IF EXISTS).
 *
 * Блокировку здесь не берём намеренно. `pg_advisory_lock` — вызов
 * блокирующий: на Vercel функции выполняются в нескольких экземплярах сразу,
 * и если один из них не успеет отпустить блокировку (таймаут функции,
 * замороженное соединение в пуле), все остальные повиснут навсегда —
 * ровно это и случилось однажды с продом.
 *
 * Ещё важнее `lock_timeout`: DDL берёт исключительную блокировку таблицы,
 * а её может держать чужая зависшая транзакция. Без таймаута миграция ждёт
 * её бесконечно, и вместе с ней виснет каждый запрос к API — тоже из практики.
 * Если за три секунды таблицы не освободились, миграцию пропускаем: схема
 * уже создана раньше, а работать сайту важнее, чем досоздать таблицу.
 */
const ensureSchema = async (): Promise<void> => {
  try {
    await getPool().query(`SET lock_timeout = '3000ms'; ${SCHEMA_SQL}`)
  } catch (error) {
    // Свежая база такую ошибку не даст: там таблицы свободны. Значит,
    // дело в чужой блокировке — сообщаем в лог и продолжаем работу
    console.error('Миграция схемы не выполнена:', error)
  }
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
