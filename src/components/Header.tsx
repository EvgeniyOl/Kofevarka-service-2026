import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { NAV_ROUTES, ROUTES } from '../app/routes'
import { useStore } from '../stores/context'
import { Logo } from './Logo'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './Header.module.css'

/**
 * Шапка: липкая, с размытием и счётчиком корзины.
 * Открытое мобильное меню — единственное локальное состояние:
 * это элемент интерфейса, а не данные приложения.
 */
export const Header = observer(function Header() {
  const { cart } = useStore()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Перешли на другую страницу — меню закрываем
  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <header className={cx(styles.header, scrolled && styles.scrolled)}>
      <div className={cx(ui.container, styles.bar)}>
        <Link
          to={ROUTES.home.path}
          className={styles.logo}
          aria-label="Kofevarka Service — на главную"
        >
          <Logo size={88} />
          <span className={styles.logoText}>
            Kofevarka
            <em>Service</em>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Разделы">
          {NAV_ROUTES.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === ROUTES.home.path}
              className={({ isActive }) => cx(styles.link, isActive && styles.linkActive)}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link to={ROUTES.cart.path} className={cx(ui.btn, ui.btnGhost, styles.cart)}>
            Корзина
            {cart.count > 0 ? (
              <span key={cart.count} className={styles.badge}>
                {cart.count}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            className={cx(styles.burger, menuOpen && styles.burgerOpen)}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Меню"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={cx(styles.drawer, menuOpen && styles.drawerOpen)}>
        <div className={ui.container}>
          <ul className={styles.drawerList}>
            {NAV_ROUTES.map((route) => (
              <li key={route.path}>
                <NavLink
                  to={route.path}
                  end={route.path === ROUTES.home.path}
                  className={({ isActive }) =>
                    cx(styles.drawerLink, isActive && styles.drawerLinkActive)
                  }
                >
                  {route.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
})
