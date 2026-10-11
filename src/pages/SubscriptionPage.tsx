import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { GRIND_OPTIONS, PRODUCTS, VARIANT_OPTIONS, formatPrice } from '../data/products'
import { FREQUENCIES } from '../stores/SubscriptionStore'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './SubscriptionPage.module.css'

/** Подписка: конструктор плана с живым расчётом цены и выгоды */
export const SubscriptionPage = observer(function SubscriptionPage() {
  const { subscription } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Подписка"
        title="Кофе приезжает сам, пока вы про него не вспомнили"
        lead="Скидка от 10 до 20 % к цене витрины, пауза и отмена в один клик. Зерно берём у обжарщиков, у которых пробовали каждую партию, и отправляем в день поступления."
      />

      <div className={styles.layout}>
        <div className={styles.builder}>
          <Reveal>
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>1. Формат</h3>
              <div className={styles.plans}>
                {subscription.plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={cx(styles.plan, subscription.plan === plan.id && styles.planActive)}
                    onClick={() => subscription.setPlan(plan.id)}
                  >
                    <span className={styles.planHead}>
                      <b>{plan.title}</b>
                      <span className={styles.planDiscount}>
                        −{Math.round(plan.discount * 100)} %
                      </span>
                    </span>
                    <span className={ui.muted}>{plan.text}</span>
                    <span className={styles.planBags}>{plan.bags} пакет(а) в доставке</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>2. Ритм доставки</h3>
              <div className={styles.segmented}>
                {FREQUENCIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cx(
                      styles.segment,
                      subscription.frequency === option.value && styles.segmentActive,
                    )}
                    onClick={() => subscription.setFrequency(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>3. Кофе и помол</h3>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>Кофе</span>
                  <select
                    className={ui.input}
                    value={subscription.productId}
                    onChange={(event) => subscription.setProduct(event.target.value)}
                  >
                    {PRODUCTS.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Объём</span>
                  <select
                    className={ui.input}
                    value={subscription.size}
                    onChange={(event) => subscription.setSize(event.target.value)}
                  >
                    {VARIANT_OPTIONS.coffee.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.chips}>
                {GRIND_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cx(
                      styles.chip,
                      subscription.grind === option.value && styles.chipActive,
                    )}
                    onClick={() => subscription.setGrind(option.value)}
                    title={option.hint}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <aside className={styles.summary}>
          <div className={cx(ui.card, styles.summaryCard)}>
            <h3 className={styles.summaryTitle}>Ваша подписка</h3>

            <dl className={styles.summaryList}>
              <div>
                <dt>Формат</dt>
                <dd>{subscription.currentPlan.title}</dd>
              </div>
              <div>
                <dt>Кофе</dt>
                <dd>{subscription.product?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>
                  {subscription.currentPlan.bags} × {subscription.size} г,{' '}
                  {GRIND_OPTIONS.find((option) => option.value === subscription.grind)?.label}
                </dd>
              </div>
              <div>
                <dt>Следующая отправка</dt>
                <dd>{subscription.nextDelivery}</dd>
              </div>
            </dl>

            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>За доставку</span>
              <span className={styles.priceValue}>{formatPrice(subscription.deliveryPrice)}</span>
              {subscription.savingPerDelivery > 0 ? (
                <span className={styles.priceOld}>
                  {formatPrice(subscription.deliveryPriceBase)}
                  <b>выгода {formatPrice(subscription.savingPerDelivery)}</b>
                </span>
              ) : null}
            </div>

            <div className={styles.monthBox}>
              <span>
                В месяц: <b>{formatPrice(subscription.monthlyPrice)}</b>
              </span>
              <span className={ui.muted}>
                {subscription.deliveriesPerMonth} доставки · экономия{' '}
                {formatPrice(subscription.monthlySaving)}
              </span>
            </div>

            {subscription.subscribed ? (
              <div className={styles.success}>
                <p>
                  Подписка оформлена: {subscription.currentPlan.bags} × {subscription.size} г уехали
                  в корзину, письмо придёт на {subscription.email}.
                </p>
                <div className={styles.successActions}>
                  <Link className={ui.btn} to={ROUTES.cart.path}>
                    Перейти в корзину
                  </Link>
                  <button
                    type="button"
                    className={cx(ui.btn, ui.btnGhost)}
                    onClick={() => subscription.reset()}
                  >
                    Оформить ещё
                  </button>
                </div>
              </div>
            ) : (
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault()
                  subscription.subscribe()
                }}
              >
                <label className={styles.field}>
                  <span className={styles.label}>Почта для напоминаний</span>
                  <input
                    className={ui.input}
                    type="email"
                    value={subscription.email}
                    onChange={(event) => subscription.setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                {subscription.emailError ? (
                  <span className={ui.fieldError}>{subscription.emailError}</span>
                ) : null}
                <button className={ui.btn} type="submit">
                  Оформить подписку
                </button>
                <p className={styles.note}>
                  Скидка {subscription.discountPercent} % уже в цене. Отменить можно в любой момент
                  — без звонков и писем в поддержку.
                </p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
})
