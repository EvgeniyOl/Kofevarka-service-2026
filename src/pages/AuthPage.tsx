import { observer } from 'mobx-react-lite'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ROUTES } from '../app/routes'
import { SectionHeading } from '../components/SectionHeading'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './AuthPage.module.css'

interface AuthPageProps {
  /** Вход или регистрация — форма одна, отличается парой полей */
  mode: 'login' | 'register'
}

/**
 * Вход и регистрация. После успеха возвращаем человека туда, откуда он
 * пришёл: админку или страницу заявки охраняет RequireAuth, и он кладёт
 * нужный адрес в state.
 */
export const AuthPage = observer(function AuthPage({ mode }: AuthPageProps) {
  const { auth } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isLogin = mode === 'login'
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home.path

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const ok = isLogin
      ? await auth.login(email, password)
      : await auth.register(name, email, password)
    if (ok) navigate(from, { replace: true })
  }

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker={isLogin ? 'Вход' : 'Регистрация'}
        title={isLogin ? 'Вход в кабинет' : 'Создать аккаунт'}
        lead={
          isLogin
            ? 'Войдите, чтобы оставить заявку от своего имени и видеть её статус.'
            : 'Аккаунт нужен, чтобы оставить заявку и следить за её статусом. Первый зарегистрированный пользователь становится администратором.'
        }
      />

      <div className={styles.layout}>
        <div className={cx(ui.card, styles.card)}>
          <form className={styles.form} onSubmit={submit}>
            {!isLogin ? (
              <label className={styles.field}>
                <span className={styles.label}>Имя</span>
                <input
                  className={ui.input}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Как к вам обращаться"
                  autoComplete="name"
                  required
                />
              </label>
            ) : null}

            <label className={styles.field}>
              <span className={styles.label}>Почта</span>
              <input
                className={ui.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Пароль</span>
              <input
                className={ui.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isLogin ? 'Ваш пароль' : 'Не короче 8 символов'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? undefined : 8}
                required
              />
              {!isLogin ? <span className={styles.hint}>Минимум 8 символов</span> : null}
            </label>

            {auth.error ? (
              <p className={styles.error} role="alert">
                {auth.error}
              </p>
            ) : null}

            <button className={ui.btn} type="submit" disabled={auth.busy}>
              {auth.busy ? 'Отправляем…' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className={styles.switch}>
            {isLogin ? (
              <>
                Ещё нет аккаунта?
                <Link to={ROUTES.register.path}>Зарегистрироваться</Link>
              </>
            ) : (
              <>
                Уже зарегистрированы?
                <Link to={ROUTES.login.path}>Войти</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
})
