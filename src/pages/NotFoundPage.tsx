import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { CupArt } from '../components/CupArt'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './NotFoundPage.module.css'

/** 404: показываем чашку и уводим обратно на главную */
export function NotFoundPage() {
  return (
    <section className={cx(ui.container, styles.page)}>
      <CupArt scene={['#2c2118', '#5d4128']} variant="empty" />
      <span className={styles.code}>404</span>
      <h1 className={cx(ui.title, styles.title)}>Такой страницы у нас не заварилось</h1>
      <p className={ui.lead}>
        Возможно, ссылка устарела или в адресе опечатка. Начните с главной — там всё на месте.
      </p>
      <div className={styles.actions}>
        <Link className={ui.btn} to={ROUTES.home.path}>
          На главную
        </Link>
        <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.contacts.path}>
          Связаться с нами
        </Link>
      </div>
    </section>
  )
}
