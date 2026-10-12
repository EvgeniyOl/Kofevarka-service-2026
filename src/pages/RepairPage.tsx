import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { AddDirectionCard, DirectionCard, DirectionsLimit } from '../components/DirectionCard'
import { EditableBlock } from '../components/EditableBlock'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { EDITABLE_BLOCKS } from '../data/editableBlocks'
import { useStore } from '../stores/context'
import { BLOCK_KEYS } from '../stores/ContentStore'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './RepairPage.module.css'
import directionStyles from '../components/DirectionCard.module.css'

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
  const { repair, contacts, directions } = useStore()
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

      {/*
        Карточки направлений живут в базе: админ добавляет, правит и удаляет их
        прямо здесь. Пока они грузятся, ничего не показываем, чтобы не мигало.
      */}
      {directions.loading ? null : (
        <>
          <div className={directionStyles.grid}>
            {/*
              Карточки оборачиваются в появление сами: в режиме правки
              компонент возвращает форму без обёртки, чтобы она не растягивала
              высоту строки сетки.
            */}
            {directions.directions.map((direction, index) => (
              <DirectionCard key={direction.id} direction={direction} delay={index * 70} />
            ))}
            <AddDirectionCard />
          </div>
          <DirectionsLimit />
        </>
      )}

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
