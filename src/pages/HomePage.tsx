import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { EditableBlock } from '../components/EditableBlock'
import { EditableList } from '../components/EditableList'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { StatValue } from '../components/StatValue'
import { HOME_BLOCKS } from '../data/blocks/home'
import { LIST_KEYS, listConfig } from '../data/lists'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './HomePage.module.css'

/**
 * Главная: ремонт кофемашин и кофе.
 *
 * Всё содержимое страницы — тексты и списки, включая подборку товаров, —
 * правит админ прямо на странице. Значения по умолчанию лежат
 * в data/blocks/home.ts и data/lists.ts.
 */
export const HomePage = observer(function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={cx(ui.container, styles.heroInner)}>
          <EditableBlock config={HOME_BLOCKS.hero}>
            {(values) => (
              <div className={styles.heroCopy}>
                <span className={ui.eyebrow}>{values.kicker}</span>

                <h1 className={styles.heroTitle}>
                  <span className={styles.brand}>{values.title}</span>
                  <span className={styles.tagline}>{values.subtitle}</span>
                </h1>

                <p className={cx(ui.lead, styles.heroLead)}>{values.lead}</p>
              </div>
            )}
          </EditableBlock>

          <div className={styles.heroArt}>
            <img
              className={styles.heroPhoto}
              src="/photos/mainPageCard1.webp"
              alt="Профессиональная кофемашина в работе: из группы валит пар"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.container}>
          <EditableBlock config={HOME_BLOCKS.featured}>
            {(values) => (
              <SectionHeading kicker={values.kicker} title={values.title} lead={values.lead} />
            )}
          </EditableBlock>

          {/*
            Подборка товаров: карточки живут в базе, админ правит, добавляет
            и удаляет их прямо здесь. Подписи внутри карточки — часть её вида,
            а не контент страницы.
          */}
          <EditableList
            config={listConfig(LIST_KEYS.homeFeatured)}
            className={styles.cards}
            wrapper={(node) => <>{node}</>}
          >
            {(item) => (
              <Reveal className={styles.cardWrap}>
                <ProductCard fields={item.fields} />
              </Reveal>
            )}
          </EditableList>
        </div>
      </section>

      <section className={cx(ui.section, styles.valuesSection)}>
        <div className={ui.container}>
          <EditableBlock config={HOME_BLOCKS.values}>
            {(values) => (
              <SectionHeading kicker={values.kicker} title={values.title} align="center" />
            )}
          </EditableBlock>

          <EditableList config={listConfig(LIST_KEYS.homeValues)} className={styles.values}>
            {(item) => (
              <Reveal>
                <article className={cx(ui.card, styles.value)}>
                  <span className={styles.valueIcon} aria-hidden="true">
                    {item.fields.icon}
                  </span>
                  <h3 className={styles.valueTitle}>{item.fields.title}</h3>
                  <p className={ui.muted}>{item.fields.text}</p>
                </article>
              </Reveal>
            )}
          </EditableList>
        </div>
      </section>

      <section className={ui.section}>
        <div className={cx(ui.container, styles.process)}>
          <EditableBlock config={HOME_BLOCKS.steps}>
            {(values) => (
              <SectionHeading kicker={values.kicker} title={values.title} lead={values.lead} />
            )}
          </EditableBlock>

          <EditableList
            config={listConfig(LIST_KEYS.homeSteps)}
            className={styles.steps}
            wrapper={(node) => <li className={styles.step}>{node}</li>}
          >
            {(item, index) => (
              <>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className={styles.stepTitle}>{item.fields.title}</h3>
                  <p className={ui.muted}>{item.fields.text}</p>
                </div>
              </>
            )}
          </EditableList>
        </div>
      </section>

      <section className={styles.statsBand}>
        {/* Сетку задаёт сам список: класс stats передаём ему, а не контейнеру */}
        <div className={ui.container}>
          <EditableList config={listConfig(LIST_KEYS.homeStats)} className={styles.stats}>
            {(item) => (
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  <StatValue
                    value={Number(item.fields.value) || 0}
                    suffix={item.fields.suffix}
                    suffixClassName={styles.statSuffix}
                  />
                </span>
                <span className={styles.statLabel}>{item.fields.label}</span>
              </div>
            )}
          </EditableList>
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.container}>
          <EditableBlock config={HOME_BLOCKS.testimonials}>
            {(values) => (
              <SectionHeading kicker={values.kicker} title={values.title} align="center" />
            )}
          </EditableBlock>

          <EditableList
            config={listConfig(LIST_KEYS.homeTestimonials)}
            className={styles.testimonials}
            wrapper={(node) => <>{node}</>}
          >
            {(item) => (
              <Reveal>
                <figure className={cx(ui.card, styles.testimonial)}>
                  <blockquote className={styles.quote}>«{item.fields.text}»</blockquote>
                  <figcaption className={styles.author}>
                    <span className={styles.avatar} aria-hidden="true">
                      {item.fields.initials}
                    </span>
                    <span>
                      <b>{item.fields.name}</b>
                      <em>{item.fields.role}</em>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            )}
          </EditableList>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <EditableBlock config={HOME_BLOCKS.cta}>
          {(values) => (
            <div className={cx(ui.container, styles.cta)}>
              <div>
                <h2 className={cx(ui.title, styles.ctaTitle)}>{values.title}</h2>
                <p className={ui.lead}>{values.lead}</p>
              </div>
              <Link className={ui.btn} to={ROUTES.contacts.path}>
                {values.action}
              </Link>
            </div>
          )}
        </EditableBlock>
      </section>
    </>
  )
})
