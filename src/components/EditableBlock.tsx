import { observer } from 'mobx-react-lite'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useStore } from '../stores/context'
import type { BlockDefaults } from '../stores/ContentStore'
import type { EditableBlock as EditableBlockConfig } from '../data/editableBlocks'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './EditableBlock.module.css'

/** Значения полей формы */
type FormValues = Record<keyof BlockDefaults, string>

const toFormValues = (values: BlockDefaults): FormValues => ({
  title: values.title,
  lead: values.lead,
  actionOne: values.actionOne,
  actionTwo: values.actionTwo,
})

interface EditableBlockProps {
  /** Описание блока: ключ, тексты по умолчанию и поля формы */
  config: EditableBlockConfig
  /**
   * Как показать блок в обычном режиме. Функция получает актуальные тексты,
   * поэтому страница рисует свою разметку и не думает про редактирование.
   */
  children: (values: BlockDefaults) => ReactNode
}

/**
 * Блок, который админ правит прямо на странице.
 *
 * Посетитель видит обычный блок. Админу при наведении показывается кнопка
 * «Изменить»: блок превращается в форму с теми же полями, а после сохранения
 * тексты обновляются тут же, без перезагрузки.
 *
 * Так правка не оторвана от результата: админ видит её в том окружении,
 * в котором её увидят люди, и не переключается на отдельную вкладку.
 */
export const EditableBlock = observer(function EditableBlock({
  config,
  children,
}: EditableBlockProps) {
  const { content, auth } = useStore()

  // Текущие тексты: сохранённые в базе поверх значений из кода
  const values = content.block(config.key, config.defaults)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormValues>(() => toFormValues(values))

  // Править может только админ: остальным кнопки не показываем
  const canEdit = auth.isAdmin

  const startEditing = () => {
    // Берём актуальные значения: их могли изменить в другой вкладке
    setForm(toFormValues(values))
    setEditing(true)
    content.clearError()
  }

  const set = (field: keyof FormValues, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (await content.save(config.key, form)) setEditing(false)
  }

  // Обычный режим: посетитель видит блок как есть
  if (!editing) {
    return (
      <div className={styles.wrap}>
        {canEdit ? (
          <div className={styles.toolbar}>
            <button type="button" className={styles.action} onClick={startEditing}>
              Изменить
            </button>
          </div>
        ) : null}

        {children(values)}
      </div>
    )
  }

  // Режим правки: блок превращается в форму с теми же полями
  return (
    <form className={cx(styles.wrap, styles.editing)} onSubmit={submit}>
      {config.fields.map((field) => (
        <label key={field.field} className={styles.field}>
          <span className={styles.label}>{field.label}</span>
          {field.multiline ? (
            <textarea
              className={cx(ui.input, styles.textarea)}
              value={form[field.field]}
              maxLength={field.max}
              onChange={(event) => set(field.field, event.target.value)}
            />
          ) : (
            <input
              className={ui.input}
              value={form[field.field]}
              maxLength={field.max}
              autoFocus={field.field === 'title'}
              onChange={(event) => set(field.field, event.target.value)}
            />
          )}
          {field.hint ? <span className={styles.hint}>{field.hint}</span> : null}
        </label>
      ))}

      {content.error ? (
        <p className={styles.error} role="alert">
          {content.error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button className={ui.btn} type="submit">
          Сохранить
        </button>
        <button className={cx(ui.btn, ui.btnGhost)} type="button" onClick={() => setEditing(false)}>
          Отмена
        </button>
      </div>
    </form>
  )
})
