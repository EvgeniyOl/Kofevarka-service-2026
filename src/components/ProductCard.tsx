import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { BADGE_LABELS, formatPrice, priceFor, type Product } from '../data/products'
import { CupArt } from './CupArt'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
  /** Выбранный вариант: объём кофе или «1 шт» для техники */
  variant: string
  /** Помол — только для кофе */
  grindLabel?: string
  /** Цена за 100 г — только для кофе */
  per100?: number | null
  className?: string
}

const ROAST_SCALE = [1, 2, 3, 4, 5] as const

/**
 * Карточка товара. Компонент презентационный: вариант и помол передаёт страница,
 * поэтому карточку используют и главная, и витрина.
 * Что показывать в теле — зависит от категории: у кофе это обжарка и
 * вкусовые ноты, у техники характеристики и гарантия, у расходников
 * совместимость и объём.
 * Кнопки покупки нет: сайт информационный, поэтому карточка ведёт на контакты.
 */
export function ProductCard({ product, variant, grindLabel, per100, className }: ProductCardProps) {
  return (
    <article className={cx(ui.card, styles.card, className)}>
      <div className={styles.art}>
        {product.photo ? (
          <img
            className={styles.photo}
            src={product.photo}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <CupArt scene={product.scene} />
        )}
        {product.badge ? <span className={styles.badge}>{BADGE_LABELS[product.badge]}</span> : null}
        {product.decaf ? <span className={styles.decaf}>без кофеина</span> : null}
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.origin}>
            {product.kind} · {product.subtitle}
          </p>
        </header>

        {product.roast ? (
          <div className={styles.roast} title={`Обжарка поставщика: ${product.roast}/5`}>
            <span className={styles.roastLabel}>обжарка</span>
            <span className={styles.roastScale}>
              {ROAST_SCALE.map((level) => (
                <i
                  key={level}
                  className={cx(styles.roastDot, level <= product.roast! && styles.roastOn)}
                />
              ))}
            </span>
            {grindLabel ? <span className={styles.roastText}>{grindLabel}</span> : null}
          </div>
        ) : null}

        {product.notes?.length ? (
          <ul className={styles.notes}>
            {product.notes.map((note) => (
              <li key={note} className={ui.chip}>
                {note}
              </li>
            ))}
          </ul>
        ) : null}

        {product.specs?.length ? (
          <ul className={styles.notes}>
            {product.specs.map((spec) => (
              <li key={spec} className={ui.chip}>
                {spec}
              </li>
            ))}
          </ul>
        ) : null}

        <p className={styles.text}>{product.description}</p>

        {product.warranty ? (
          <p className={styles.metaLine}>Гарантия {product.warranty} мес · сервис в Омске</p>
        ) : null}

        {product.compatibleWith?.length ? (
          <p className={styles.metaLine}>
            Подходит: {product.compatibleWith.join(', ')}
            {product.volume ? ` · ${product.volume}` : ''}
          </p>
        ) : null}

        <footer className={styles.footer}>
          <div className={styles.prices}>
            <span className={ui.price}>{formatPrice(priceFor(product, variant))}</span>
            {per100 ? <span className={styles.per100}>{formatPrice(per100)} за 100 г</span> : null}
          </div>
          <Link className={cx(ui.btn, styles.add)} to={ROUTES.contacts.path}>
            Уточнить наличие
          </Link>
        </footer>
      </div>
    </article>
  )
}
