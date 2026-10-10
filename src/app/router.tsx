import { BrowserRouter, Route, Routes } from 'react-router'
import { AboutPage } from '../pages/AboutPage'
import { CartPage } from '../pages/CartPage'
import { CatalogPage } from '../pages/CatalogPage'
import { ContactsPage } from '../pages/ContactsPage'
import { DeliveryPage } from '../pages/DeliveryPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SubscriptionPage } from '../pages/SubscriptionPage'
import { Layout } from './Layout'
import { ROUTES } from './routes'

/**
 * Маршрутизация приложения. У каждого раздела свой компонент страницы
 * и свой стор (см. src/stores), которые связывает RootStore.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path={ROUTES.home.path} element={<HomePage />} />
          <Route path={ROUTES.catalog.path} element={<CatalogPage />} />
          <Route path={ROUTES.subscription.path} element={<SubscriptionPage />} />
          <Route path={ROUTES.about.path} element={<AboutPage />} />
          <Route path={ROUTES.delivery.path} element={<DeliveryPage />} />
          <Route path={ROUTES.contacts.path} element={<ContactsPage />} />
          <Route path={ROUTES.cart.path} element={<CartPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
