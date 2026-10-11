import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { NAV_ROUTES, ROUTES } from '../app/routes'
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../data/contacts'
import { useStore } from '../stores/context'
import { Logo } from './Logo'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './Header.module.css'

/**
 * Шапка: липкая, с размытием и телефоном мастерской.
 * Открытое мобильное меню — единственное локальное состояние:
 * это элемент интерфейса, а не данные приложения.
 */
export const Header = observer(function Header() {
  const { auth } = useStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Перешли на другую страницу — меню закрываем
  const closeMenu = () => setMenuOpen(false)

  const logout = async () => {
    closeMenu()
    await auth.logout()
    navigate(ROUTES.home.path)
  }

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
          {/*
            На узком экране номер не помещается, поэтому от него остаётся
            иконка трубки — сама ссылка та же, звонок в один тап. Иконка
            нарисована линией: текстовый символ «✆» система рисует
            цветным эмодзи, и в шапке это выглядело мусором.
          */}
          <a
            className={cx(ui.btn, ui.btnGhost, styles.phone)}
            href={`tel:${CONTACT_PHONE_HREF}`}
            aria-label={`Позвонить: ${CONTACT_PHONE}`}
          >
            <span className={styles.phoneText}>{CONTACT_PHONE}</span>
            <svg
              className={styles.phoneIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
            </svg>
          </a>

          {/*
            Аккаунт: пока сессия проверяется, кнопку не показываем —
            иначе при обновлении страницы мелькала бы «Войти», а затем имя.
          */}
          {auth.loading ? null : auth.isAuthenticated ? (
            <div className={styles.account}>
              {auth.isAdmin ? (
                <NavLink to={ROUTES.admin.path} className={styles.accountLink}>
                  Админка
                </NavLink>
              ) : null}
              <span className={styles.accountName} title={auth.user?.email}>
                {auth.user?.name}
              </span>
              <button type="button" className={styles.accountOut} onClick={logout}>
                Выйти
              </button>
            </div>
          ) : (
            <NavLink to={ROUTES.login.path} className={cx(styles.accountLink, styles.accountEnter)}>
              Войти
            </NavLink>
          )}

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
                  onClick={closeMenu}
                >
                  {route.label}
                </NavLink>
              </li>
            ))}

            {/* В мобильном меню аккаунт показываем словами: в шапке он не помещается */}
            {auth.loading ? null : auth.isAuthenticated ? (
              <>
                {auth.isAdmin ? (
                  <li>
                    <NavLink
                      to={ROUTES.admin.path}
                      className={styles.drawerLink}
                      onClick={closeMenu}
                    >
                      Админка
                    </NavLink>
                  </li>
                ) : null}
                <li>
                  <button type="button" className={styles.drawerLink} onClick={logout}>
                    Выйти ({auth.user?.name})
                  </button>
                </li>
              </>
            ) : (
              <li>
                <NavLink to={ROUTES.login.path} className={styles.drawerLink} onClick={closeMenu}>
                  Войти
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  )
})
