import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Header } from '../components/Header'
import { ROUTES } from './routes'

/**
 * Каркас приложения: шапка и содержимое раздела.
 * Здесь же — прокрутка наверх и заголовок вкладки при смене маршрута.
 */
export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    const meta = Object.values(ROUTES).find((route) => route.path === pathname)
    document.title = meta?.title ?? 'Kofevarka Service'
  }, [pathname])

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}
