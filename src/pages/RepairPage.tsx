import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { EditableBlock } from '../components/EditableBlock'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { EDITABLE_BLOCKS } from '../data/editableBlocks'
import { useStore } from '../stores/context'
import { BLOCK_KEYS } from '../stores/ContentStore'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './RepairPage.module.css'

/**
 * Описание первого экрана лежит в справочнике редактируемых блоков: оттуда же
 * берутся поля формы, поэтому подписи и тексты не разъедутся.
 * Админ правит этот блок прямо на странице — см. EditableBlock.
 */
const HERO_BLOCK = EDITABLE_BLOCKS.find((block) => block.key === BLOCK_KEYS.repairHero)

/**
 * Ремонт кофемашин: направления работ, порядок действий, ориентиры по цене,
 * гарантия и частые вопросы. Заявку принимают по телефону и через форму
 * в контактах.
 */
export const RepairPage = observer(function RepairPage() {
  const { repair, contacts } = useStore()
  const phone = contacts.channels.find((channel) => channel.href?.startsWith('tel:'))

  return (
    <section className={cx(ui.container, styles.page)}>
      {HERO_BLOCK ? (
        <EditableBlock config={HERO_BLOCK}>
          {(hero) => (
            <>
              <SectionHeading kicker="Ремонт" title={hero.title} lead={hero.lead} />

              <div className={styles.actions}>
                {phone ? (
                  <a className={ui.btn} href={phone.href}>
                    {/* Телефон берём из справочника: правится только надпись кнопки */}
                    {hero.actionOne}: {phone.value}
                  </a>
                ) : null}
                <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.contacts.path}>
                  {hero.actionTwo}
                </Link>
              </div>
            </>
          )}
        </EditableBlock>
      ) : null}

      <div className={styles.directions}>
        {repair.directions.map((direction, index) => (
          <Reveal key={direction.title} delay={index * 70}>
            <article className={cx(ui.card, styles.direction)}>
              <span className={styles.directionIcon} aria-hidden="true">
                {direction.icon}
              </span>
              <h3 className={styles.directionTitle}>{direction.title}</h3>
              <p className={ui.muted}>{direction.text}</p>
              <ul className={styles.points}>
                {direction.points.map((point) => (
                  <li key={point} className={styles.point}>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      <div className={styles.split}>
        <div>
          <h3 className={styles.blockTitle}>Как проходит ремонт</h3>
          <ol className={styles.steps}>
            {repair.steps.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h4 className={styles.stepTitle}>{step.title}</h4>
                  <p className={ui.muted}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className={cx(ui.card, styles.guarantee)}>{repair.guarantee}</p>
        </div>

        <Reveal>
          <div className={cx(ui.card, styles.prices)}>
            <h3 className={styles.blockTitle}>Ориентиры по цене</h3>
            <ul className={styles.priceList}>
              {repair.prices.map((item) => (
                <li key={item.title} className={styles.priceRow}>
                  <span>
                    {item.title}
                    <em className={styles.priceNote}>{item.note}</em>
                  </span>
                  <b>{item.price}</b>
                </li>
              ))}
            </ul>
            <p className={ui.muted}>
              Точную сумму называем после диагностики: цена зависит от модели и того, какие запчасти
              нужны.
            </p>
          </div>
        </Reveal>
      </div>

      <div className={styles.faqBlock}>
        <h3 className={styles.blockTitle}>Частые вопросы</h3>
        <ul className={styles.faq}>
          {repair.faq.map((item, index) => (
            <li key={item.question} className={cx(ui.card, styles.faqItem)}>
              <button
                type="button"
                className={styles.faqQuestion}
                onClick={() => repair.toggleFaq(index)}
                aria-expanded={repair.openFaqIndex === index}
              >
                <span>{item.question}</span>
                <span className={styles.faqMark} aria-hidden="true">
                  {repair.openFaqIndex === index ? '−' : '+'}
                </span>
              </button>
              {repair.openFaqIndex === index ? (
                <p className={cx(ui.muted, styles.faqAnswer)}>{item.answer}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
})
