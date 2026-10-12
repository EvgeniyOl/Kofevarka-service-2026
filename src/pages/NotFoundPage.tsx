import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { CupArt } from '../components/CupArt'
import { EditableBlock } from '../components/EditableBlock'
import { COMMON_BLOCKS } from '../data/blocks/common'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './NotFoundPage.module.css'

/** 404: показываем чашку и уводим обратно на главную. Тексты правит админ */
export function NotFoundPage() {
  return (
    <section className={cx(ui.container, styles.page)}>
      <CupArt scene={['#2c2118', '#5d4128']} variant="empty" />
      <span className={styles.code}>404</span>

      <EditableBlock config={COMMON_BLOCKS.notFound}>
        {(values) => (
          <>
            <h1 className={cx(ui.title, styles.title)}>{values.title}</h1>
            <p className={ui.lead}>{values.lead}</p>
            <div className={styles.actions}>
              <Link className={ui.btn} to={ROUTES.home.path}>
                {values.actionHome}
              </Link>
              <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.contacts.path}>
                {values.actionContacts}
              </Link>
            </div>
          </>
        )}
      </EditableBlock>
    </section>
  )
}
