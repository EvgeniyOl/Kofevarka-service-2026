import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'
import { ROUTES } from '../app/routes'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './AboutPage.module.css'

/** О нас: история по годам, принципы и команда мастерской */
export const AboutPage = observer(function AboutPage() {
  const { about } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="О нас"
        title="Мастерская обжарки, а не отдел маркетинга"
        lead={about.intro}
      />

      <div className={styles.numbers}>
        {about.numbers.map((item, index) => (
          <Reveal key={item.label} delay={index * 70}>
            <div className={cx(ui.card, styles.number)}>
              <span className={styles.numberValue}>
                {item.value}
                {item.suffix}
              </span>
              <span className={ui.muted}>{item.label}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <div className={styles.timelineBlock}>
        <h3 className={styles.blockTitle}>Как мы к этому пришли</h3>
        <div className={styles.timeline}>
          <ol className={styles.years}>
            {about.timeline.map((entry, index) => (
              <li key={entry.year}>
                <button
                  type="button"
                  className={cx(styles.year, about.activeYearIndex === index && styles.yearActive)}
                  onClick={() => about.setActiveYear(index)}
                >
                  <span className={styles.yearDot} />
                  {entry.year}
                </button>
              </li>
            ))}
          </ol>

          <article className={cx(ui.card, styles.entry)} key={about.activeEntry.year}>
            <span className={styles.entryYear}>{about.activeEntry.year}</span>
            <h4 className={styles.entryTitle}>{about.activeEntry.title}</h4>
            <p className={ui.muted}>{about.activeEntry.text}</p>
          </article>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <h3 className={styles.blockTitle}>Принципы, которые не обсуждаются</h3>
          <ul className={styles.principles}>
            {about.principles.map((principle, index) => (
              <Reveal key={principle} delay={index * 60}>
                <li className={styles.principle}>
                  <span aria-hidden="true">✓</span>
                  {principle}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={styles.blockTitle}>Кто жарит</h3>
          <div className={styles.team}>
            {about.team.map((member, index) => (
              <Reveal key={member.name} delay={index * 70}>
                <article className={cx(ui.card, styles.member)}>
                  <span className={styles.avatar} aria-hidden="true">
                    {member.initials}
                  </span>
                  <div>
                    <h4 className={styles.memberName}>{member.name}</h4>
                    <span className={styles.memberRole}>{member.role}</span>
                    <p className={ui.muted}>{member.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className={cx(ui.card, styles.cta)}>
        <div>
          <h3 className={cx(ui.title, styles.ctaTitle)}>Приходите на дегустацию в мастерскую</h3>
          <p className={ui.lead}>
            По субботам в 12:00 разбираем четыре лота и три способа заваривания. Бесплатно, восемь
            мест, нужна запись.
          </p>
        </div>
        <Link className={ui.btn} to={ROUTES.contacts.path}>
          Записаться
        </Link>
      </div>
    </section>
  )
})
