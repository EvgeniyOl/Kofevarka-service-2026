import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { EditableBlock } from '../components/EditableBlock'
import { EditableList } from '../components/EditableList'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { DELIVERY_BLOCKS } from '../data/blocks/delivery'
import { LIST_KEYS, listConfig } from '../data/lists'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './DeliveryPage.module.css'

/**
 * Доставка: способы по Омску, как заказать и частые вопросы.
 * Калькулятора и корзины нет — заказ оформляем по телефону или заявкой,
 * поэтому страница только рассказывает, как и когда мы привозим.
 *
 * Тексты правит админ прямо здесь: заголовки и описания — блоками
 * из data/blocks/delivery.ts, способы доставки и вопросы — списками
 * из data/lists.ts. Пока списки не наполнены в базе, показываются
 * значения из кода, поэтому страница работает и без базы.
 */
export const DeliveryPage = observer(function DeliveryPage() {
  const { delivery } = useStore()

  // Открытый вопрос списка: состояние интерфейса, поэтому живёт на странице
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <section className={cx(ui.container, styles.page)}>
      <EditableBlock config={DELIVERY_BLOCKS.hero}>
        {(values) => (
          <SectionHeading kicker={values.kicker} title={values.title} lead={values.lead} />
        )}
      </EditableBlock>

      <div className={styles.layout}>
        <EditableList config={listConfig(LIST_KEYS.deliveryMethods)} className={styles.methods}>
          {(item, index) => (
            <Reveal delay={index * 80}>
              <article className={cx(ui.card, styles.method)}>
                <header className={styles.methodHead}>
                  <h3 className={styles.methodTitle}>{item.fields.title}</h3>
                  <span className={ui.chip}>{item.fields.priceNote}</span>
                </header>
                <p className={ui.muted}>{item.fields.text}</p>
              </article>
            </Reveal>
          )}
        </EditableList>

        <div className={styles.side}>
          <EditableBlock config={DELIVERY_BLOCKS.order}>
            {(values) => (
              <Reveal delay={220}>
                <article className={cx(ui.card, styles.order)}>
                  <h3 className={styles.methodTitle}>{values.title}</h3>
                  <p className={ui.muted}>{values.text}</p>
                  <div className={styles.orderActions}>
                    <Link className={ui.btn} to={ROUTES.contacts.path}>
                      {values.action}
                    </Link>
                    {/* Номер берём из справочника контактов: правится только подпись */}
                    <a className={cx(ui.btn, ui.btnGhost)} href={`tel:${delivery.phoneHref}`}>
                      {values.phoneAction} {delivery.phone}
                    </a>
                  </div>
                </article>
              </Reveal>
            )}
          </EditableBlock>
        </div>
      </div>

      <div className={styles.faqBlock}>
        <EditableBlock config={DELIVERY_BLOCKS.faqTitle}>
          {(values) => <h3 className={styles.blockTitle}>{values.title}</h3>}
        </EditableBlock>

        {/*
          Вопросы раскрываются по одному. Открытый храним по идентификатору,
          а не по номеру: админ может удалить вопрос выше, и тогда открытым
          остался бы соседний.
        */}
        <EditableList config={listConfig(LIST_KEYS.deliveryFaq)} className={styles.faq}>
          {(item) => {
            const key = String(item.id ?? item.fields.question)
            const open = openFaq === key

            return (
              <div className={cx(styles.faqItem, open && styles.faqOpen)}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(open ? null : key)}
                  aria-expanded={open}
                >
                  {item.fields.question}
                  <span className={styles.faqSign} aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                <div className={styles.faqAnswer}>
                  <p className={ui.muted}>{item.fields.answer}</p>
                </div>
              </div>
            )
          }}
        </EditableList>
      </div>
    </section>
  )
})
