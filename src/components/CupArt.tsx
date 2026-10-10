import { useId, type CSSProperties } from 'react'
import { cx } from '../utils/cx'
import styles from './CupArt.module.css'

interface CupArtProps {
  /** Два цвета «сцены»: фон-градиент вместо фотографии */
  scene: [string, string]
  variant?: 'card' | 'hero' | 'empty'
  className?: string
}

/**
 * Иллюстрация чашки вместо фотографии: рисуется SVG и CSS-градиентами.
 * Так карточки выглядят «сценарно» (приём 1790 Coffee), но не тянут
 * мегабайты картинок — по исследованию именно фото и видео просаживают
 * PageSpeed кофейных магазинов.
 */
export function CupArt({ scene, variant = 'card', className }: CupArtProps) {
  const gradientId = useId()
  const [from, to] = scene
  const style = { '--from': from, '--to': to } as CSSProperties

  return (
    <div className={cx(styles.art, styles[variant], className)} style={style} aria-hidden="true">
      <span className={styles.glow} />

      <div className={styles.steam}>
        <span />
        <span />
        <span />
      </div>

      <svg className={styles.cup} viewBox="0 0 200 200">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7efe4" />
            <stop offset="100%" stopColor="#cdb69c" />
          </linearGradient>
        </defs>

        <ellipse cx="100" cy="170" rx="64" ry="11" fill="rgba(0, 0, 0, 0.35)" />

        <path d="M50 72h100v32a50 50 0 0 1-50 50 50 50 0 0 1-50-50z" fill={`url(#${gradientId})`} />
        <path
          d="M150 80h12a20 20 0 0 1 0 40h-12"
          fill="none"
          stroke="#c9ab8b"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <ellipse cx="100" cy="72" rx="50" ry="12" fill="#40261a" />
        <ellipse cx="100" cy="72" rx="42" ry="9" fill="#6d4526" />
        <ellipse cx="86" cy="70" rx="14" ry="4" fill="rgba(255, 236, 214, 0.28)" />
      </svg>

      <span className={styles.beanA} />
      <span className={styles.beanB} />
      <span className={styles.beanC} />
    </div>
  )
}
