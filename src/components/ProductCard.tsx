import { useEffect, useRef, useState } from 'react'
import {
  BADGE_LABELS,
  ROAST_LABELS,
  formatPrice,
  priceFor,
  pricePer100,
  type Product,
  type Size,
} from '../data/products'
import { CupArt } from './CupArt'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
  size: Size
  onAdd: () => void
  className?: string
}

const ROAST_SCALE = [1, 2, 3, 4, 5] as const

/**
 * Карточка товара. Компонент презентационный: объём, помол и корзину
 * передаёт страница, поэтому карточку используют и главная, и витрина.
 * Подтверждение «в корзине» — локальный отклик кнопки, а не данные приложения.
 */
export function ProductCard({ product, size, onAdd, className }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const handleAdd = () => {
    onAdd()
    setJustAdded(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <article className={cx(ui.card, styles.card, justAdded && styles.added, className)}>
      <div className={styles.art}>
        <CupArt scene={product.scene} />
        {product.badge ? <span className={styles.badge}>{BADGE_LABELS[product.badge]}</span> : null}
        {product.decaf ? <span className={styles.decaf}>без кофеина</span> : null}
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.origin}>
            {product.country} · {product.region}
          </p>
        </header>

        <div className={styles.roast} title={`Обжарка: ${ROAST_LABELS[product.roast]}`}>
          <span className={styles.roastLabel}>обжарка</span>
          <span className={styles.roastScale}>
            {ROAST_SCALE.map((level) => (
              <i
                key={level}
                className={cx(styles.roastDot, level <= product.roast && styles.roastOn)}
              />
            ))}
          </span>
          <span className={styles.roastText}>{ROAST_LABELS[product.roast]}</span>
        </div>

        <ul className={styles.notes}>
          {product.notes.map((note) => (
            <li key={note} className={ui.chip}>
              {note}
            </li>
          ))}
        </ul>

        <p className={styles.text}>{product.description}</p>

        <footer className={styles.footer}>
          <div className={styles.prices}>
            <span className={ui.price}>{formatPrice(priceFor(product, size))}</span>
            <span className={styles.per100}>
              {formatPrice(pricePer100(product, size))} за 100 г
            </span>
          </div>
          <button
            type="button"
            className={cx(ui.btn, styles.add, justAdded && styles.addDone)}
            onClick={handleAdd}
          >
            {justAdded ? 'В корзине ✓' : 'В корзину'}
          </button>
        </footer>
      </div>
    </article>
  )
}
