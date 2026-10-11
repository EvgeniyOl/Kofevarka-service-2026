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

/**
 * Раздел «О нас»: как мастерская выросла из ремонта одной машины
 * в сервис с запчастями, выездом и продажей кофе.
 */
export class AboutStore {
  readonly intro =
    'Kofevarka Service начиналась с одного верстака и чужой кофемашины, которую принесли «посмотреть». Сейчас у нас мастерская на Декабристов, склад запчастей и выездные мастера — но правило то же: сначала диагноз, потом счёт.'

  readonly timeline: TimelineEntry[] = [
    {
      year: '2019',
      title: 'Первый верстак',
      text: 'Начали с ремонта бытовых кофемашин: один верстак, паяльник и первые заказы из объявлений.',
    },
    {
      year: '2021',
      title: 'Мастерская на Декабристов',
      text: 'Переехали в помещение на 90 м²: стенд для пролива, мойка и место под склад запчастей.',
    },
    {
      year: '2023',
      title: 'Кофейни и офисы',
      text: 'Взяли на обслуживание первые кофейни: выездной мастер, подменные аппараты и договоры на ТО.',
    },
    {
      year: '2026',
      title: 'Кофе и расходники',
      text: 'Добавили кофе и расходники: зерно обжарщиков, фильтры, средства от накипи и аксессуары — то, что сами ставим в машины.',
    },
  ]

  readonly team: TeamMember[] = [
    {
      name: 'Евгений Ольянский',
      role: 'мастер, гидравлика и бойлеры',
      text: 'Разбирает самые запущенные случаи: восстановил больше машин, чем кто-либо в Омске.',
      initials: 'ЕО',
    },
    {
      name: 'Полина Радецкая',
      role: 'приёмка и диагностика',
      text: 'Ведёт заявки, ставит диагноз и говорит честную цену до начала работ.',
      initials: 'ПР',
    },
    {
      name: 'Артём Ким',
      role: 'выездной мастер',
      text: 'Обслуживает кофейни и офисы: чистка, настройка помола и ремонт на месте.',
      initials: 'АК',
    },
  ]

  readonly numbers: AboutNumber[] = [
    { value: 7, suffix: 'лет', label: 'Ремонтируем кофемашины' },
    { value: 4200, suffix: 'машин', label: 'Вернули в работу' },
    { value: 6, suffix: 'месяцев', label: 'Гарантия на работы' },
    { value: 1, suffix: 'день', label: 'Срок диагностики' },
  ]

  readonly principles: string[] = [
    'Сначала диагностика и смета — ремонт только после согласования.',
    'Ставим оригинальные запчасти, изношенное показываем клиенту.',
    'После ремонта проливаем и настраиваем машину, а не просто отдаём.',
    'Даём 6 месяцев гарантии на работу и запчасти.',
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
