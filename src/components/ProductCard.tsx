import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { BADGE_LABELS } from '../data/badges'
import { CupArt } from './CupArt'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ProductCard.module.css'

/**
 * Карточка товара для подборки на главной.
 *
 * Данные приходят полями редактируемого списка (`home.featured`), а не из
 * каталога: админ сам добавляет карточки, правит текст и цену. Каталог
 * Данные карточек админ собирает сам — они лежат в базе, а не в каталоге.
 *
 * Кнопки покупки нет: сайт информационный, поэтому карточка ведёт на контакты.
 */

/** Подписи вокруг данных: это часть карточки, а не контент страницы */
const LABELS = {
  action: 'Уточнить наличие',
  roastLabel: 'обжарка',
  decafLabel: 'без кофеина',
  warranty: 'Гарантия',
  warrantyTail: 'сервис в Омске',
  compatible: 'Подходит:',
}

/** Цвета рисованной «сцены», если у карточки нет фотографии */
const DEFAULT_SCENE: [string, string] = ['#243b46', '#4f8a9c']

/** Разбивает многострочное поле на пункты: пустые строки отбрасываем */
const toList = (value: string | undefined): string[] =>
  (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

interface ProductCardProps {
  /** Поля карточки из списка `home.featured` */
  fields: Record<string, string>
  /** Количество кофейных делений: у техники и услуг не показываем */
  roast?: number
  className?: string
}

export function ProductCard({ fields, roast, className }: ProductCardProps) {
  const specs = toList(fields.specs)
  const compatible = toList(fields.compatibleWith)
  const badge = fields.badge ? BADGE_LABELS[fields.badge as keyof typeof BADGE_LABELS] : undefined
  const price = Number(fields.price)

  return (
    <article className={cx(ui.card, styles.card, className)}>
      <div className={styles.art}>
        {fields.photo ? (
          <img
            className={styles.photo}
            src={fields.photo}
            alt={fields.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <CupArt scene={DEFAULT_SCENE} />
        )}
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        {fields.decaf ? <span className={styles.decaf}>{LABELS.decafLabel}</span> : null}
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <h3 className={styles.name}>{fields.name}</h3>
          <p className={styles.origin}>
            {fields.kind}
            {fields.subtitle ? ` · ${fields.subtitle}` : ''}
          </p>
        </header>

        {roast ? (
          <div className={styles.roast} title={`Обжарка поставщика: ${roast}/5`}>
            <span className={styles.roastLabel}>{LABELS.roastLabel}</span>
            <span className={styles.roastScale}>
              {[1, 2, 3, 4, 5].map((level) => (
                <i key={level} className={cx(styles.roastDot, level <= roast && styles.roastOn)} />
              ))}
            </span>
          </div>
        ) : null}

        {specs.length ? (
          <ul className={styles.notes}>
            {specs.map((spec) => (
              <li key={spec} className={ui.chip}>
                {spec}
              </li>
            ))}
          </ul>
        ) : null}

        {fields.description ? <p className={styles.text}>{fields.description}</p> : null}

        {fields.warranty ? (
          <p className={styles.metaLine}>
            {LABELS.warranty} {fields.warranty} мес · {LABELS.warrantyTail}
          </p>
        ) : null}

        {compatible.length ? (
          <p className={styles.metaLine}>
            {LABELS.compatible} {compatible.join(', ')}
            {fields.volume ? ` · ${fields.volume}` : ''}
          </p>
        ) : null}

        <footer className={styles.footer}>
          <div className={styles.prices}>
            <span className={ui.price}>
              {Number.isFinite(price) && price > 0
                ? `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
                : 'Цена по запросу'}
            </span>
          </div>
          <Link className={cx(ui.btn, styles.add)} to={ROUTES.contacts.path}>
            {LABELS.action}
          </Link>
        </footer>
      </div>
    </article>
  )
}
