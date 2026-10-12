/**
 * Метки на карточках подборки.
 *
 * В карточке товара админ выбирает пометку словом (`hit`, `new`, `limited`),
 * а показывается она человеческим текстом — он здесь.
 */

export type Badge = 'hit' | 'new' | 'limited'

export const BADGE_LABELS: Record<Badge, string> = {
  hit: 'Хит продаж',
  new: 'Новинка',
  limited: 'Лимитированная партия',
}
