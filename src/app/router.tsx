import { BrowserRouter, Route, Routes } from 'react-router'
import { RequireAuth } from '../components/RequireAuth'
import { AboutPage } from '../pages/AboutPage'
import { AdminPage } from '../pages/AdminPage'
import { AuthPage } from '../pages/AuthPage'
import { ContactsPage } from '../pages/ContactsPage'
import { DeliveryPage } from '../pages/DeliveryPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RepairPage } from '../pages/RepairPage'
import { SubscriptionPage } from '../pages/SubscriptionPage'
import { Layout } from './Layout'
import { ROUTES } from './routes'

/**
 * Маршрутизация приложения. У каждого раздела свой компонент страницы
 * и свой стор (см. src/stores), которые связывает RootStore.
 * Вход, регистрация и админка — служебные разделы, в меню их нет.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path={ROUTES.home.path} element={<HomePage />} />
          <Route path={ROUTES.repair.path} element={<RepairPage />} />
          <Route path={ROUTES.subscription.path} element={<SubscriptionPage />} />
          <Route path={ROUTES.about.path} element={<AboutPage />} />
          <Route path={ROUTES.delivery.path} element={<DeliveryPage />} />
          <Route path={ROUTES.contacts.path} element={<ContactsPage />} />

          <Route path={ROUTES.login.path} element={<AuthPage mode="login" />} />
          <Route path={ROUTES.register.path} element={<AuthPage mode="register" />} />
          <Route
            path={ROUTES.admin.path}
            element={
              <RequireAuth adminOnly>
                <AdminPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
