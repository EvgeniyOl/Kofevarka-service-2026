import { observer } from 'mobx-react-lite'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { TOPICS } from '../stores/ContactsStore'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './ContactsPage.module.css'

/** Контакты: каналы связи, часы работы и форма с валидацией */
export const ContactsPage = observer(function ContactsPage() {
  const { contacts } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Контакты"
        title="Напишите — ответит человек, а не автоответчик"
        lead="Обычно отвечаем в течение рабочего дня. По срочным заказам лучше звонить: так быстрее."
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
              <span className={styles.label}>Тема</span>
              <select
                className={ui.input}
                value={contacts.form.topic}
                onChange={(event) =>
                  contacts.setField('topic', event.target.value as (typeof TOPICS)[number]['value'])
                }
              >
                {TOPICS.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Сообщение</span>
              <textarea
                className={cx(ui.input, styles.textarea)}
                rows={5}
                value={contacts.form.message}
                onChange={(event) => contacts.setField('message', event.target.value)}
                onBlur={() => contacts.touch('message')}
                placeholder="Расскажите про задачу: объём, помол, сроки"
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
            <div className={cx(ui.card, styles.map)}>
              <span className={styles.mapPin} aria-hidden="true">
                ☕
              </span>
              <span className={styles.mapLabel}>Мастерская · ул. Обжарочная, 12</span>
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
