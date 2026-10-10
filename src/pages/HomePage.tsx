import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { CupArt } from '../components/CupArt'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { StatValue } from '../components/StatValue'
import { GRIND_OPTIONS, SIZE_OPTIONS, formatPrice, priceFor } from '../data/products'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './HomePage.module.css'

/** Главная: герой, бегущая строка, избранное, подход, цифры и отзывы */
export const HomePage = observer(function HomePage() {
  const { home } = useStore()
  const cheapest = home.featured.reduce(
    (min, product) => Math.min(min, priceFor(product, home.size)),
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
              <Link className={ui.btn} to={ROUTES.catalog.path}>
                Смотреть витрину
              </Link>
              <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.subscription.path}>
                Оформить подписку
              </Link>
            </div>

            <dl className={styles.heroFacts}>
              <div>
                <dt>Ближайшая обжарка</dt>
                <dd>вторник, 09:00</dd>
              </div>
              <div>
                <dt>Цена от</dt>
                <dd>{formatPrice(cheapest === Number.POSITIVE_INFINITY ? 640 : cheapest)}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>от 2500 ₽ — бесплатно</dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroArt}>
            <CupArt scene={['#4a2c1c', '#a35a30']} variant="hero" />
            <span className={cx(styles.floatCard, styles.floatTop)}>
              <b>Обжарка</b> пятница, 21:40
            </span>
            <span className={cx(styles.floatCard, styles.floatBottom)}>
              <b>48 часов</b> от ростера до курьера
            </span>
          </div>
        </div>
      </section>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {[...home.marquee, ...home.marquee].map((item, index) => (
            <span key={`${item}-${index}`} className={styles.marqueeItem}>
              {item}
              <i />
            </span>
          ))}
        </div>
      </div>

      <section className={ui.section}>
        <div className={ui.container}>
          <div className={styles.featuredHead}>
            <SectionHeading
              kicker="Витрина"
              title="Лоты этой недели"
              lead="Восемь позиций в постоянном меню. Объём и помол выбираются здесь — карточки сразу посчитают цену и цену за 100 грамм."
            />
            <Link className={cx(ui.btn, ui.btnGhost)} to={ROUTES.catalog.path}>
              Вся витрина
            </Link>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.toolGroup}>
              <span className={styles.toolLabel}>Объём</span>
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cx(styles.tool, home.size === option.value && styles.toolActive)}
                  onClick={() => home.setSize(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className={styles.toolGroup}>
              <span className={styles.toolLabel}>Помол</span>
              {GRIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cx(styles.tool, home.grind === option.value && styles.toolActive)}
                  onClick={() => home.setGrind(option.value)}
                  title={option.hint}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.cards}>
            {home.featured.map((product, index) => (
              <Reveal key={product.id} delay={index * 80}>
                <ProductCard
                  product={product}
                  size={home.size}
                  onAdd={() => home.addToCart(product.id)}
                />
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
          <div>
            <SectionHeading
              kicker="Процесс"
              title="Путь зерна до вашей посылки"
              lead="Каждый лот проходит три контрольные точки. Если партия не проходит третью — в продажу она не попадает."
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

          <Reveal>
            <div className={cx(ui.card, styles.brew)}>
              <h3 className={styles.brewTitle}>Рецепт под способ заваривания</h3>
              <div className={styles.brewTabs}>
                {home.brews.map((brew) => (
                  <button
                    key={brew.id}
                    type="button"
                    className={cx(
                      styles.brewTab,
                      home.activeBrewId === brew.id && styles.brewTabActive,
                    )}
                    onClick={() => home.setBrew(brew.id)}
                  >
                    {brew.label}
                  </button>
                ))}
              </div>
              <dl className={styles.brewGrid} key={home.activeBrewId}>
                <div>
                  <dt>Пропорция</dt>
                  <dd>{home.activeBrew.ratio}</dd>
                </div>
                <div>
                  <dt>Время</dt>
                  <dd>{home.activeBrew.time}</dd>
                </div>
                <div>
                  <dt>Температура</dt>
                  <dd>{home.activeBrew.temp}</dd>
                </div>
              </dl>
              <p className={ui.muted}>
                Начните с этих значений, потом двигайте помол: быстрее 2:30 — крупнее, дольше 3:10 —
                мельче.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={styles.statsBand}>
        <div className={cx(ui.container, styles.stats)}>
          {home.stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <span className={styles.statValue}>
                <StatValue value={stat.value} suffix={stat.suffix} />
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.container}>
          <SectionHeading
            kicker="Отзывы"
            title="Что говорят те, кто варит дома и в кофейнях"
            align="center"
          />
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
              Кофе закончится в самый неподходящий день
            </h2>
            <p className={ui.lead}>
              Подписка привозит свежую обжарку по расписанию: выбираете объём, помол и ритм — дальше
              мы сами.
            </p>
          </div>
          <Link className={ui.btn} to={ROUTES.subscription.path}>
            Собрать подписку
          </Link>
        </div>
      </section>
    </>
  )
})
