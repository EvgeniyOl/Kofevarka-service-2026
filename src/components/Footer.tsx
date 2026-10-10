import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { NAV_ROUTES, ROUTES } from '../app/routes'
import { useStore } from '../stores/context'
import { Logo } from './Logo'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './Footer.module.css'

/** Подвал: навигация, контакты из ContactsStore и подписка на письма */
export const Footer = observer(function Footer() {
  const { contacts } = useStore()

  return (
    <footer className={styles.footer}>
      <div className={cx(ui.container, styles.inner)}>
        <div className={styles.brand}>
          <Link to={ROUTES.home.path} className={styles.logo}>
            <Logo size={100} />
            <span className={styles.brandName}>Kofevarka Service</span>
          </Link>

          <p className={ui.muted}>
            Мастерская обжарки полного цикла: покупаем зеленое зерно напрямую, жарим дважды в неделю
            и отправляем в день обжарки.
          </p>

          <form
            className={styles.newsletter}
            onSubmit={(event) => {
              event.preventDefault()
              contacts.subscribeNewsletter()
            }}
          >
            <input
              className={ui.input}
              type="email"
              value={contacts.newsletterEmail}
              onChange={(event) => contacts.setNewsletterEmail(event.target.value)}
              placeholder="почта для писем о новых лотах"
              aria-label="Почта для подписки"
            />
            <button className={ui.btn} type="submit">
              Подписаться
            </button>
          </form>

          {contacts.newsletterDone ? (
            <p className={styles.done}>Готово! Первое письмо придёт с рецептом для воронки.</p>
          ) : null}
        </div>

        <div className={styles.columns}>
          <section className={styles.column}>
            <h3 className={styles.colTitle}>Разделы</h3>
            <ul className={styles.list}>
              {NAV_ROUTES.map((route) => (
                <li key={route.path}>
                  <Link to={route.path} className={styles.item}>
                    {route.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={ROUTES.cart.path} className={styles.item}>
                  Корзина
                </Link>
              </li>
            </ul>
          </section>

          <section className={styles.column}>
            <h3 className={styles.colTitle}>Контакты</h3>
            <ul className={styles.list}>
              {contacts.channels.map((channel) => (
                <li key={channel.title} className={styles.contact}>
                  <span aria-hidden="true">{channel.icon}</span>
                  {channel.href ? (
                    <a className={styles.item} href={channel.href}>
                      {channel.value}
                    </a>
                  ) : (
                    <span>{channel.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.column}>
            <h3 className={styles.colTitle}>Мастерская</h3>
            <ul className={styles.list}>
              {contacts.hours.map((entry) => (
                <li key={entry.day} className={styles.hours}>
                  <span>{entry.day}</span>
                  <span className={ui.muted}>{entry.time}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className={cx(ui.container, styles.bottom)}>
        <span>© {new Date().getFullYear()} Kofevarka Service</span>
        <span className={ui.muted}>React · Vite · MobX · CSS Modules</span>
      </div>
    </footer>
  )
})
