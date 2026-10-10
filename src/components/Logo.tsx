import { useId } from 'react'
import { cx } from '../utils/cx'
import styles from './Logo.module.css'

interface LogoProps {
  /** Сторона значка в пикселях (по умолчанию — крупный вариант из шапки) */
  size?: number
  /** Подпись для скринридеров */
  label?: string
  className?: string
}

/** Звезда считается по точкам — так она ровная и её легко переиспользовать */
const starPath = (centerX: number, centerY: number, outer: number): string => {
  const inner = outer * 0.44
  const points: string[] = []

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner
    const angle = (Math.PI / 5) * index - Math.PI / 2
    points.push(
      `${(centerX + radius * Math.cos(angle)).toFixed(2)} ${(centerY + radius * Math.sin(angle)).toFixed(2)}`,
    )
  }

  return `M ${points.join(' L ')} Z`
}

const PAPER = '#f6ede2'
const INK = '#232936'
/** Цвет внешнего кольца: чистый белый, чтобы обод не выглядел серым */
const RIM = '#ffffff'

/**
 * Знак Kofevarka Service: круглый штамп с надписями по дугам, звёздами
 * и белой плашкой в центре. Векторный, поэтому одинаково чёткий в шапке
 * (88 px) и на печати. Анимация — в Logo.module.css.
 */
export function Logo({ size = 88, label = 'Kofevarka Service', className }: LogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const discId = `kofevarka-disc-${uid}`
  const sheenId = `kofevarka-sheen-${uid}`
  const arcTopId = `kofevarka-arc-top-${uid}`
  const arcBottomId = `kofevarka-arc-bottom-${uid}`

  return (
    <svg
      className={cx(styles.logo, className)}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={discId} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#2b3140" />
          <stop offset="100%" stopColor="#191d26" />
        </linearGradient>
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(224, 164, 94, 0)" />
          <stop offset="50%" stopColor="rgba(224, 164, 94, 0.95)" />
          <stop offset="100%" stopColor="rgba(224, 164, 94, 0)" />
        </linearGradient>
        {/* Дуги для надписей. Обе длиннее полуокружности — так Chrome рисует
            их стабильно, без обрезки текста по краям. Верхняя дуга (r=86)
            идёт по центру полосы между ободом и внутренним кольцом: буквы
            не липнут ни к ободу, ни к плашке. Нижняя (r=77, sweep=0) —
            её зеркальный аналог с буквами наружу. */}
        <path id={arcTopId} d="M 22,100 A 78,78 0 0 1 178,100" fill="none" />
        <path id={arcBottomId} d="M 24,100 A 76,76 0 0 0 176,100" fill="none" />
      </defs>

      <g className={styles.badge}>
        <circle cx="100" cy="100" r="97" fill={`url(#${discId})`} />
        {/* Внешнее кольцо — белое, без прозрачности, поэтому читается чётко */}
        <circle
          className={styles.rim}
          cx="100"
          cy="100"
          r="95.5"
          fill="none"
          stroke={RIM}
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="100"
          r="67.5"
          fill="none"
          stroke={PAPER}
          strokeOpacity="0.12"
          strokeWidth="1"
        />

        {/* Блик, обегающий обод: лежит ровно на ободе (радиус 95.5, как у
            кремового кольца) — иначе цепляет надписи по дугам */}
        <g className={styles.sheen}>
          <path
            d="M 10.3,152.3 A 95.5,95.5 0 0 0 43.9,177.2"
            fill="none"
            stroke={`url(#${sheenId})`}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </g>

        {/* Обе надписи стоят на границе внутреннего кольца: «KOFEVARKA»
            касается его снизу (внутренний край букв на радиусе кольца),
            «SERVICE» — сверху, буквами наружу. Сдвиги подобраны так, чтобы
            между строками остался воздух. */}
        <text
          className={styles.text}
          fontSize="18"
          letterSpacing="0.2"
          transform="translate(0 25.7)"
        >
          <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
            KOFEVARKA
          </textPath>
        </text>
        <text
          className={styles.text}
          fontSize="18"
          letterSpacing="0.4"
          transform="translate(0 1.9)"
        >
          <textPath href={`#${arcBottomId}`} startOffset="50%" textAnchor="middle">
            SERVICE
          </textPath>
        </text>

        {/* Звёзды: стоят в полосе, что и надписи. При мерцании раздуваются
            на 12%, поэтому центр отодвинут от обода, а радиус взят с запасом */}
        <path className={styles.star} d={starPath(21, 100, 9.5)} fill={PAPER} />
        <path
          className={cx(styles.star, styles.starLate)}
          d={starPath(179, 100, 9.5)}
          fill={PAPER}
        />

        {/* Центральный знак: планка, шток с головкой и два блока.
            Плашка компактная (62×72) — иначе надписи по дугам упираются в неё */}
        <g className={styles.plate}>
          <rect x="69" y="64" width="62" height="72" rx="11" fill={PAPER} />
          <rect x="74" y="70" width="52" height="7" rx="3.5" fill={INK} />
          <rect x="94" y="81" width="12" height="32" rx="6" fill={INK} />
          <circle cx="100" cy="88" r="8" fill={PAPER} stroke={INK} strokeWidth="4" />
          <rect x="74" y="108" width="23" height="24" rx="7" fill={INK} />
          <rect x="103" y="108" width="23" height="24" rx="7" fill={INK} />
        </g>
      </g>
    </svg>
  )
}
