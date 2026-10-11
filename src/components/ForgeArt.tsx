import { useId, type CSSProperties } from 'react'
import { cx } from '../utils/cx'
import styles from './ForgeArt.module.css'

interface ForgeArtProps {
  variant?: 'hero' | 'card'
  /**
   * Готовое изображение гнома-кузнеца. Если путь не передан, показываем
   * рисованную SVG-сцену — она остаётся запасным вариантом.
   */
  photo?: string
  className?: string
}

/** Точка удара: сюда доходит молот, отсюда летят искры */
const HIT = { x: 210, y: 234 }
const SPARK_ANGLES = [-4, -16, -28, -40, -52, -66, -82, -100, -118]
const SPARK_DISTANCES = [14, 26, 40, 54, 70, 88, 104]

interface Spark {
  id: string
  x: number
  y: number
  r: number
  dx: number
  dy: number
  delay: number
  duration: number
}

/**
 * Искры разлетаются веером от точки удара: положение считается один раз
 * при загрузке модуля, чтобы разметка не «прыгала» между рендерами.
 */
const SPARKS: Spark[] = (() => {
  const list: Spark[] = []
  let index = 0

  for (const angle of SPARK_ANGLES) {
    for (const dist of SPARK_DISTANCES) {
      const rad = (angle * Math.PI) / 180
      list.push({
        id: `spark-${index}`,
        x: Number((HIT.x + Math.cos(rad) * dist).toFixed(1)),
        y: Number((HIT.y + Math.sin(rad) * dist).toFixed(1)),
        r: 1.1 + (index % 4) * 0.9,
        dx: Number((Math.cos(rad) * (16 + dist * 0.5)).toFixed(1)),
        dy: Number((Math.sin(rad) * (18 + dist * 0.55)).toFixed(1)),
        delay: (index % 10) * 0.12,
        duration: 1.3 + (index % 3) * 0.4,
      })
      index += 1
    }
  }

  return list
})()

/**
 * Сцена мастерской: гном-кузнец бьёт молотом по детали на наковальне,
 * из-под молота летят искры. Как и остальной визуал проекта — целиком
 * SVG и CSS, без картинок и библиотек анимации.
 *
 * Если передан photo, вместо сцены показывается готовое изображение.
 */
export function ForgeArt({ variant = 'hero', photo, className }: ForgeArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ids = {
    forge: `forge-${uid}`,
    light: `forge-light-${uid}`,
    wall: `wall-${uid}`,
    floor: `floor-${uid}`,
    apron: `apron-${uid}`,
    tunic: `tunic-${uid}`,
    beard: `beard-${uid}`,
    steel: `steel-${uid}`,
    metal: `metal-${uid}`,
  }

  return (
    <div className={cx(styles.art, styles[variant], className)} aria-hidden="true">
      {photo ? (
        <img className={styles.photo} src={photo} alt="" decoding="async" />
      ) : (
        <svg className={styles.scene} viewBox="0 0 400 400">
          <defs>
            <radialGradient id={ids.forge} cx="0.5" cy="0.5">
              <stop offset="0%" stopColor="#ffd79a" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#e08a3c" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7a3d14" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={ids.light} cx="0.5" cy="0.5">
              <stop offset="0%" stopColor="#ffb85c" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ff9a3c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ids.wall} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a1d16" />
              <stop offset="100%" stopColor="#140d0a" />
            </linearGradient>
            <linearGradient id={ids.floor} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a2a1c" />
              <stop offset="100%" stopColor="#180f0a" />
            </linearGradient>
            <linearGradient id={ids.apron} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c4a2a" />
              <stop offset="100%" stopColor="#4a2a17" />
            </linearGradient>
            <linearGradient id={ids.tunic} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#43604f" />
              <stop offset="100%" stopColor="#26382f" />
            </linearGradient>
            <linearGradient id={ids.beard} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#efe4d6" />
              <stop offset="100%" stopColor="#b8a692" />
            </linearGradient>
            <linearGradient id={ids.steel} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8f99a6" />
              <stop offset="100%" stopColor="#414a55" />
            </linearGradient>
            <linearGradient id={ids.metal} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfd8e2" />
              <stop offset="100%" stopColor="#6d7885" />
            </linearGradient>
          </defs>

          {/* Цех: стена, пол, кладка */}
          <rect width="400" height="400" fill={`url(#${ids.wall})`} />
          <rect y="286" width="400" height="114" fill={`url(#${ids.floor})`} />
          <g opacity="0.5" stroke="#6b503a" strokeWidth="3">
            <path d="M0 286h400" />
            <path d="M0 330h400" />
            <path d="M60 286v114M170 286v114M300 286v114" />
            <path d="M0 100h400M0 200h400" opacity="0.35" />
          </g>

          {/* Полки с инструментом */}
          <g opacity="0.85">
            <rect x="16" y="96" width="118" height="9" rx="3" fill="#4a3324" />
            <rect x="194" y="128" width="96" height="9" rx="3" fill="#4a3324" />
            <path d="M30 96V70" stroke="#6b503a" strokeWidth="5" strokeLinecap="round" />
            <path d="M30 70l14 8-14 8z" fill="#8f99a6" />
            <path d="M56 96V64" stroke="#6b503a" strokeWidth="5" strokeLinecap="round" />
            <rect x="50" y="52" width="12" height="14" rx="2" fill="#8f99a6" />
            <path d="M86 96V72" stroke="#6b503a" strokeWidth="5" strokeLinecap="round" />
            <path d="M86 72h22" stroke="#8f99a6" strokeWidth="6" strokeLinecap="round" />
            <path d="M210 128V104" stroke="#6b503a" strokeWidth="5" strokeLinecap="round" />
            <circle cx="210" cy="100" r="7" fill="#8f99a6" />
            <path d="M244 128V108" stroke="#6b503a" strokeWidth="5" strokeLinecap="round" />
            <rect x="236" y="96" width="16" height="12" rx="2" fill="#8f99a6" />
            <path d="M274 128V112" stroke="#6b503a" strokeWidth="5" strokeLinecap="round" />
            <path d="M274 112l16 6-16 6z" fill="#8f99a6" />
          </g>

          {/* Горн: свет и жар */}
          <ellipse cx="96" cy="272" rx="86" ry="60" fill={`url(#${ids.light})`} opacity="0.8" />
          <g className={styles.forgeGlow}>
            <ellipse cx="96" cy="272" rx="52" ry="34" fill={`url(#${ids.forge})`} />
            <ellipse cx="96" cy="274" rx="26" ry="16" fill="#ffcf87" opacity="0.85" />
          </g>
          <path d="M46 292h100l12 34H34z" fill="#2c2119" />
          <path d="M58 288h76l8 8H50z" fill="#402f22" />

          {/* Бочка */}
          <g opacity="0.9">
            <rect x="322" y="222" width="58" height="82" rx="8" fill="#4c3421" />
            <rect x="322" y="240" width="58" height="6" fill="#6b503a" />
            <rect x="322" y="278" width="58" height="6" fill="#6b503a" />
            <ellipse cx="351" cy="222" rx="29" ry="8" fill="#5d4128" />
          </g>

          {/* Наковальня: компактная, рог слева, площадка под удар */}
          <ellipse cx="216" cy="342" rx="62" ry="10" fill="rgba(0, 0, 0, 0.45)" />
          <path d="M142 280l24-10h96l-12 22h-90z" fill={`url(#${ids.steel})`} />
          <path d="M166 292h84v16h-84z" fill="#2f3740" />
          <path d="M192 308h32v24h-32z" fill="#39424c" />
          <path d="M176 332h64v12h-64z" fill="#2a323a" />
          <path d="M176 332h64v4h-64z" fill="#4b5560" />

          {/* Раскалённая деталь на площадке, ровно под головкой молота */}
          <g>
            <path d="M190 234h40l8 18h-56z" fill={`url(#${ids.metal})`} />
            <ellipse cx="210" cy="234" rx="20" ry="6" fill="#eef4fb" />
            <ellipse cx="210" cy="234" rx="14" ry="4" fill="#ffd79a" opacity="0.8" />
          </g>

          {/* Гном: стоит слева, смотрит на наковальню, молот занесён */}
          <g>
            <ellipse cx="112" cy="352" rx="46" ry="9" fill="rgba(0, 0, 0, 0.45)" />
            <path d="M96 318h18v28H96zM120 318h18v28h-18z" fill="#2b2f36" />
            <path d="M88 344h30v12H88zM116 344h32v12h-32z" fill="#1e2126" />

            <g transform="rotate(6 112 290)">
              <path
                d="M88 246c0-14 12-24 26-24s26 10 26 24v52c0 10-8 18-18 18h-16c-10 0-18-8-18-18z"
                fill={`url(#${ids.tunic})`}
              />
              <path
                d="M96 268h36v46c0 6-5 10-11 10h-14c-6 0-11-4-11-10z"
                fill={`url(#${ids.apron})`}
              />
              <path
                d="M100 268v-8M128 268v-8"
                stroke="#3b2213"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <rect x="96" y="286" width="36" height="7" fill="#2f1c10" opacity="0.7" />
            </g>

            {/* Левая рука придерживает деталь */}
            <path
              d="M150 278c14 2 26-2 36-8"
              stroke="#3d5a4a"
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="188" cy="268" r="10" fill="#e8cdb2" />

            {/* Голова повёрнута к наковальне */}
            <g transform="rotate(10 118 216)">
              <circle cx="118" cy="212" r="30" fill="#f0d3b4" />
              <path
                d="M88 216c0 34 14 52 30 52s30-18 30-52c0-6-4-10-10-10H98c-6 0-10 4-10 10z"
                fill={`url(#${ids.beard})`}
              />
              <ellipse cx="126" cy="217" rx="9" ry="7" fill="#e0b48f" />
              <circle cx="112" cy="204" r="2.6" fill="#2b1d14" />
              <circle cx="132" cy="204" r="2.6" fill="#2b1d14" />
              <path
                d="M106 196c4-4 10-4 13-1M125 195c4-3 10-3 13 1"
                stroke="#e8e0d4"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M86 196c0-20 14-34 32-34s32 14 32 34c0 4-3 6-7 6H93c-4 0-7-2-7-6z"
                fill="#8c3b32"
              />
              <path
                d="M86 196c0 6 14 10 32 10s32-4 32-10c0-4-3-6-7-6H93c-4 0-7 2-7 6z"
                fill="#e9e2d6"
              />
              <circle cx="118" cy="160" r="7" fill="#e9e2d6" />
            </g>

            {/* Правая рука с молотом: кисть над деталью, головка бьёт по площадке */}
            <g className={styles.hammer}>
              <path
                d="M140 236c12-8 24-14 36-18"
                stroke="#3d5a4a"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="182" cy="214" r="11" fill="#e8cdb2" />
              <g transform="rotate(46 182 214)">
                <rect x="178" y="176" width="9" height="84" rx="4" fill="#6b503a" />
                <rect x="166" y="188" width="34" height="26" rx="3" fill={`url(#${ids.steel})`} />
                <rect x="162" y="192" width="42" height="8" fill="#aab6c4" />
              </g>
            </g>
          </g>

          {/* Искры: вспышка совпадает с моментом удара */}
          <g>
            <circle className={styles.flash} cx={HIT.x} cy={HIT.y} r="30" fill="#fff0c4" />
            <circle
              className={styles.flash}
              cx={HIT.x}
              cy={HIT.y}
              r="52"
              fill="#ffc46a"
              opacity="0.35"
            />
            {SPARKS.map((spark) => (
              <circle
                key={spark.id}
                className={styles.spark}
                cx={spark.x}
                cy={spark.y}
                r={spark.r}
                style={
                  {
                    '--dx': `${spark.dx}px`,
                    '--dy': `${spark.dy}px`,
                    animationDelay: `${spark.delay}s`,
                    animationDuration: `${spark.duration}s`,
                  } as CSSProperties
                }
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}
