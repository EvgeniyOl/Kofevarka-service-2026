import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { SectionHeading } from '../components/SectionHeading'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './AdminPage.module.css'

/** Что значит каждый статус заявки — подписи для списка */
const STATUS_LABELS = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Закрыта',
} as const

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )

/**
 * Админка: заявки с сайта и список пользователей.
 * Доступ проверяет RequireAuth по роли, серверные ручки — ещё раз на своей стороне.
 */
export const AdminPage = observer(function AdminPage() {
  const { auth } = useStore()

  // Таб — чисто интерфейсное состояние, поэтому живёт в компоненте
  const [tab, setTab] = useState<'requests' | 'users'>('requests')

  useEffect(() => {
    void auth.loadRequests()
    void auth.loadUsers()
  }, [auth])

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Админка"
        title="Заявки и пользователи"
        lead="Заявки приходят из формы на странице контактов. Раздел открыт только администратору — им становится тот, кто зарегистрировался первым."
      />

      <div className={styles.tabs}>
        <button
          type="button"
          className={cx(styles.tab, tab === 'requests' && styles.tabActive)}
          onClick={() => setTab('requests')}
        >
          Заявки {auth.requests.length ? `(${auth.requests.length})` : ''}
        </button>
        <button
          type="button"
          className={cx(styles.tab, tab === 'users' && styles.tabActive)}
          onClick={() => setTab('users')}
        >
          Пользователи {auth.users.length ? `(${auth.users.length})` : ''}
        </button>
      </div>

      {auth.error ? (
        <p className={styles.muted} role="alert">
          {auth.error}
        </p>
      ) : null}

      {tab === 'requests' ? (
        <div className={styles.panel}>
          <div className={cx(styles.row, styles.requestRow, styles.head)}>
            <span>Дата</span>
            <span>Кто</span>
            <span>Сообщение</span>
            <span>Статус</span>
          </div>

          {auth.requestsLoading && !auth.requests.length ? (
            <p className={styles.empty}>Загружаем заявки…</p>
          ) : null}

          {!auth.requestsLoading && !auth.requests.length ? (
            <p className={styles.empty}>
              Заявок пока нет. Они появятся здесь, как только кто-то напишет через форму.
            </p>
          ) : null}

          {auth.requests.map((item) => (
            <div key={item.id} className={cx(styles.row, styles.requestRow)}>
              <span className={styles.muted}>{formatDate(item.createdAt)}</span>
              <span>
                <span className={styles.name}>{item.name}</span>
                <br />
                <span className={styles.muted}>{item.email}</span>
              </span>
              <span className={styles.muted}>{item.message}</span>
              <span>
                <span className={styles.status}>{STATUS_LABELS[item.status]}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={cx(styles.row, styles.head)}>
            <span>Имя</span>
            <span>Почта</span>
            <span>Регистрация</span>
            <span>Роль</span>
          </div>

          {auth.usersLoading && !auth.users.length ? (
            <p className={styles.empty}>Загружаем список…</p>
          ) : null}

          {auth.users.map((user) => (
            <div key={user.id} className={styles.row}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.muted}>{user.email}</span>
              <span className={styles.muted}>{formatDate(user.createdAt)}</span>
              <span>
                {/*
                  Роль — просто подпись, а не кнопка: администратор в проекте
                  один и назначается при регистрации. Это же видно и в подсказке.
                */}
                <span
                  className={cx(styles.role, user.role === 'admin' && styles.roleAdmin)}
                  title={
                    user.role === 'admin'
                      ? 'Администратор — тот, кто зарегистрировался первым'
                      : 'Клиент: может оставить заявку и видеть её статус'
                  }
                >
                  {user.role === 'admin' ? 'Администратор' : 'Клиент'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
})
