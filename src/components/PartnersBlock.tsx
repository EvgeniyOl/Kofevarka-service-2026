import { observer } from 'mobx-react-lite'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { emptyPartner, MAX_LOGO_BYTES, LOGO_MAX_WIDTH, type PartnerInput } from '../data/partners'
import { useStore } from '../stores/context'
import type { Partner } from '../api/client'
import { formatBytes, processImage } from '../utils/imageFile'
import { Reveal } from './Reveal'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './PartnersBlock.module.css'

interface PartnersFormProps {
  /** Что правим: существующего партнёра или нового */
  initial: PartnerInput
  onSubmit: (values: PartnerInput) => Promise<boolean>
  onCancel: () => void
  submitLabel: string
}

/**
 * Форма партнёра: название, подпись и логотип.
 * Одна для добавления и правки — отличаются только подпись кнопки и значения.
 */
const PartnerForm = observer(function PartnerForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: PartnersFormProps) {
  const { partners } = useStore()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [values, setValues] = useState<PartnerInput>(initial)
  const [uploading, setUploading] = useState(false)
  /** Что показать про загруженный файл: размер после сжатия */
  const [fileNote, setFileNote] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const set = <K extends keyof PartnerInput>(field: K, value: PartnerInput[K]) =>
    setValues((previous) => ({ ...previous, [field]: value }))

  /** Файл превращаем в data URL прямо в браузере: на сервере хранить негде */
  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Сбрасываем поле, иначе повторный выбор того же файла не сработает
    event.target.value = ''
    if (!file) return

    setFileError(null)
    setFileNote(null)
    setUploading(true)

    try {
      const processed = await processImage(file, LOGO_MAX_WIDTH)

      if (processed.bytes > MAX_LOGO_BYTES) {
        setFileError(
          `После сжатия логотип весит ${formatBytes(processed.bytes)} — это больше предела ${formatBytes(MAX_LOGO_BYTES)}. Возьмите картинку проще или меньше размером.`,
        )
        return
      }

      set('logo', processed.dataUrl)
      setFileNote(
        `Загружено: ${processed.width}×${processed.height}, ${formatBytes(processed.bytes)}`,
      )
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
        <label className={styles.field}>
          <span className={styles.label}>Название</span>
          <input
            className={ui.input}
            value={values.name}
            maxLength={120}
            autoFocus
            placeholder="Например: Santino"
            onChange={(event) => set('name', event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Краткое описание</span>
          <textarea
            className={cx(ui.input, styles.textarea)}
            value={values.note}
            maxLength={300}
            placeholder="Чем партнёр полезен клиенту"
            onChange={(event) => set('note', event.target.value)}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Логотип</span>

          {values.logo ? (
            <div className={styles.preview}>
              <img className={styles.previewImage} src={values.logo} alt="" />
            </div>
          ) : null}

          <div className={styles.upload}>
            <button
              className={cx(ui.btn, ui.btnGhost)}
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Обрабатываем…' : values.logo ? 'Заменить логотип' : 'Загрузить логотип'}
            </button>

            {values.logo ? (
              <button
                className={cx(ui.btn, ui.btnGhost)}
                type="button"
                onClick={() => {
                  set('logo', '')
                  setFileNote(null)
                  setFileError(null)
                }}
              >
                Убрать
              </button>
            ) : null}
          </div>

          <input
            ref={fileRef}
            className={styles.fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => void pickFile(event)}
          />

          <span className={styles.hint}>
            PNG, JPG или WebP. Картинка сжимается до {LOGO_MAX_WIDTH} px по ширине, прозрачность
            сохраняется.
          </span>
          {fileNote ? <span className={styles.hint}>{fileNote}</span> : null}
          {fileError ? <span className={styles.error}>{fileError}</span> : null}
        </div>
      </div>

      {partners.error ? (
        <p className={styles.error} role="alert">
          {partners.error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button className={ui.btn} type="submit" disabled={partners.busy || uploading}>
          {partners.busy ? 'Сохраняем…' : submitLabel}
        </button>
        <button className={cx(ui.btn, ui.btnGhost)} type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
})

/** Карточка партнёра в обычном виде: логотип на подложке, название, подпись */
const PartnerCardView = observer(function PartnerCardView({ partner }: { partner: Partner }) {
  return (
    <>
      <div className={styles.logoBox}>
        {partner.logo ? (
          <img className={styles.logo} src={partner.logo} alt={partner.name} loading="lazy" />
        ) : (
          <span className={styles.logoEmpty}>Логотип не загружен</span>
        )}
      </div>
      <h3 className={styles.name}>{partner.name}</h3>
      {partner.note ? <p className={styles.note}>{partner.note}</p> : null}
    </>
  )
})

/**
 * Карточка партнёра. Админ правит и удаляет её прямо здесь: кнопки
 * появляются при наведении, форма открывается на месте карточки.
 */
export const PartnerCard = observer(function PartnerCard({
  partner,
  delay = 0,
}: {
  partner: Partner
  delay?: number
}) {
  const { partners, auth } = useStore()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const canEdit = auth.isAdmin

  const save = async (values: PartnerInput): Promise<boolean> => {
    const ok = await partners.update(partner.id, values)
    if (ok) setEditing(false)
    return ok
  }

  const remove = async () => {
    // Удаляем со второго нажатия: случайный клик не должен сносить партнёра
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await partners.remove(partner.id)
  }

  // В режиме правки форму возвращаем без обёртки появления: она растягивает
  // содержимое по высоте строки сетки и поднимала бы соседние карточки
  if (editing) {
    return (
      <PartnerForm
        initial={{ name: partner.name, note: partner.note, logo: partner.logo }}
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
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                partners.clearError()
                setConfirmDelete(false)
                setEditing(true)
              }}
            >
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

        <PartnerCardView partner={partner} />
      </article>
    </Reveal>
  )
})

/** Плитка добавления: показывается только админу */
export const AddPartnerCard = observer(function AddPartnerCard() {
  const { partners, auth } = useStore()
  const [adding, setAdding] = useState(false)

  if (!auth.isAdmin) return null

  if (adding) {
    return (
      <PartnerForm
        initial={emptyPartner()}
        onSubmit={async (values) => {
          const ok = await partners.add(values)
          if (ok) setAdding(false)
          return ok
        }}
        onCancel={() => setAdding(false)}
        submitLabel="Добавить партнёра"
      />
    )
  }

  return (
    <button
      type="button"
      className={styles.addCard}
      onClick={() => {
        partners.clearError()
        setAdding(true)
      }}
    >
      <span className={styles.addIcon} aria-hidden="true">
        +
      </span>
      <span className={styles.addText}>Добавить партнёра</span>
    </button>
  )
})

/**
 * Блок партнёров целиком: сетка карточек и плитка добавления.
 * Показывается на странице «О нас».
 */
export const PartnersBlock = observer(function PartnersBlock() {
  const { partners } = useStore()

  // Пока список грузится, ничего не показываем: иначе блок мигает пустотой
  if (partners.loading) return null

  return (
    <div className={styles.grid}>
      {partners.partners.map((partner, index) => (
        <PartnerCard key={partner.id} partner={partner} delay={index * 70} />
      ))}
      <AddPartnerCard />
    </div>
  )
})
