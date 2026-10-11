/**
 * Каталог магазина и сервиса. Данные лежат отдельно от сторов: сторы
 * отвечают за состояние (фильтры, корзина, выбор), а это — справочник.
 *
 * Товары трёх видов: кофе (зерно от поставщиков), техника (кофемашины,
 * кофемолки) и расходники с аксессуарами. Общие поля у всех одни,
 * различия — в необязательных: у кофе это страна и помол, у техники —
 * характеристики, у расходников — совместимость.
 */

export type Category = 'coffee' | 'machines' | 'supplies'
export type Grind = 'beans' | 'espresso' | 'filter' | 'french'
export type Badge = 'hit' | 'new' | 'limited'
export type Roast = 1 | 2 | 3 | 4 | 5

/** Вариант товара: у кофе это объём, у техники и расходников — одна позиция */
export interface Variant {
  value: string
  label: string
  /** Множитель к базовой цене */
  multiplier: number
}

export interface Product {
  id: string
  name: string
  category: Category
  /** Короткая подпись под названием: происхождение или тип устройства */
  subtitle: string
  description: string
  /** Базовая цена, ₽ */
  price: number
  /** Два цвета «сцены» карточки — вместо фотографии, чтобы не платить за картинки */
  scene: [string, string]
  badge?: Badge
  /** Раздел витрины внутри категории: «Кофемашины», «Кофемолки», «Чистящие средства» */
  kind: string

  // — кофе —
  /** Обжарка поставщика: 1 — очень светлая, 5 — тёмная */
  roast?: Roast
  notes?: string[]
  decaf?: boolean

  // — техника —
  specs?: string[]
  /** Гарантия в месяцах */
  warranty?: number

  // — расходники —
  compatibleWith?: string[]
  volume?: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  coffee: 'Кофе',
  machines: 'Техника',
  supplies: 'Расходники',
}

/** Какие категории что продают — для подписей и SEO-текстов витрины */
export const CATEGORY_HINTS: Record<Category, string> = {
  coffee: 'Зерно от проверенных обжарщиков: фильтр, эспрессо, декоф',
  machines: 'Кофемашины и кофемолки с гарантией и настройкой',
  supplies: 'Чистящие средства, фильтры и аксессуары для ухода',
}

export const VARIANT_OPTIONS: Record<Category, Variant[]> = {
  coffee: [
    { value: '250', label: '250 г', multiplier: 1 },
    { value: '500', label: '500 г', multiplier: 1.9 },
    { value: '1000', label: '1 кг', multiplier: 3.6 },
  ],
  machines: [{ value: '1', label: '1 шт', multiplier: 1 }],
  supplies: [{ value: '1', label: '1 шт', multiplier: 1 }],
}

export const GRIND_OPTIONS: ReadonlyArray<{ value: Grind; label: string; hint: string }> = [
  { value: 'beans', label: 'В зёрнах', hint: 'Свежесть дольше всего' },
  { value: 'espresso', label: 'Эспрессо', hint: 'Для рожковых и гейзеров' },
  { value: 'filter', label: 'Фильтр', hint: 'V60, Aeropress, дрип' },
  { value: 'french', label: 'Френч-пресс', hint: 'Крупный помол' },
]

export const ROAST_LABELS: Record<Roast, string> = {
  1: 'очень светлая',
  2: 'светлая',
  3: 'средняя',
  4: 'средне-тёмная',
  5: 'тёмная',
}

export const BADGE_LABELS: Record<Badge, string> = {
  hit: 'Хит продаж',
  new: 'Новинка',
  limited: 'Лимитированная партия',
}

export const PRODUCTS: Product[] = [
  // — Кофе: зерно от поставщиков, без собственной обжарки —
  {
    id: 'colombia-huila',
    name: 'Colombia Huila Washed',
    category: 'coffee',
    kind: 'Зерно',
    subtitle: 'Колумбия · Уила',
    roast: 3,
    notes: ['карамель', 'красное яблоко', 'какао'],
    description:
      'Универсальный характер: хорош и в эспрессо, и в фильтре. Мягкая сладость и понятная карамель.',
    price: 790,
    scene: ['#4a3a24', '#8f6b3a'],
    badge: 'hit',
  },
  {
    id: 'brazil-cerrado',
    name: 'Brazil Cerrado Bourbon',
    category: 'coffee',
    kind: 'Зерно',
    subtitle: 'Бразилия · Серрадо',
    roast: 4,
    notes: ['фундук', 'молочный шоколад', 'табак'],
    description:
      'База для домашних эспрессо-смесей: низкая кислотность, ореховая сладость, густая текстура.',
    price: 690,
    scene: ['#3f2a1c', '#7d4f2a'],
  },
  {
    id: 'ethiopia-guji',
    name: 'Ethiopia Guji Natural',
    category: 'coffee',
    kind: 'Зерно',
    subtitle: 'Эфиопия · Гуджи',
    roast: 2,
    notes: ['черника', 'жасмин', 'мёд'],
    description:
      'Натуральная обработка, ягоды сушатся целиком — отсюда яркая черника и цветочный аромат. Для фильтра и воронки.',
    price: 890,
    scene: ['#4b2a4f', '#8c4a6b'],
    badge: 'new',
  },
  {
    id: 'kenya-nyeri',
    name: 'Kenya Nyeri AA',
    category: 'coffee',
    kind: 'Зерно',
    subtitle: 'Кения · Ньери',
    roast: 2,
    notes: ['чёрная смородина', 'томат', 'тростниковый сахар'],
    description:
      'Плотное тело и высокая кислотность — эталонный кенийский профиль. Зерно калибра AA, ручной отбор.',
    price: 950,
    scene: ['#2f3f52', '#5d7f8c'],
    badge: 'limited',
  },
  {
    id: 'decaf-colombia',
    name: 'Decaf Colombia Sugarcane',
    category: 'coffee',
    kind: 'Зерно',
    subtitle: 'Колумбия · Каука',
    roast: 3,
    notes: ['карамель', 'вишня', 'какао'],
    description:
      'Декофеинизация тростниковым этилацетатом — без потери сладости. Вечерний вариант без кофеина.',
    price: 760,
    scene: ['#3a2c46', '#6f5a86'],
    decaf: true,
  },
  {
    id: 'espresso-blend',
    name: 'Espresso Blend Kofevarka',
    category: 'coffee',
    kind: 'Зерно',
    subtitle: 'Смесь · Бразилия + Колумбия + Индия',
    roast: 4,
    notes: ['шоколад', 'грецкий орех', 'чернослив'],
    description:
      'Наша рабочая смесь под молоко и автоматические кофемашины: стабильная от партии к партии.',
    price: 640,
    scene: ['#43241d', '#9c4a33'],
    badge: 'hit',
  },

  // — Техника —
  {
    id: 'delonghi-magnifica-s',
    name: 'De’Longhi Magnifica S',
    category: 'machines',
    kind: 'Кофемашины',
    subtitle: 'Автоматическая, для дома',
    description:
      'Автоматическая машина с жерновой кофемолкой и автокапучинатором. Простая в уходе, подходит для 2–6 чашек в день.',
    price: 42900,
    specs: ['15 бар', 'жерновая кофемолка', 'капучинатор', '1,8 л'],
    warranty: 24,
    scene: ['#2b3140', '#4d5a73'],
    badge: 'hit',
  },
  {
    id: 'rancilio-silvia-pro-x',
    name: 'Rancilio Silvia Pro X',
    category: 'machines',
    kind: 'Кофемашины',
    subtitle: 'Рожковая, для дома и кофеен',
    description:
      'Два бойлера, PID-термостат и профессиональная группа — стабильный эспрессо даже в потоке.',
    price: 189000,
    specs: ['2 бойлера', 'PID', '58 мм группа', 'ротационный насос'],
    warranty: 24,
    scene: ['#3a2f2a', '#8a6a4f'],
    badge: 'new',
  },
  {
    id: 'gaggia-classic-evo',
    name: 'Gaggia Classic Evo Pro',
    category: 'machines',
    kind: 'Кофемашины',
    subtitle: 'Рожковая, для начинающих',
    description:
      'Классика для домашнего эспрессо: настоящая группа, ремонтопригодная конструкция и запчасти в наличии.',
    price: 74900,
    specs: ['58 мм группа', '9 бар', 'ручной пар', 'корпус из стали'],
    warranty: 12,
    scene: ['#33383f', '#6f7b88'],
  },
  {
    id: 'eureka-mignon-specialita',
    name: 'Eureka Mignon Specialita',
    category: 'machines',
    kind: 'Кофемолки',
    subtitle: 'Жерновая, для эспрессо',
    description:
      'Тихая жерновая кофемолка с бесступенчатой регулировкой — держит помол под эспрессо день за днём.',
    price: 56900,
    specs: ['55 мм жернова', 'бесступенчатая регулировка', 'дисплей', '1,4 кг бункера'],
    warranty: 24,
    scene: ['#2f3336', '#7d7268'],
  },
  {
    id: 'timemore-c3-pro',
    name: 'Timemore Chestnut C3 Pro',
    category: 'machines',
    kind: 'Кофемолки',
    subtitle: 'Ручная, для фильтра',
    description: 'Ручная кофемолка со стальными жерновами — берут в поездки и для альтернативы.',
    price: 8900,
    specs: ['стальные жернова', 'S2C 660', 'алюминиевый корпус'],
    warranty: 12,
    scene: ['#3c352e', '#8d7a5f'],
  },

  // — Расходники и аксессуары —
  {
    id: 'descaler-liquid',
    name: 'Средство от накипи',
    category: 'supplies',
    kind: 'Чистящие средства',
    subtitle: 'Для всех типов кофемашин',
    description:
      'Жидкий декальцинатор: убирает накипь в бойлере и продлевает срок службы машины. Хватает на 4 чистки.',
    price: 890,
    volume: '500 мл',
    compatibleWith: ['De’Longhi', 'Philips', 'Gaggia', 'Rancilio'],
    scene: ['#243b46', '#4f8a9c'],
  },
  {
    id: 'cleaning-tablets',
    name: 'Таблетки для чистки группы',
    category: 'supplies',
    kind: 'Чистящие средства',
    subtitle: 'Для рожковых кофемашин',
    description:
      'Убирают кофейные масла из группы и холдера. Одна таблетка на промывку, упаковка на 25 чисток.',
    price: 690,
    volume: '25 шт',
    compatibleWith: ['Рожковые машины', 'Группа 58 мм', 'Группа 54 мм'],
    scene: ['#2b3a2f', '#5f8a6a'],
  },
  {
    id: 'water-filter-cartridge',
    name: 'Фильтр для воды',
    category: 'supplies',
    kind: 'Фильтры',
    subtitle: 'Сменный картридж, 50 л',
    description:
      'Смягчает воду до накипи: кофе раскрывается чище, а бойлер живёт дольше. Ресурс — 50 литров.',
    price: 1290,
    volume: '1 шт',
    compatibleWith: ['De’Longhi', 'Philips', 'Nivona', 'Melitta'],
    scene: ['#2a3346', '#5a6f9c'],
  },
  {
    id: 'tamper-58',
    name: 'Темпер 58 мм',
    category: 'supplies',
    kind: 'Аксессуары',
    subtitle: 'Нержавеющая сталь',
    description: 'Ровная площадка и удобная ручка: температура держится, а таблетка не крошится.',
    price: 3400,
    specs: ['58 мм', 'нержавеющая сталь', 'вес 320 г'],
    scene: ['#33302c', '#7a7166'],
  },
  {
    id: 'scale-acacia-pearl',
    name: 'Весы Acaia Pearl S',
    category: 'supplies',
    kind: 'Аксессуары',
    subtitle: 'Для эспрессо и альтернативы',
    description: 'Точность 0,1 г и режим автостарта: считает вес чашки и время пролива без кнопок.',
    price: 24800,
    specs: ['0,1 г', 'до 2 кг', 'автотаймер', 'USB-C'],
    warranty: 12,
    scene: ['#2c2c34', '#6d6d7a'],
    badge: 'new',
  },
]

export const formatPrice = (value: number): string =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`

/** Варианты для категории товара */
export const variantsFor = (product: Product): Variant[] => VARIANT_OPTIONS[product.category]

/** Множитель выбранного варианта */
export const variantMultiplier = (product: Product, value: string): number =>
  variantsFor(product).find((variant) => variant.value === value)?.multiplier ?? 1

/** Цена конкретного варианта */
export const priceFor = (product: Product, value: string): number =>
  Math.round(product.price * variantMultiplier(product, value))

/** Цена за 100 г — только для кофе: по ней удобно сравнивать 250 г, 500 г и килограмм */
export const pricePer100 = (product: Product, value: string): number | null => {
  const grams = Number(value)
  if (product.category !== 'coffee' || !Number.isFinite(grams) || grams <= 0) return null
  return Math.round((priceFor(product, value) / grams) * 100)
}

export const findProduct = (id: string): Product | undefined =>
  PRODUCTS.find((product) => product.id === id)

/** Товары категории — для витрины, главной и подбора в подписке */
export const productsByCategory = (category: Category): Product[] =>
  PRODUCTS.filter((product) => product.category === category)

/** Сколько всего позиций в категории — для подписей в интерфейсе */
export const countByCategory = (category: Category): number => productsByCategory(category).length
