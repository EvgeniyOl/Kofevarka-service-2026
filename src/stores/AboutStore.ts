import { makeAutoObservable } from 'mobx'

export interface TimelineEntry {
  year: string
  title: string
  text: string
}

export interface TeamMember {
  name: string
  role: string
  text: string
  initials: string
}

export interface AboutNumber {
  value: number
  suffix: string
  label: string
}

/** Стор раздела «О нас»: история, команда, принципы */
export class AboutStore {
  readonly intro =
    'Kofevarka Service начиналась с ростера на 1 кг в гараже и трёх мешков эфиопики. Сейчас у нас мастерская на 12 кг, но правило то же: сначала чашка, потом продажи.'

  readonly timeline: TimelineEntry[] = [
    {
      year: '2019',
      title: 'Ростер на 1 кг',
      text: 'Первый барабанный ростер, первые 20 кг зелёного зерна и первые 40 подписчиков из местного чата.',
    },
    {
      year: '2021',
      title: 'Своя мастерская',
      text: 'Переехали в помещение на 90 м², поставили ростер на 6 кг и кухню для каппинга.',
    },
    {
      year: '2023',
      title: 'Прямые контракты',
      text: 'Поехали в Колумбию и Кению: подписали прямые контракты с двумя станциями обработки.',
    },
    {
      year: '2026',
      title: 'Ростер на 12 кг',
      text: 'Обжариваем 2400 кг в год, отправляем в 60 городов и учим варить кофе на бесплатных воркшопах.',
    },
  ]

  readonly team: TeamMember[] = [
    {
      name: 'Евгений Ольянский',
      role: 'ростер, Q-grader',
      text: 'Отвечает за профили обжарки и за то, чтобы партия не уехала клиенту недожатой.',
      initials: 'ЕО',
    },
    {
      name: 'Полина Радецкая',
      role: 'закупка зелёного',
      text: 'Ищет лоты, ведёт переписку со станциями и дегустирует образцы вслепую.',
      initials: 'ПР',
    },
    {
      name: 'Артём Ким',
      role: 'логистика и упаковка',
      text: 'Следит за датами обжарки, дегазационными клапанами и тем, чтобы посылка не ждала выходных.',
      initials: 'АК',
    },
  ]

  readonly numbers: AboutNumber[] = [
    { value: 12, suffix: 'кг', label: 'Мощность ростера' },
    { value: 60, suffix: 'городов', label: 'География отправок' },
    { value: 18, suffix: 'ферм', label: 'Прямые партнёры' },
    { value: 7, suffix: 'лет', label: 'На рынке спешелти' },
  ]

  readonly principles: string[] = [
    'Публикуем дату обжарки, а не дату фасовки.',
    'Не продаём лот, который не прошёл контроль в чашке.',
    'Пишем рецепт под каждый лот — не «варите как любите».',
    'Возвращаем деньги, если кофе приехал с браком упаковки.',
  ]

  activeYearIndex = 0

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get activeEntry(): TimelineEntry {
    return this.timeline[this.activeYearIndex] ?? this.timeline[0]
  }

  setActiveYear(index: number): void {
    this.activeYearIndex = Math.max(0, Math.min(this.timeline.length - 1, index))
  }
}
