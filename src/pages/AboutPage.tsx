import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { EditableBlock } from '../components/EditableBlock'
import { EditableList } from '../components/EditableList'
import { PartnersBlock } from '../components/PartnersBlock'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { StatValue } from '../components/StatValue'
import { ABOUT_BLOCKS } from '../data/blocks/about'
import { LIST_KEYS, listConfig } from '../data/lists'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './AboutPage.module.css'

/**
 * О нас: история по годам, принципы, команда мастерской и партнёры.
 *
 * Тексты и списки страницы правит админ прямо здесь: значения по умолчанию
 * лежат в data/blocks/about.ts и data/lists.ts.
 */
export const AboutPage = observer(function AboutPage() {
  const { items } = useStore()

  /*
   * История: карточка года берёт текст из того же списка, что и колонка годов, —
   * иначе правка года не была бы видна на странице.
   */
  const timelineConfig = listConfig(LIST_KEYS.aboutTimeline)
  const timeline = items.items(timelineConfig.key, timelineConfig.defaults)

  /*
   * Активный год — состояние интерфейса, а не данных: храним индекс прямо
   * здесь. В сторе он опирался на встроенный список из четырёх записей,
   * поэтому пятый добавленный год открыть было бы нельзя.
   */
  const [activeIndex, setActiveIndex] = useState(0)
  const safeIndex = Math.min(activeIndex, Math.max(0, timeline.length - 1))
  const activeEntry = timeline[safeIndex]

  return (
    <section className={cx(ui.container, styles.page)}>
      <EditableBlock config={ABOUT_BLOCKS.hero}>
        {(values) => (
          <SectionHeading kicker={values.kicker} title={values.title} lead={values.lead} />
        )}
      </EditableBlock>

      <EditableList config={listConfig(LIST_KEYS.aboutNumbers)} className={styles.numbers}>
        {(item, index) => (
          <Reveal delay={index * 70}>
            <div className={cx(ui.card, styles.number)}>
              <span className={styles.numberValue}>
                <StatValue
                  value={Number(item.fields.value) || 0}
                  suffix={item.fields.suffix}
                  suffixClassName={styles.suffix}
                />
              </span>
              <span className={ui.muted}>{item.fields.label}</span>
            </div>
          </Reveal>
        )}
      </EditableList>

      <div className={styles.timelineBlock}>
        <EditableBlock config={ABOUT_BLOCKS.timelineTitle}>
          {(values) => <h3 className={styles.blockTitle}>{values.title}</h3>}
        </EditableBlock>

        <div className={styles.timeline}>
          <EditableList
            config={timelineConfig}
            className={styles.years}
            wrapper={(node) => <li>{node}</li>}
          >
            {(item, index) => (
              <button
                type="button"
                className={cx(styles.year, safeIndex === index && styles.yearActive)}
                onClick={() => setActiveIndex(index)}
              >
                <span className={styles.yearDot} />
                {item.fields.year}
              </button>
            )}
          </EditableList>

          {activeEntry ? (
            // Ключ по году перезапускает появление карточки при смене года
            <article className={cx(ui.card, styles.entry)} key={activeEntry.fields.year}>
              <span className={styles.entryYear}>{activeEntry.fields.year}</span>
              <h4 className={styles.entryTitle}>{activeEntry.fields.title}</h4>
              <p className={ui.muted}>{activeEntry.fields.text}</p>
            </article>
          ) : null}
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <EditableBlock config={ABOUT_BLOCKS.principlesTitle}>
            {(values) => <h3 className={styles.blockTitle}>{values.title}</h3>}
          </EditableBlock>

          {/*
            Класс карточки стоит внутри children: обёртку wrapper компонент
            списка применяет только в режиме правки, а рамка и отступы нужны
            всем посетителям. Wrapper добавляет только семантичный li.
          */}
          <EditableList
            config={listConfig(LIST_KEYS.aboutPrinciples)}
            className={styles.principles}
            wrapper={(node) => <li>{node}</li>}
          >
            {(item) => (
              <div className={styles.principle}>
                <span aria-hidden="true">✓</span>
                {item.fields.text}
              </div>
            )}
          </EditableList>
        </div>

        <div>
          <EditableBlock config={ABOUT_BLOCKS.teamTitle}>
            {(values) => <h3 className={styles.blockTitle}>{values.title}</h3>}
          </EditableBlock>

          <EditableList config={listConfig(LIST_KEYS.aboutTeam)} className={styles.team}>
            {(item, index) => (
              <Reveal delay={index * 70}>
                <article className={cx(ui.card, styles.member)}>
                  <span className={styles.avatar} aria-hidden="true">
                    {item.fields.initials}
                  </span>
                  <div>
                    <h4 className={styles.memberName}>{item.fields.name}</h4>
                    <span className={styles.memberRole}>{item.fields.role}</span>
                    <p className={ui.muted}>{item.fields.text}</p>
                  </div>
                </article>
              </Reveal>
            )}
          </EditableList>
        </div>
      </div>

      {/*
        Партнёры: логотипы обжарщиков с подписями. Админ добавляет, правит
        и удаляет карточки прямо здесь — см. components/PartnersBlock.tsx
      */}
      <div className={styles.partnersBlock}>
        <EditableBlock config={ABOUT_BLOCKS.partners}>
          {(values) => (
            <>
              <h3 className={styles.blockTitle}>{values.title}</h3>
              <p className={cx(ui.muted, styles.partnersLead)}>{values.lead}</p>
            </>
          )}
        </EditableBlock>
        <PartnersBlock />
      </div>

      <EditableBlock config={ABOUT_BLOCKS.cta}>
        {(values) => (
          <div className={cx(ui.card, styles.cta)}>
            <div>
              <h3 className={cx(ui.title, styles.ctaTitle)}>{values.title}</h3>
              <p className={ui.lead}>{values.lead}</p>
            </div>
            <Link className={ui.btn} to={ROUTES.repair.path}>
              {values.action}
            </Link>
          </div>
        )}
      </EditableBlock>
    </section>
  )
})
