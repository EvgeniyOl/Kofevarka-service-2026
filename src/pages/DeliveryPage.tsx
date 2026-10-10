import { observer } from 'mobx-react-lite'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { formatPrice } from '../data/products'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './DeliveryPage.module.css'

/** Доставка: калькулятор стоимости и сроков плюс частые вопросы */
export const DeliveryPage = observer(function DeliveryPage() {
  const { delivery } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Доставка и оплата"
        title="Считаем стоимость до того, как вы оформите заказ"
        lead="Выберите зону и способ — калькулятор покажет цену и срок. Оплата картой, СБП или при получении курьеру."
      />

      <div className={styles.layout}>
        <div className={cx(ui.card, styles.calculator)}>
          <h3 className={styles.blockTitle}>Калькулятор</h3>

          <div className={styles.field}>
            <span className={styles.label}>Зона</span>
            <div className={styles.chips}>
              {delivery.zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className={cx(styles.chip, delivery.zoneId === zone.id && styles.chipActive)}
                  onClick={() => delivery.setZone(zone.id)}
                >
                  {zone.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Способ</span>
            <div className={styles.chips}>
              {delivery.methods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={cx(styles.chip, delivery.method === method.id && styles.chipActive)}
                  onClick={() => delivery.setMethod(method.id)}
                  title={method.text}
                >
                  {method.title}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              Сумма заказа: <b>{formatPrice(delivery.orderSum)}</b>
            </span>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={12000}
              step={100}
              value={delivery.orderSum}
              onChange={(event) => delivery.setOrderSum(Number(event.target.value))}
            />
          </label>

          {delivery.method === 'post' ? (
            <label className={styles.field}>
              <span className={styles.label}>
                Вес посылки: <b>{delivery.weight} г</b>
              </span>
              <input
                className={styles.range}
                type="range"
                min={250}
                max={5000}
                step={250}
                value={delivery.weight}
                onChange={(event) => delivery.setWeight(Number(event.target.value))}
              />
            </label>
          ) : null}

          <div className={styles.result}>
            <div>
              <span className={styles.label}>Стоимость доставки</span>
              <span className={styles.resultValue}>
                {delivery.isFree ? 'бесплатно' : formatPrice(delivery.cost)}
              </span>
            </div>
            <div>
              <span className={styles.label}>Срок</span>
              <span className={styles.resultEta}>{delivery.eta}</span>
            </div>
          </div>

          {delivery.freeFromLeft > 0 ? (
            <p className={styles.hint}>
              До бесплатной доставки в зоне «{delivery.zone.name}» осталось{' '}
              {formatPrice(delivery.freeFromLeft)} — или выберите самовывоз, он бесплатный всегда.
            </p>
          ) : null}
        </div>

        <div className={styles.methods}>
          {delivery.methods.map((method, index) => (
            <Reveal key={method.id} delay={index * 80}>
              <article
                className={cx(
                  ui.card,
                  styles.method,
                  delivery.method === method.id && styles.methodActive,
                )}
              >
                <header className={styles.methodHead}>
                  <h3 className={styles.methodTitle}>{method.title}</h3>
                  <span className={ui.chip}>{method.priceNote}</span>
                </header>
                <p className={ui.muted}>{method.text}</p>
                <button
                  type="button"
                  className={styles.methodPick}
                  onClick={() => delivery.setMethod(method.id)}
                >
                  {delivery.method === method.id ? 'Выбрано' : 'Выбрать способ'}
                </button>
              </article>
            </Reveal>
          ))}
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
