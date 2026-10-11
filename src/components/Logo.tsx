import type { CSSProperties } from 'react'
import { cx } from '../utils/cx'
import styles from './Logo.module.css'

interface LogoProps {
  /** Сторона значка в пикселях (по умолчанию — крупный вариант из шапки) */
  size?: number
  /** Подпись для скринридеров */
  label?: string
  className?: string
}

/**
 * Знак Kofevarka Service: круглый металлический штамп с надписями
 * «КОФЕВАРКА» и «СЕРВИС».
 *
 * Размер задаём переменной `--logo-size`, а не инлайновыми width/height:
 * так медиазапросы в стилях могут уменьшить знак на узком экране —
 * инлайновый стиль перебить нельзя.
 *
 * Картинка — public/logo.png: обрезанная по кругу фотография знака
 * с прозрачным фоном. Анимации появления и наведения — в CSS.
 */
export function Logo({ size = 88, label = 'Kofevarka Service', className }: LogoProps) {
  return (
    <img
      className={cx(styles.logo, className)}
      src="/logo.png"
      alt={label}
      width={size}
      height={size}
      style={{ '--logo-size': `${size}px` } as CSSProperties}
      decoding="async"
    />
  )
}
