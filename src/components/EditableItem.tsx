import { observer } from 'mobx-react-lite'
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useStore } from '../stores/context'
import type { ListedItem } from '../stores/ItemsStore'
import type { ListConfig } from '../data/lists'
import { IMAGE_MAX_WIDTH, MAX_IMAGE_BYTES } from '../data/images'
import { useConfirmDelete } from '../hooks/useConfirmDelete'
import { formatBytes, processImage } from '../utils/imageFile'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './EditableItem.module.css'

interface ItemFormProps {
  config: ListConfig
  initial: Record<string, string>
  onSubmit: (values: Record<string, string>) => Promise<boolean>
  onCancel: () => void
  submitLabel: string
}

/**
 * Форма элемента списка. Поля берутся из описания списка, поэтому одна форма
 * обслуживает и цены, и вопросы с ответами, и отзывы: она же открывается
 * при добавлении, только с пустыми значениями.
 */
export const ItemForm = observer(function ItemForm({
  config,
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: ItemFormProps) {
  const { items } = useStore()
  const [values, setValues] = useState<Record<string, string>>(initial)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const set = (field: string, value: string) =>
    setValues((previous) => ({ ...previous, [field]: value }))

  /**
   * Файл превращаем в data URL прямо в браузере: на Vercel файловая система
   * только для чтения, положить картинку на диск нельзя — она едет в базу
   * вместе с элементом списка.
   */
  const pickFile = async (event: ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0]
    // Сбрасываем поле, иначе повторный выбор того же файла не сработает
    event.target.value = ''
    if (!file) return

    setFileError(null)
    setUploading(true)

    try {
      const processed = await processImage(file, IMAGE_MAX_WIDTH)

      if (processed.bytes > MAX_IMAGE_BYTES) {
        setFileError(
          `После сжатия картинка весит ${formatBytes(processed.bytes)} — это больше предела ${formatBytes(MAX_IMAGE_BYTES)}. Возьмите файл проще или меньше размером.`,
        )
        return
      }

      set(field, processed.dataUrl)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Не удалось обработать файл')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit(values)
  }

  return (
    <form className={cx(ui.card, styles.form)} onSubmit={submit}>
      <div className={styles.fields}>
        {config.fields.map((field, index) => (
          <label key={field.field} className={styles.field}>
            <span className={styles.label}>{field.label}</span>

            {field.image ? (
              (() => {
                const isUploaded = (values[field.field] ?? '').startsWith('data:')

                return (
                  <>
                    {values[field.field] ? (
                      <span className={styles.preview}>
                        <img
                          className={styles.previewImage}
                          src={values[field.field]}
                          alt=""
                          loading="lazy"
                        />
                      </span>
                    ) : null}

                    {/*
                  Загруженную картинку в поле не показываем: это длинная
                  data-строка, в ней ничего не прочитать. Вместо неё — подпись,
                  а поменять или убрать картинку можно кнопками ниже.
                */}
                    {isUploaded ? (
                      <span className={styles.hint}>Загруженная картинка</span>
                    ) : (
                      <input
                        className={ui.input}
                        value={values[field.field] ?? ''}
                        maxLength={field.max}
                        placeholder="/photos/machine-modern.jpg"
                        onChange={(event) => set(field.field, event.target.value)}
                      />
                    )}

                    <span className={styles.upload}>
                      <button
                        className={cx(ui.btn, ui.btnGhost)}
                        type="button"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        {uploading
                          ? 'Обрабатываем…'
                          : values[field.field]
                            ? 'Заменить фотографию'
                            : 'Загрузить фотографию'}
                      </button>

                      {values[field.field] ? (
                        <button
                          className={cx(ui.btn, ui.btnGhost)}
                          type="button"
                          onClick={() => {
                            set(field.field, '')
                            setFileError(null)
                          }}
                        >
                          Убрать
                        </button>
                      ) : null}
                    </span>

                    <input
                      ref={fileRef}
                      className={styles.fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(event) => void pickFile(event, field.field)}
                    />
                  </>
                )
              })()
            ) : field.multiline ? (
              <textarea
                className={cx(ui.input, styles.textarea)}
                value={values[field.field] ?? ''}
                maxLength={field.max}
                onChange={(event) => set(field.field, event.target.value)}
              />
            ) : (
              <input
                className={ui.input}
                value={values[field.field] ?? ''}
                maxLength={field.max}
                autoFocus={index === 0}
                onChange={(event) => set(field.field, event.target.value)}
              />
            )}

            {field.hint ? <span className={styles.hint}>{field.hint}</span> : null}
            {field.image && fileError ? (
              <span className={styles.error} role="alert">
                {fileError}
              </span>
            ) : null}
          </label>
        ))}
      </div>

      {items.error ? (
        <p className={styles.error} role="alert">
          {items.error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button className={ui.btn} type="submit" disabled={items.busy}>
          {items.busy ? 'Сохраняем…' : submitLabel}
        </button>
        <button className={cx(ui.btn, ui.btnGhost)} type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
})

interface EditableItemProps {
  config: ListConfig
  item: ListedItem
  /** Обёртка вокруг готового вида: появление, семантичный тег списка */
  wrapper?: (children: ReactNode) => ReactNode
  children: ReactNode
}

/**
 * Один элемент списка с правкой на месте.
 *
 * Посетитель видит обычную карточку. Админу при наведении показываются
 * «Изменить» и «Удалить»: элемент превращается в форму, а после сохранения
 * возвращается обновлённым. Удаление просит подтверждения вторым нажатием.
 */
export const EditableItem = observer(function EditableItem({
  config,
  item,
  wrapper,
  children,
}: EditableItemProps) {
  const { items, auth } = useStore()
  const [editing, setEditing] = useState(false)

  const remove = async () => {
    if (item.id !== null) await items.remove(item.id)
  }

  const { armed, request, setCard, disarm } = useConfirmDelete(remove)

  const save = async (values: Record<string, string>): Promise<boolean> => {
    if (item.id === null) return false
    const ok = await items.update(item.id, values)
    if (ok) setEditing(false)
    return ok
  }

  if (editing) {
    return (
      <ItemForm
        config={config}
        initial={item.fields}
        onSubmit={save}
        onCancel={() => setEditing(false)}
        submitLabel="Сохранить"
      />
    )
  }

  const canEdit = auth.isAdmin && item.id !== null

  const body = (
    <div className={styles.item} ref={canEdit ? setCard : undefined}>
      {canEdit ? (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              items.clearError()
              disarm()
              setEditing(true)
            }}
          >
            Изменить
          </button>
          <button
            type="button"
            className={cx(styles.action, styles.actionDanger)}
            onClick={request}
          >
            {armed ? 'Точно удалить?' : 'Удалить'}
          </button>
        </div>
      ) : null}

      {children}
    </div>
  )

  return wrapper ? <>{wrapper(body)}</> : body
})
