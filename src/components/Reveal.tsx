import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import styles from './Reveal.module.css'

interface RevealProps {
  children: ReactNode
  /** Задержка появления в миллисекундах — для «лесенки» в сетках */
  delay?: number
  className?: string
}

/**
 * Плавное появление блока при попадании в вьюпорт.
 * Реализовано на IntersectionObserver: без библиотек и без подписки на scroll,
 * поэтому не мешает анимациям и не вызывает перерисовок.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Если IntersectionObserver недоступен (старый браузер, SSR-прогон),
  // контент показываем сразу — без setState внутри эффекта.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    /*
     * Порог 0.12 годится для широких экранов, но на телефоне блок бывает выше
     * области просмотра — тогда 12 % его площади в кадр не попадает никогда,
     * и содержимое остаётся невидимым, занимая место пустотой. Поэтому
     * на узком экране показываем блок, как только он задел край окна.
     */
    const narrow = window.matchMedia('(max-width: 768px)').matches

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      narrow ? { threshold: 0 } : { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {}

  return (
    <div
      ref={ref}
      className={cx(styles.reveal, visible && styles.visible, className)}
      style={style}
    >
      {children}
    </div>
  )
}
