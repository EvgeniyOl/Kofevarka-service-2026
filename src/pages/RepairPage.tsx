import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { AddDirectionCard, DirectionCard, DirectionsLimit } from '../components/DirectionCard'
import { EditableBlock } from '../components/EditableBlock'
import { EditableList } from '../components/EditableList'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { REPAIR_BLOCKS } from '../data/blocks/repair'
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../data/contacts'
import { LIST_KEYS, listConfig } from '../data/lists'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './RepairPage.module.css'
import directionStyles from '../components/DirectionCard.module.css'

/**
 * Ремонт кофемашин: направления работ, порядок действий, ориентиры по цене,
 * гарантия и частые вопросы. Заявку принимают по телефону и через форму
 * в контактах.
 *
 * Тексты и списки правит админ прямо здесь: заголовки — через EditableBlock,
 * шаги, цены и вопросы — через EditableList.
 */
export const RepairPage = observer(function RepairPage() {
  const { directions } = useStore()

  /*
   * Открытый вопрос храним по идентификатору, а не по номеру: админ может
   * удалить вопрос выше, и тогда открытым остался бы соседний.
   */
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <section className={cx(ui.container, styles.page)}>
      <EditableBlock config={REPAIR_BLOCKS.hero}>
        {(hero) => (
          <>
            <SectionHeading kicker="Ремонт" title={hero.title} lead={hero.lead} />

            <div className={styles.actions}>
              {/* Телефон берём из справочника: правится только надпись кнопки */}
              <a className={ui.btn} href={`tel:${CONTACT_PHONE_HREF}`}>
                {hero.actionOne}: {CONTACT_PHONE}
              </a>
              <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.contacts.path}>
                {hero.actionTwo}
              </Link>
            </div>
          </>
        )}
      </EditableBlock>

      {/*
        Карточки направлений живут в базе: админ добавляет, правит и удаляет их
        прямо здесь. Пока они грузятся, ничего не показываем, чтобы не мигало.
      */}
      {directions.loading ? null : (
        <div className={styles.directions}>
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
        </div>
      )}

      <div className={styles.split}>
        <div>
          <EditableBlock config={REPAIR_BLOCKS.steps}>
            {(values) => <h3 className={styles.blockTitle}>{values.title}</h3>}
          </EditableBlock>

          <EditableList
            config={listConfig(LIST_KEYS.repairSteps)}
            className={styles.steps}
            container="ol"
            wrapper={(node) => <li className={styles.step}>{node}</li>}
          >
            {(item, index) => (
              <>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h4 className={styles.stepTitle}>{item.fields.title}</h4>
                  <p className={ui.muted}>{item.fields.text}</p>
                </div>
              </>
            )}
          </EditableList>

          <EditableBlock config={REPAIR_BLOCKS.guarantee}>
            {(values) => <p className={cx(ui.card, styles.guarantee)}>{values.text}</p>}
          </EditableBlock>
        </div>

        <Reveal>
          <div className={cx(ui.card, styles.prices)}>
            <EditableBlock config={REPAIR_BLOCKS.prices}>
              {(values) => (
                <>
                  <h3 className={styles.blockTitle}>{values.title}</h3>
                  <p className={cx(ui.muted, styles.pricesLead)}>{values.lead}</p>
                </>
              )}
            </EditableBlock>

            <EditableList
              config={listConfig(LIST_KEYS.repairPrices)}
              className={styles.priceList}
              container="ul"
              wrapper={(node) => <li className={styles.priceRow}>{node}</li>}
            >
              {(item) => (
                <>
                  <span>
                    {item.fields.title}
                    <em className={styles.priceNote}>{item.fields.note}</em>
                  </span>
                  <b>{item.fields.price}</b>
                </>
              )}
            </EditableList>
          </div>
        </Reveal>
      </div>

      <div className={styles.faqBlock}>
        <EditableBlock config={REPAIR_BLOCKS.faq}>
          {(values) => <h3 className={styles.blockTitle}>{values.title}</h3>}
        </EditableBlock>

        <EditableList
          config={listConfig(LIST_KEYS.repairFaq)}
          className={styles.faq}
          container="ul"
          wrapper={(node) => <li className={cx(ui.card, styles.faqItem)}>{node}</li>}
        >
          {(item) => {
            const key = item.id ?? item.fields.question
            const open = openFaq === String(key)

            return (
              <>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(open ? null : String(key))}
                  aria-expanded={open}
                >
                  <span>{item.fields.question}</span>
                  <span className={styles.faqMark} aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open ? (
                  <p className={cx(ui.muted, styles.faqAnswer)}>{item.fields.answer}</p>
                ) : null}
              </>
            )
          }}
        </EditableList>
      </div>
    </section>
  )
})
