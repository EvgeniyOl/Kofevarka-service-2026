import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { CupArt } from '../components/CupArt'
import { QuantityStepper } from '../components/QuantityStepper'
import { SectionHeading } from '../components/SectionHeading'
import { GRIND_OPTIONS, formatPrice } from '../data/products'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './CartPage.module.css'

const grindLabel = (grind: string): string =>
  GRIND_OPTIONS.find((option) => option.value === grind)?.label ?? grind

/** Корзина: строки заказа, промокод, прогресс до бесплатной доставки и итог */
export const CartPage = observer(function CartPage() {
  const { cart } = useStore()

  if (cart.isEmpty) {
    return (
      <section className={cx(ui.container, styles.page)}>
        <SectionHeading kicker="Корзина" title="Пока пусто — и это легко исправить" />
        <div className={cx(ui.card, styles.empty)}>
          <CupArt scene={['#3a2a1d', '#6b4a30']} variant="empty" />
          <p className={ui.lead}>
            Загляните в витрину: восемь лотов, цена за 100 грамм рядом с ценой за пакет.
          </p>
          <div className={styles.emptyActions}>
            <Link className={ui.btn} to={ROUTES.catalog.path}>
              Перейти в витрину
            </Link>
            <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.subscription.path}>
              Собрать подписку
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Корзина"
        title={`${cart.count} позиц. на ${formatPrice(cart.subtotal)}`}
        lead="Проверьте объём и помол: от этого зависит рецепт, который придёт вместе с заказом."
      />

      <div className={styles.layout}>
        <ul className={styles.lines}>
          {cart.lines.map((line) => (
            <li key={line.id} className={cx(ui.card, styles.line)}>
              <div className={styles.lineArt}>
                <CupArt scene={['#43241d', '#9c4a33']} />
              </div>

              <div className={styles.lineBody}>
                <div className={styles.lineHead}>
                  <h3 className={styles.lineName}>{line.name}</h3>
                  <span className={ui.muted}>{line.country}</span>
                </div>

                <div className={styles.lineMeta}>
                  <span className={ui.chip}>{line.size} г</span>
                  <span className={ui.chip}>{grindLabel(line.grind)}</span>
                  <span className={ui.chip}>{formatPrice(line.unitPrice)} за пакет</span>
                </div>

                <div className={styles.lineActions}>
                  <QuantityStepper
                    value={line.quantity}
                    onIncrement={() => cart.increment(line.id)}
                    onDecrement={() => cart.decrement(line.id)}
                    compact
                  />
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => cart.remove(line.id)}
                  >
                    Убрать
                  </button>
                </div>
              </div>

              <div className={styles.lineTotal}>{formatPrice(line.unitPrice * line.quantity)}</div>
            </li>
          ))}
        </ul>

        <aside className={styles.side}>
          <div className={cx(ui.card, styles.summary)}>
            <h3 className={styles.summaryTitle}>Итог заказа</h3>

            <dl className={styles.rows}>
              <div>
                <dt>Товары</dt>
                <dd>{formatPrice(cart.subtotal)}</dd>
              </div>
              {cart.discount > 0 ? (
                <div className={styles.discountRow}>
                  <dt>Скидка {cart.appliedPromo}</dt>
                  <dd>−{formatPrice(cart.discount)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Доставка</dt>
                <dd>{cart.shipping === 0 ? 'бесплатно' : formatPrice(cart.shipping)}</dd>
              </div>
            </dl>

            <div className={styles.progress}>
              <div className={styles.progressHead}>
                <span className={ui.muted}>
                  {cart.freeShippingLeft > 0
                    ? `До бесплатной доставки ${formatPrice(cart.freeShippingLeft)}`
                    : 'Доставка бесплатная'}
                </span>
                <span className={ui.muted}>{cart.freeShippingProgress}%</span>
              </div>
              <span className={styles.progressTrack}>
                <span
                  className={styles.progressBar}
                  style={{ width: `${cart.freeShippingProgress}%` }}
                />
              </span>
            </div>

            <div className={styles.total}>
              <span className={styles.totalLabel}>К оплате</span>
              <span className={styles.totalValue}>{formatPrice(cart.total)}</span>
            </div>

            <form
              className={styles.promo}
              onSubmit={(event) => {
                event.preventDefault()
                cart.applyPromo()
              }}
            >
              <input
                className={ui.input}
                value={cart.promoInput}
                onChange={(event) => cart.setPromoInput(event.target.value)}
                placeholder="Промокод, например KOFE10"
                aria-label="Промокод"
              />
              <button className={cx(ui.btn, ui.btnGhost)} type="submit">
                Применить
              </button>
            </form>
            {cart.promoError ? <span className={ui.fieldError}>{cart.promoError}</span> : null}
            {cart.appliedPromo ? (
              <div className={styles.promoOk}>
                Промокод {cart.appliedPromo} применён: −{cart.discountPercent * 100} %
                <button type="button" className={styles.remove} onClick={() => cart.resetPromo()}>
                  снять
                </button>
              </div>
            ) : null}

            <button className={ui.btn} type="button" disabled>
              Оформить заказ
            </button>
            <p className={styles.note}>
              Оплата в демо-проекте не подключена. Попробуйте промокоды KOFE10 и GASTRO15, чтобы
              увидеть пересчёт.
            </p>

            <button type="button" className={styles.clear} onClick={() => cart.clear()}>
              Очистить корзину
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
})
