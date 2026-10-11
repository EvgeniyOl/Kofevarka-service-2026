import { observer } from 'mobx-react-lite'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ContactsPage.module.css'

/** Координаты мастерской: улица Декабристов, 116/1, Омск */
const MAP_POINT = { lat: 54.96602, lon: 73.39441, zoom: 17 }
/** Виджет Яндекса: обычная страница карт в iframe запрещена (X-Frame-Options: DENY) */
const MAP_EMBED_URL = `https://yandex.ru/map-widget/v1/?ll=${MAP_POINT.lon}%2C${MAP_POINT.lat}&z=${MAP_POINT.zoom}&pt=${MAP_POINT.lon},${MAP_POINT.lat},pm2rdm`
const MAP_PAGE_URL = `https://yandex.ru/maps/?ll=${MAP_POINT.lon}%2C${MAP_POINT.lat}&z=${MAP_POINT.zoom}&pt=${MAP_POINT.lon},${MAP_POINT.lat},pm2rdm`

/** Контакты: каналы связи, часы работы и форма с валидацией */
export const ContactsPage = observer(function ContactsPage() {
  const { contacts } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Контакты"
        title="Ответит тот, кто сам чинит и варит"
        lead="Пишите и звоните по ремонту и кофе: подскажем по симптомам машины, подберём помол, соберём заказ и оставим его в мастерской на Декабристов."
      />

      <div className={styles.channels}>
        {contacts.channels.map((channel, index) => (
          <Reveal key={channel.title} delay={index * 70}>
            <article className={cx(ui.card, styles.channel)}>
              <span className={styles.channelIcon} aria-hidden="true">
                {channel.icon}
              </span>
              <h3 className={styles.channelTitle}>{channel.title}</h3>
              {channel.href ? (
                <a className={styles.channelValue} href={channel.href}>
                  {channel.value}
                </a>
              ) : (
                <span className={styles.channelValue}>{channel.value}</span>
              )}
              <p className={ui.muted}>{channel.hint}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={cx(ui.card, styles.formCard)}>
          <h3 className={styles.blockTitle}>Форма обратной связи</h3>

          {contacts.submitted ? (
            <div className={styles.success}>
              Сообщение отправлено — ответим на почту в течение рабочего дня.
            </div>
          ) : null}

          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              contacts.submit()
            }}
          >
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span className={styles.label}>Имя</span>
                <input
                  className={ui.input}
                  value={contacts.form.name}
                  onChange={(event) => contacts.setField('name', event.target.value)}
                  onBlur={() => contacts.touch('name')}
                  placeholder="Как к вам обращаться"
                />
                {contacts.errorFor('name') ? (
                  <span className={ui.fieldError}>{contacts.errorFor('name')}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Почта</span>
                <input
                  className={ui.input}
                  type="email"
                  value={contacts.form.email}
                  onChange={(event) => contacts.setField('email', event.target.value)}
                  onBlur={() => contacts.touch('email')}
                  placeholder="you@example.com"
                />
                {contacts.errorFor('email') ? (
                  <span className={ui.fieldError}>{contacts.errorFor('email')}</span>
                ) : null}
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Сообщение</span>
              <textarea
                className={cx(ui.input, styles.textarea)}
                rows={5}
                value={contacts.form.message}
                onChange={(event) => contacts.setField('message', event.target.value)}
                onBlur={() => contacts.touch('message')}
                placeholder="напишите ваш вопрос"
              />
              {contacts.errorFor('message') ? (
                <span className={ui.fieldError}>{contacts.errorFor('message')}</span>
              ) : null}
            </label>

            <button className={ui.btn} type="submit" disabled={!contacts.isValid}>
              Отправить сообщение
            </button>
          </form>
        </div>

        <div className={styles.side}>
          <Reveal>
            <div className={cx(ui.card, styles.mapCard)}>
              {/* Карту грузим сразу: с loading="lazy" виджет Яндекса инициализируется
                  уже после отложенной загрузки и остаётся пустым белым блоком.
                  Под iframe — тёмная подложка, чтобы блок не выглядел пустым,
                  пока карта грузится; ссылка на Яндекс Карты идёт ниже карты,
                  поэтому сама карта остаётся кликабельной */}
              <div className={styles.mapFrameWrap}>
                <iframe
                  className={styles.mapFrame}
                  src={MAP_EMBED_URL}
                  title="Мастерская на карте: улица Декабристов, 116/1, Омск"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className={styles.mapBar}>
                <span className={styles.mapLabel}>
                  Мастерская · улица Декабристов, 116/1, 1 этаж
                </span>
                <a
                  className={styles.mapLink}
                  href={MAP_PAGE_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Открыть в Яндекс Картах
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className={cx(ui.card, styles.hours)}>
              <h3 className={styles.blockTitle}>Часы работы</h3>
              <ul>
                {contacts.hours.map((entry) => (
                  <li key={entry.day}>
                    <span>{entry.day}</span>
                    <span className={ui.muted}>{entry.time}</span>
                  </li>
                ))}
              </ul>
              <p className={ui.muted}>
                Забрать заказ можно в рабочие часы: назовите номер заказа на входе.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
})
