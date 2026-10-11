import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { ForgeArt } from '../components/ForgeArt'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { StatValue } from '../components/StatValue'
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../data/contacts'
import { formatPrice, priceFor } from '../data/products'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './HomePage.module.css'

/** Главная: ремонт кофемашин и кофе — герой, избранное, порядок работ, цифры, отзывы */
export const HomePage = observer(function HomePage() {
  const { home } = useStore()
  const cheapest = home.featured.reduce(
    (min, product) => Math.min(min, priceFor(product, '1')),
    Number.POSITIVE_INFINITY,
  )

  return (
    <>
      <section className={styles.hero}>
        <div className={cx(ui.container, styles.heroInner)}>
          <div className={styles.heroCopy}>
            <span className={ui.eyebrow}>{home.kicker}</span>

            <h1 className={styles.heroTitle}>
              <span className={styles.brand}>{home.company}</span>
              <span className={styles.tagline}>{home.heroTitle}</span>
            </h1>

            <p className={cx(ui.lead, styles.heroLead)}>{home.heroLead}</p>

            <div className={styles.heroActions}>
              <Link className={ui.btn} to={ROUTES.contacts.path}>
                Вызвать мастера
              </Link>
              <a className={cx(ui.btn, ui.btnGhost)} href={`tel:${CONTACT_PHONE_HREF}`}>
                {CONTACT_PHONE}
              </a>
            </div>

            <dl className={styles.heroFacts}>
              <div>
                <dt>Диагностика</dt>
                <dd>за 1 день</dd>
              </div>
              <div>
                <dt>Цена от</dt>
                <dd>{formatPrice(cheapest === Number.POSITIVE_INFINITY ? 640 : cheapest)}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>по Омску, от 3 кг — бесплатно</dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroArt}>
            <ForgeArt variant="hero" photo="/photos/forge-dwarf.jpg" />
            <span className={cx(styles.floatCard, styles.floatTop)}>
              <b>Диагностика</b> за один день
            </span>
            <span className={cx(styles.floatCard, styles.floatBottom)}>
              <b>6 месяцев</b> гарантии на работы
            </span>
          </div>
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.container}>
          <SectionHeading
            kicker="Что мы делаем"
            title="Что берут вместе с ремонтом"
            lead="Технику привозим и настраиваем, расходники и подменную машину подбираем вместе с ремонтом. Наличие и цену уточняйте по телефону — соберём заказ и привезём."
          />

          <div className={styles.cards}>
            {home.featured.map((product, index) => (
              <Reveal key={product.id} delay={index * 80}>
                <ProductCard product={product} variant="1" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={cx(ui.section, styles.valuesSection)}>
        <div className={ui.container}>
          <SectionHeading
            kicker="Как мы работаем"
            title="Четыре правила, из которых ничего не выкинуть"
            align="center"
          />
          <div className={styles.values}>
            {home.values.map((value, index) => (
              <Reveal key={value.title} delay={index * 90}>
                <article className={cx(ui.card, styles.value)}>
                  <span className={styles.valueIcon} aria-hidden="true">
                    {value.icon}
                  </span>
                  <h3 className={styles.valueTitle}>{value.title}</h3>
                  <p className={ui.muted}>{value.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={ui.section}>
        <div className={cx(ui.container, styles.process)}>
          <SectionHeading
            kicker="Процесс"
            title="Как проходит ремонт"
            lead="Четыре шага, после которых машина снова варит, а не шипит. Диагностика бесплатна, если ремонт делаем мы."
          />
          <ol className={styles.steps}>
            {home.steps.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={ui.muted}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.statsBand}>
        <div className={cx(ui.container, styles.stats)}>
          {home.stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <span className={styles.statValue}>
                <StatValue
                  value={stat.value}
                  suffix={stat.suffix}
                  suffixClassName={styles.statSuffix}
                />
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.container}>
          <SectionHeading kicker="Отзывы" title="Домашние машины, кофейни и офисы" align="center" />
          <div className={styles.testimonials}>
            {home.testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 90}>
                <figure className={cx(ui.card, styles.testimonial)}>
                  <blockquote className={styles.quote}>«{item.text}»</blockquote>
                  <figcaption className={styles.author}>
                    <span className={styles.avatar} aria-hidden="true">
                      {item.initials}
                    </span>
                    <span>
                      <b>{item.name}</b>
                      <em>{item.role}</em>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={cx(ui.container, styles.cta)}>
          <div>
            <h2 className={cx(ui.title, styles.ctaTitle)}>
              Машина встала в самый неподходящий день
            </h2>
            <p className={ui.lead}>
              Опишите симптом по телефону — скажем, ремонт это или настройка, и когда сможем забрать
              технику. Кофе и расходники привезём вместе с мастером.
            </p>
          </div>
          <Link className={ui.btn} to={ROUTES.contacts.path}>
            Оставить заявку
          </Link>
        </div>
      </section>
    </>
  )
})
