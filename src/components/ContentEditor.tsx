import { observer } from 'mobx-react-lite'
import { useState, type FormEvent } from 'react'
import { EDITABLE_BLOCKS, type EditableBlock } from '../data/editableBlocks'
import { useStore } from '../stores/context'
import type { BlockDefaults } from '../stores/ContentStore'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ContentEditor.module.css'

/** Значения полей формы блока */
type FormValues = Record<keyof BlockDefaults, string>

const toFormValues = (values: BlockDefaults): FormValues => ({
  title: values.title,
  lead: values.lead,
  actionOne: values.actionOne,
  actionTwo: values.actionTwo,
})

/**
 * Форма одного блока. Отдельный компонент, потому что состояние полей
 * своё у каждого блока: так правка одного не задевает остальные.
 */
const BlockForm = observer(function BlockForm({ block }: { block: EditableBlock }) {
  const { content } = useStore()
  const saved = content.savedFor(block.key)

  // Текущие тексты: сохранённые поверх значений из кода
  const current = content.block(block.key, block.defaults)
  const [values, setValues] = useState<FormValues>(() => toFormValues(current))
  const [savedNow, setSavedNow] = useState(false)

  const isChanged = Boolean(saved)
  const isDirty =
    values.title !== current.title ||
    values.lead !== current.lead ||
    values.actionOne !== current.actionOne ||
    values.actionTwo !== current.actionTwo

  const set = (field: keyof FormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    setSavedNow(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await content.save(block.key, values)
    setSavedNow(ok)
  }

  /** Возврат к текстам из кода: пустые значения сервер удаляет */
  const reset = async () => {
    setValues(toFormValues(block.defaults))
    const ok = await content.save(block.key, {})
    setSavedNow(ok)
  }

  return (
    <form className={cx(ui.card, styles.block)} onSubmit={submit}>
      <div className={styles.head}>
        <span className={styles.name}>{block.name}</span>
        <span className={styles.where}>{block.where}</span>
        {isChanged ? <span className={styles.changed}>изменён</span> : null}
      </div>

      <div className={styles.fields}>
        {block.fields.map((field) => (
          <label key={field.field} className={styles.field}>
            <span className={styles.label}>{field.label}</span>
            {field.multiline ? (
              <textarea
                className={cx(ui.input, styles.textarea)}
                value={values[field.field]}
                maxLength={field.max}
                onChange={(event) => set(field.field, event.target.value)}
              />
            ) : (
              <input
                className={ui.input}
                value={values[field.field]}
                maxLength={field.max}
                onChange={(event) => set(field.field, event.target.value)}
              />
            )}
            {field.hint ? <span className={styles.hint}>{field.hint}</span> : null}
          </label>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={ui.btn} type="submit" disabled={!isDirty}>
          Сохранить
        </button>
        {isChanged ? (
          <button className={cx(ui.btn, ui.btnGhost)} type="button" onClick={() => void reset()}>
            Вернуть исходный текст
          </button>
        ) : null}
        {savedNow && !isDirty ? <span className={styles.saved}>Сохранено</span> : null}
      </div>
    </form>
  )
})

/**
 * Редактор текстов: по форме на каждый блок из справочника.
 * Новый блок достаточно добавить в EDITABLE_BLOCKS — форма появится сама.
 */
export const ContentEditor = observer(function ContentEditor() {
  const { content } = useStore()

  return (
    <div className={styles.list}>
      {content.error ? (
        <p className={styles.error} role="alert">
          {content.error}
        </p>
      ) : null}

      {EDITABLE_BLOCKS.map((block) => (
        <BlockForm key={block.key} block={block} />
      ))}
    </div>
  )
})
