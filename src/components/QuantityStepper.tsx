import styles from './QuantityStepper.module.css'

interface QuantityStepperProps {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  min?: number
  max?: number
  compact?: boolean
}

/** Переключатель количества: минус, число, плюс */
export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 1,
  max = 20,
  compact = false,
}: QuantityStepperProps) {
  return (
    <div className={compact ? `${styles.stepper} ${styles.compact}` : styles.stepper}>
      <button
        type="button"
        className={styles.button}
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <span className={styles.value} key={value}>
        {value}
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={onIncrement}
        disabled={value >= max}
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  )
}
