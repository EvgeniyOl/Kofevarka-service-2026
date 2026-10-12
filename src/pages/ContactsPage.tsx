import { observer } from 'mobx-react-lite'
import { EditableBlock } from '../components/EditableBlock'
import { EditableList } from '../components/EditableList'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { CONTACTS_BLOCKS } from '../data/blocks/contacts'
import { LIST_KEYS, listConfig } from '../data/lists'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ContactsPage.module.css'

/** Координаты мастерской: улица Декабристов, 116/1, Омск */
const MAP_POINT = { lat: 54.96602, lon: 73.39441, zoom: 17 }
/** Виджет Яндекса: обычная страница карт в iframe запрещена (X-Frame-Options: DENY) */
const MAP_EMBED_URL = `https://yandex.ru/map-widget/v1/?ll=${MAP_POINT.lon}%2C${MAP_POINT.lat}&z=${MAP_POINT.zoom}&pt=${MAP_POINT.lon},${MAP_POINT.lat},pm2rdm`
const MAP_PAGE_URL = `https://yandex.ru/maps/?ll=${MAP_POINT.lon}%2C${MAP_POINT.lat}&z=${MAP_POINT.zoom}&pt=${MAP_POINT.lon},${MAP_POINT.lat},pm2rdm`

/**
 * Контакты: способы связи, часы работы и форма с валидацией.
 *
 * Тексты и обе карточки-списка правит админ прямо здесь. Тексты ошибок
 * валидации остаются в коде: это технические подсказки, а не контент.
 */
export const ContactsPage = observer(function ContactsPage() {
  const { contacts } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <EditableBlock config={CONTACTS_BLOCKS.hero}>
        {(values) => (
          <SectionHeading kicker={values.kicker} title={values.title} lead={values.lead} />
        )}
      </EditableBlock>

      <EditableList config={listConfig(LIST_KEYS.contactsChannels)} className={styles.channels}>
        {(item) => (
          <Reveal>
            <article className={cx(ui.card, styles.channel)}>
              <span className={styles.channelIcon} aria-hidden="true">
                {item.fields.icon}
              </span>
              <h3 className={styles.channelTitle}>{item.fields.title}</h3>
              {item.fields.href ? (
                <a className={styles.channelValue} href={item.fields.href}>
                  {item.fields.value}
                </a>
              ) : (
                <span className={styles.channelValue}>{item.fields.value}</span>
              )}
              <p className={ui.muted}>{item.fields.hint}</p>
            </article>
          </Reveal>
        )}
      </EditableList>

      <div className={styles.layout}>
        <div className={cx(ui.card, styles.formCard)}>
          <EditableBlock config={CONTACTS_BLOCKS.form}>
            {(values) => (
              <>
                <h3 className={styles.blockTitle}>{values.title}</h3>

                {contacts.submitted ? <div className={styles.success}>{values.success}</div> : null}

                <form
                  className={styles.form}
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    void contacts.submit()
                  }}
                >
                  <div className={styles.grid2}>
                    <label className={styles.field}>
                      <span className={styles.label}>{values.labelName}</span>
                      <input
                        className={ui.input}
                        value={contacts.form.name}
                        onChange={(event) => contacts.setField('name', event.target.value)}
                        onBlur={() => contacts.touch('name')}
                        placeholder={values.placeholderName}
                      />
                      {contacts.errorFor('name') ? (
                        <span className={ui.fieldError}>{contacts.errorFor('name')}</span>
                      ) : null}
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{values.labelEmail}</span>
                      <input
                        className={ui.input}
                        type="email"
                        value={contacts.form.email}
                        onChange={(event) => contacts.setField('email', event.target.value)}
                        onBlur={() => contacts.touch('email')}
                        placeholder={values.placeholderEmail}
                      />
                      {contacts.errorFor('email') ? (
                        <span className={ui.fieldError}>{contacts.errorFor('email')}</span>
                      ) : null}
                    </label>
                  </div>

                  <label className={styles.field}>
                    <span className={styles.label}>{values.labelMessage}</span>
                    <textarea
                      className={cx(ui.input, styles.textarea)}
                      rows={5}
                      value={contacts.form.message}
                      onChange={(event) => contacts.setField('message', event.target.value)}
                      onBlur={() => contacts.touch('message')}
                      placeholder={values.placeholderMessage}
                    />
                    {contacts.errorFor('message') ? (
                      <span className={ui.fieldError}>{contacts.errorFor('message')}</span>
                    ) : null}
                  </label>

                  {contacts.serverError ? (
                    <p className={styles.formError} role="alert">
                      {contacts.serverError}
                    </p>
                  ) : null}

                  <button
                    className={ui.btn}
                    type="submit"
                    disabled={!contacts.isValid || contacts.sending}
                  >
                    {contacts.sending ? values.sending : values.submit}
                  </button>
                </form>
              </>
            )}
          </EditableBlock>
        </div>

        <div className={styles.side}>
          <Reveal>
            <div className={cx(ui.card, styles.mapCard)}>
              <EditableBlock config={CONTACTS_BLOCKS.map}>
                {(values) => (
                  <>
                    {/* Карту грузим сразу: с loading="lazy" виджет Яндекса инициализируется
                        уже после отложенной загрузки и остаётся пустым белым блоком.
                        Под iframe — тёмная подложка, чтобы блок не выглядел пустым,
                        пока карта грузится; ссылка на Яндекс Карты идёт ниже карты,
                        поэтому сама карта остаётся кликабельной */}
                    <div className={styles.mapFrameWrap}>
                      <iframe
                        className={styles.mapFrame}
                        src={MAP_EMBED_URL}
                        title={values.frameTitle}
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <div className={styles.mapBar}>
                      <span className={styles.mapLabel}>{values.label}</span>
                      <a
                        className={styles.mapLink}
                        href={MAP_PAGE_URL}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {values.link}
                      </a>
                    </div>
                  </>
                )}
              </EditableBlock>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className={cx(ui.card, styles.hours)}>
              <EditableBlock config={CONTACTS_BLOCKS.hours}>
                {(values) => (
                  <>
                    <h3 className={styles.blockTitle}>{values.title}</h3>
                    <EditableList
                      config={listConfig(LIST_KEYS.contactsHours)}
                      container="ul"
                      wrapper={(node) => <li>{node}</li>}
                    >
                      {(item) => (
                        <>
                          <span>{item.fields.day}</span>
                          <span className={ui.muted}>{item.fields.time}</span>
                        </>
                      )}
                    </EditableList>
                    <p className={ui.muted}>{values.note}</p>
                  </>
                )}
              </EditableBlock>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
})
