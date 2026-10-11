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
 * Раньше знак рисовался SVG — так он оставался чётким на печати, но не
 * совпадал с фирменным логотипом заказчика. Теперь используется готовая
 * картинка: public/logo.png — обрезанная по кругу фотография знака
 * с прозрачным фоном, 480 × 480. Анимации появления и наведения — в CSS.
 */
export function Logo({ size = 88, label = 'Kofevarka Service', className }: LogoProps) {
  return (
    <img
      className={cx(styles.logo, className)}
      src="/logo.png"
      alt={label}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      decoding="async"
    />
  )
}
