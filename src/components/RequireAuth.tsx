import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { ROUTES } from '../app/routes'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './RequireAuth.module.css'

interface RequireAuthProps {
  children: ReactNode
  /** Раздел только для админа */
  adminOnly?: boolean
}

/**
 * Охрана маршрута. Пока сессия проверяется, показываем заглушку, а не форму
 * входа: иначе при обновлении страницы админ на секунду видел бы «Войти».
 *
 * Это защита интерфейса, а не безопасности: настоящую проверку делает сервер
 * в каждой ручке (requireUser и requireAdmin в api/_lib/http.ts).
 */
export const RequireAuth = observer(function RequireAuth({
  children,
  adminOnly,
}: RequireAuthProps) {
  const { auth } = useStore()
  const location = useLocation()

  if (auth.loading) {
    return <section className={cx(ui.container, styles.checking)}>Проверяем доступ…</section>
  }

  if (!auth.isAuthenticated) {
    // Запоминаем, куда человек шёл: после входа вернём его туда
    return <Navigate to={ROUTES.login.path} replace state={{ from: location.pathname }} />
  }

  if (adminOnly && !auth.isAdmin) {
    return (
      <section className={cx(ui.container, styles.denied)}>
        <h1 className={ui.title}>Раздел только для администратора</h1>
        <p className={ui.lead}>
          Ваш аккаунт — клиентский. Если доступ нужен, попросите администратора выдать роль.
        </p>
      </section>
    )
  }

  return <>{children}</>
})
