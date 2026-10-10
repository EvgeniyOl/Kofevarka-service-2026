/**
 * Каталог кофе. Данные лежат отдельно от сторов: сторы отвечают за состояние
 * (фильтры, корзина, выбор), а это — просто справочник.
 */

export type Grind = 'beans' | 'espresso' | 'filter' | 'french'
export type Size = 250 | 500 | 1000
export type Badge = 'hit' | 'new' | 'limited'
export type Roast = 1 | 2 | 3 | 4 | 5

export interface Product {
  id: string
  name: string
  country: string
  region: string
  /** Уровень обжарки: 1 — очень светлая, 5 — тёмная */
  roast: Roast
  notes: string[]
  description: string
  /** Цена за 250 г, ₽ */
  price250: number
  /** Два цвета «сцены» карточки — вместо фотографии, чтобы не платить за картинки */
  scene: [string, string]
  badge?: Badge
  decaf?: boolean
}

export const SIZE_OPTIONS: ReadonlyArray<{ value: Size; label: string; multiplier: number }> = [
  { value: 250, label: '250 г', multiplier: 1 },
  { value: 500, label: '500 г', multiplier: 1.9 },
  { value: 1000, label: '1 кг', multiplier: 3.6 },
]

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
  {
    id: 'ethiopia-guji',
    name: 'Ethiopia Guji Natural',
    country: 'Эфиопия',
    region: 'Гуджи',
    roast: 2,
    notes: ['черника', 'жасмин', 'мёд'],
    description:
      'Натуральная обработка, ягоды сушатся целиком — отсюда яркая черника и цветочный аромат. Для фильтра и воронки.',
    price250: 890,
    scene: ['#4b2a4f', '#8c4a6b'],
    badge: 'new',
  },
  {
    id: 'kenya-nyeri',
    name: 'Kenya Nyeri AA',
    country: 'Кения',
    region: 'Ньери',
    roast: 2,
    notes: ['чёрная смородина', 'томат', 'тростниковый сахар'],
    description:
      'Плотное тело и высокая кислотность — эталонный кенийский профиль. Зерно калибра AA, ручной отбор.',
    price250: 950,
    scene: ['#2f3f52', '#5d7f8c'],
    badge: 'limited',
  },
  {
    id: 'colombia-huila',
    name: 'Colombia Huila Washed',
    country: 'Колумбия',
    region: 'Уила',
    roast: 3,
    notes: ['карамель', 'красное яблоко', 'какао'],
    description:
      'Универсальный характер: хорош и в эспрессо, и в фильтре. Мягкая сладость и понятная карамель.',
    price250: 790,
    scene: ['#4a3a24', '#8f6b3a'],
    badge: 'hit',
  },
  {
    id: 'brazil-cerrado',
    name: 'Brazil Cerrado Bourbon',
    country: 'Бразилия',
    region: 'Серрадо',
    roast: 4,
    notes: ['фундук', 'молочный шоколад', 'табак'],
    description:
      'База для домашних эспрессо-смесей: низкая кислотность, ореховая сладость, густая текстура.',
    price250: 690,
    scene: ['#3f2a1c', '#7d4f2a'],
  },
  {
    id: 'guatemala-antigua',
    name: 'Guatemala Antigua',
    country: 'Гватемала',
    region: 'Антигуа',
    roast: 3,
    notes: ['апельсин', 'корица', 'тёмный шоколад'],
    description:
      'Вулканические почвы дают пряную сладость и цитрус. Отличный вариант для гейзерной варки.',
    price250: 820,
    scene: ['#4d3320', '#a05c2c'],
  },
  {
    id: 'sumatra-mandheling',
    name: 'Sumatra Mandheling',
    country: 'Индонезия',
    region: 'Суматра',
    roast: 5,
    notes: ['кедр', 'тёмный шоколад', 'специи'],
    description:
      'Мокрая обработка гилинга: землистый, пряный, очень плотный кофе. Для тех, кто любит потемнее.',
    price250: 850,
    scene: ['#26332b', '#4f6b4a'],
  },
  {
    id: 'decaf-colombia',
    name: 'Decaf Colombia Sugarcane',
    country: 'Колумбия',
    region: 'Каука',
    roast: 3,
    notes: ['карамель', 'вишня', 'какао'],
    description:
      'Декофеинизация тростниковым этилацетатом — без потери сладости. Вечерний вариант без кофеина.',
    price250: 760,
    scene: ['#3a2c46', '#6f5a86'],
    decaf: true,
  },
  {
    id: 'signature-blend',
    name: 'Kofevarka Signature',
    country: 'Смесь',
    region: 'Бразилия + Колумбия + Индия',
    roast: 4,
    notes: ['шоколад', 'грецкий орех', 'чернослив'],
    description:
      'Наша визитная карточка: собран под молоко и эспрессо-машины, стабильный от партии к партии.',
    price250: 640,
    scene: ['#43241d', '#9c4a33'],
    badge: 'hit',
  },
]

export const formatPrice = (value: number): string =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`

export const sizeMultiplier = (size: Size): number =>
  SIZE_OPTIONS.find((option) => option.value === size)?.multiplier ?? 1

/** Цена конкретного объёма */
export const priceFor = (product: Product, size: Size): number =>
  Math.round(product.price250 * sizeMultiplier(size))

/** Цена за 100 г — по ней удобно сравнивать 250 г, 500 г и килограмм */
export const pricePer100 = (product: Product, size: Size): number =>
  Math.round((priceFor(product, size) / size) * 100)

export const findProduct = (id: string): Product | undefined =>
  PRODUCTS.find((product) => product.id === id)
