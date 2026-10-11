import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './DeliveryPage.module.css'

/**
 * Доставка: условия по Омску и условия подписки.
 * Калькулятора и корзины нет — заказ оформляем по телефону или заявкой,
 * поэтому страница только рассказывает, как и когда мы привозим.
 */
export const DeliveryPage = observer(function DeliveryPage() {
  const { delivery } = useStore()
  const { subscription } = delivery

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Доставка и оплата"
        title="Доставка по Омску, бесплатно от 3 кг кофе"
        lead="Работаем только по городу: так мы отвечаем за технику и свежесть зерна. Заказ оформляем по телефону или заявкой — оплата картой, СБП или при получении курьеру."
      />

      <div className={styles.layout}>
        <div className={styles.methods}>
          {delivery.methods.map((method, index) => (
            <Reveal key={method.id} delay={index * 80}>
              <article className={cx(ui.card, styles.method)}>
                <header className={styles.methodHead}>
                  <h3 className={styles.methodTitle}>{method.title}</h3>
                  <span className={ui.chip}>{method.priceNote}</span>
                </header>
                <p className={ui.muted}>{method.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className={styles.side}>
          <Reveal delay={160}>
            <article className={cx(ui.card, styles.plan)}>
              <span className={ui.chip}>{subscription.discountPercent} % на кофе</span>
              <h3 className={styles.methodTitle}>
                {subscription.coffeeKg} кг кофе в месяц — обслуживание бесплатно
              </h3>
              <p className={ui.muted}>
                Подписка: каждый месяц привозим {subscription.coffeeKg} кг кофе ({subscription.bags}{' '}
                пакетов по {subscription.bagGrams} г) и бесплатно обслуживаем вашу кофемашину —
                чистка группы, промывка гидросистемы, проверка помола. Доставка по городу входит.
              </p>
              <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.subscription.path}>
                Как устроена подписка
              </Link>
            </article>
          </Reveal>

          <Reveal delay={220}>
            <article className={cx(ui.card, styles.order)}>
              <h3 className={styles.methodTitle}>Как заказать</h3>
              <p className={ui.muted}>
                Онлайн-оплаты на сайте нет: соберём заказ по телефону, подтвердим наличие и назовём
                срок. Для мастерской заявку можно оставить в любое время — перезвоним в рабочие
                часы.
              </p>
              <div className={styles.orderActions}>
                <Link className={ui.btn} to={ROUTES.contacts.path}>
                  Оставить заявку
                </Link>
                <a className={cx(ui.btn, ui.btnGhost)} href={`tel:${delivery.phoneHref}`}>
                  {delivery.phone}
                </a>
              </div>
            </article>
          </Reveal>
        </div>
      </div>

      <div className={styles.faqBlock}>
        <h3 className={styles.blockTitle}>Частые вопросы</h3>
        <ul className={styles.faq}>
          {delivery.faq.map((entry, index) => {
            const open = delivery.openFaqIndex === index
            return (
              <li key={entry.question} className={cx(styles.faqItem, open && styles.faqOpen)}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => delivery.toggleFaq(index)}
                  aria-expanded={open}
                >
                  {entry.question}
                  <span className={styles.faqSign} aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                <div className={styles.faqAnswer}>
                  <p className={ui.muted}>{entry.answer}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
})
