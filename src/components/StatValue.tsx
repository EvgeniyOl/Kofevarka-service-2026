import { useEffect, useRef, useState } from 'react'

interface StatValueProps {
  value: number
  suffix: string
}

/**
 * Число, которое «набегает» при попадании в кадр.
 * Живёт отдельным файлом: react-refresh требует, чтобы файл страницы
 * экспортировал только компоненты страницы, без лишних сущностей.
 */
export function StatValue({ value, suffix }: StatValueProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [shown, setShown] = useState(0)
  const isFloat = !Number.isInteger(value)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()

        const started = performance.now()
        const duration = 1100
        const tick = (now: number) => {
          const progress = Math.min(1, (now - started) / duration)
          setShown(value * (1 - (1 - progress) ** 3))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <span ref={ref}>
      {isFloat ? shown.toFixed(1) : Math.round(shown)}
      {suffix}
    </span>
  )
}
