import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './SectionHeading.module.css'

interface SectionHeadingProps {
  kicker?: string
  title: string
  lead?: string
  align?: 'left' | 'center'
  className?: string
}

/** Единый заголовок секции: надзаголовок, крупный титул и подводка */
export function SectionHeading({
  kicker,
  title,
  lead,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <header className={cx(styles.head, align === 'center' && styles.center, className)}>
      {kicker ? <span className={ui.eyebrow}>{kicker}</span> : null}
      <h2 className={cx(ui.title, styles.title)}>{title}</h2>
      {lead ? <p className={ui.lead}>{lead}</p> : null}
    </header>
  )
}
