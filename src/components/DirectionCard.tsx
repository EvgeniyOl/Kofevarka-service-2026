import { observer } from 'mobx-react-lite'
import { useState, type FormEvent } from 'react'
import { MAX_DIRECTIONS, emptyDirection, type DirectionInput } from '../data/directions'
import { useStore } from '../stores/context'
import type { Direction } from '../api/client'
import { Reveal } from './Reveal'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './DirectionCard.module.css'

/** Пункты в форме вводим построчно: одна строка — один пункт */
const pointsToText = (points: string[]): string => points.join('\n')
const textToPoints = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

interface DirectionFormProps {
  /** Что правим: существующую карточку или новую */
  initial: DirectionInput
  /** Куда отдать результат: сохранение делает вызывающий */
  onSubmit: (values: DirectionInput) => Promise<boolean>
  onCancel: () => void
  submitLabel: string
}

/**
 * Форма карточки. Одна для добавления и правки: поля те же, отличается
 * только подпись кнопки.
 */
const DirectionForm = observer(function DirectionForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: DirectionFormProps) {
  const { directions } = useStore()
  const [values, setValues] = useState<DirectionInput>(initial)
  const [pointsText, setPointsText] = useState(() => pointsToText(initial.points))

  const set = <K extends keyof DirectionInput>(field: K, value: DirectionInput[K]) =>
    setValues((previous) => ({ ...previous, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit({ ...values, points: textToPoints(pointsText) })
  }

  return (
    <form className={cx(ui.card, styles.form, styles.editing)} onSubmit={submit}>
      <div className={styles.formFields}>
        <label className={styles.field}>
          <span className={styles.label}>Иконка</span>
          <input
            className={cx(ui.input, styles.iconInput)}
            value={values.icon}
            maxLength={8}
            placeholder="🔧"
            onChange={(event) => set('icon', event.target.value)}
          />
          <span className={styles.hint}>Один значок — можно скопировать из набора эмодзи</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Заголовок</span>
          <input
            className={ui.input}
            value={values.title}
            maxLength={120}
            autoFocus
            placeholder="Например: Ремонт кофемолок"
            onChange={(event) => set('title', event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea
            className={cx(ui.input, styles.textarea)}
            value={values.text}
            maxLength={400}
            placeholder="Что делаем в этом направлении"
            onChange={(event) => set('text', event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пункты списка</span>
          <textarea
            className={cx(ui.input, styles.pointsArea)}
            value={pointsText}
            placeholder={'каждый пункт с новой строки\nнапример: замена жерновов'}
            onChange={(event) => setPointsText(event.target.value)}
          />
          <span className={styles.hint}>Каждый пункт с новой строки, до 8 пунктов</span>
        </label>
      </div>

      {directions.error ? (
        <p className={styles.error} role="alert">
          {directions.error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button className={ui.btn} type="submit" disabled={directions.busy}>
          {directions.busy ? 'Сохраняем…' : submitLabel}
        </button>
        <button className={cx(ui.btn, ui.btnGhost)} type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
})

/** Карточка в обычном виде: иконка, заголовок, описание и пункты */
const DirectionView = observer(function DirectionView({ direction }: { direction: Direction }) {
  return (
    <>
      {direction.icon ? (
        <span className={styles.icon} aria-hidden="true">
          {direction.icon}
        </span>
      ) : null}
      <h3 className={styles.title}>{direction.title}</h3>
      {direction.text ? <p className={styles.text}>{direction.text}</p> : null}
      {direction.points.length ? (
        <ul className={styles.points}>
          {direction.points.map((point) => (
            <li key={point} className={styles.point}>
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
})

interface DirectionCardProps {
  direction: Direction
  /** Задержка появления — для «лесенки» в сетке */
  delay?: number
}

/**
 * Карточка направления. Админ правит и удаляет её прямо здесь: кнопки
 * появляются при наведении, форма открывается на месте карточки.
 */
export const DirectionCard = observer(function DirectionCard({
  direction,
  delay = 0,
}: DirectionCardProps) {
  const { directions, auth } = useStore()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const canEdit = auth.isAdmin

  const startEditing = () => {
    directions.clearError()
    setConfirmDelete(false)
    setEditing(true)
  }

  const save = async (values: DirectionInput): Promise<boolean> => {
    const ok = await directions.update(direction.id, values)
    if (ok) setEditing(false)
    return ok
  }

  const remove = async () => {
    // Удаляем со второго нажатия: случайный клик не должен сносить карточку
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await directions.remove(direction.id)
  }

  /*
   * В режиме правки возвращаем форму напрямую, без обёртки появления:
   * обёртка растягивает содержимое по высоте строки сетки, и форма
   * становилась бы высокой, растягивая соседние карточки.
   */
  if (editing) {
    return (
      <DirectionForm
        initial={{
          icon: direction.icon,
          title: direction.title,
          text: direction.text,
          points: direction.points,
        }}
        onSubmit={save}
        onCancel={() => setEditing(false)}
        submitLabel="Сохранить"
      />
    )
  }

  return (
    <Reveal className={styles.wrap} delay={delay}>
      <article className={cx(ui.card, styles.card)}>
        {canEdit ? (
          <div className={styles.toolbar}>
            <button type="button" className={styles.action} onClick={startEditing}>
              Изменить
            </button>
            <button
              type="button"
              className={cx(styles.action, styles.actionDanger)}
              onClick={() => void remove()}
              onBlur={() => setConfirmDelete(false)}
            >
              {confirmDelete ? 'Точно удалить?' : 'Удалить'}
            </button>
          </div>
        ) : null}

        <DirectionView direction={direction} />
      </article>
    </Reveal>
  )
})

/**
 * Сетка карточек с кнопкой добавления. Показывается только админу и только
 * если карточек меньше предела: иначе добавлять нечего.
 */
export const AddDirectionCard = observer(function AddDirectionCard() {
  const { directions, auth } = useStore()
  const [adding, setAdding] = useState(false)

  if (!auth.isAdmin || !directions.canAdd) return null

  if (adding) {
    return (
      <DirectionForm
        initial={emptyDirection()}
        onSubmit={async (values) => {
          const ok = await directions.add(values)
          if (ok) setAdding(false)
          return ok
        }}
        onCancel={() => setAdding(false)}
        submitLabel="Добавить карточку"
      />
    )
  }

  return (
    <button
      type="button"
      className={styles.addCard}
      onClick={() => {
        directions.clearError()
        setAdding(true)
      }}
    >
      <span className={styles.addIcon} aria-hidden="true">
        +
      </span>
      <span className={styles.addText}>Добавить карточку</span>
    </button>
  )
})

/** Подпись о пределе: видно, сколько карточек уже занято */
export const DirectionsLimit = observer(function DirectionsLimit() {
  const { directions, auth } = useStore()

  if (!auth.isAdmin || !directions.limitReached) return null

  return (
    <p className={styles.limit}>
      Достигнут предел: {MAX_DIRECTIONS} карточек. Чтобы добавить новую, удалите одну из
      существующих.
    </p>
  )
})
