import { makeAutoObservable } from 'mobx'

export type ContactTopic = 'order' | 'wholesale' | 'workshop' | 'other'

export interface ContactFields {
  name: string
  email: string
  topic: ContactTopic
  message: string
}

export type ContactErrors = Partial<Record<keyof ContactFields, string>>

export interface ContactChannel {
  icon: string
  title: string
  value: string
  hint: string
  href?: string
}

export const TOPICS: ReadonlyArray<{ value: ContactTopic; label: string }> = [
  { value: 'order', label: 'Вопрос по заказу' },
  { value: 'wholesale', label: 'Опт и кофейни' },
  { value: 'workshop', label: 'Воркшоп и обучение' },
  { value: 'other', label: 'Другое' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Стор контактов: форма с валидацией и подписка на письма */
export class ContactsStore {
  readonly channels: ContactChannel[] = [
    {
      icon: '📍',
      title: 'Мастерская',
      value: 'Улица Декабристов, 116/1, 1 этаж',
      hint: 'Центральный округ, Омск, 644046',
    },
    {
      icon: '📞',
      title: 'Справочная',
      value: '+7 (3812) 38-13-76',
      hint: 'Пн–сб 10:00–19:30',
      href: 'tel:+73812381376',
    },
    {
      icon: '🧾',
      title: 'Отдел продаж',
      value: '+7 903 927-13-76',
      hint: '+7 913 634-30-85',
    },
    {
      icon: '✉️',
      title: 'Почта',
      value: 'kofevarkaservice@yandex.ru',
      hint: 'Опт, сотрудничество и пресса',
      href: 'mailto:kofevarkaservice@yandex.ru',
    },
    {
      icon: '☕',
      title: 'Дегустации',
      value: 'Каждую субботу в 12:00',
      hint: 'Бесплатно, по 8 человек, нужна запись',
    },
  ]

  readonly hours: Array<{ day: string; time: string }> = [
    { day: 'Пн — Пт', time: '10:00 — 19:00' },
    { day: 'Суббота', time: '10:00 — 17:00' },
    { day: 'Воскресенье', time: 'выходной' },
  ]

  form: ContactFields = { name: '', email: '', topic: 'order', message: '' }
  touched: Record<keyof ContactFields, boolean> = {
    name: false,
    email: false,
    topic: false,
    message: false,
  }
  submitted = false
  newsletterEmail = ''
  newsletterDone = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get errors(): ContactErrors {
    const result: ContactErrors = {}
    const { name, email, message } = this.form

    if (name.trim().length < 2) result.name = 'Как к вам обращаться?'
    if (!EMAIL_RE.test(email.trim())) result.email = 'Проверьте адрес почты'
    if (message.trim().length < 10)
      result.message = 'Пара предложений о задаче — минимум 10 символов'

    return result
  }

  get isValid(): boolean {
    return Object.keys(this.errors).length === 0
  }

  /** Ошибку показываем только после того, как поле тронули */
  errorFor(field: keyof ContactFields): string | null {
    if (!this.touched[field]) return null
    return this.errors[field] ?? null
  }

  setField<K extends keyof ContactFields>(field: K, value: ContactFields[K]): void {
    this.form[field] = value
    this.submitted = false
  }

  touch(field: keyof ContactFields): void {
    this.touched[field] = true
  }

  submit(): boolean {
    this.touched = { name: true, email: true, topic: true, message: true }

    if (!this.isValid) return false

    this.submitted = true
    this.form = { name: '', email: '', topic: 'order', message: '' }
    this.touched = { name: false, email: false, topic: false, message: false }
    return true
  }

  setNewsletterEmail(value: string): void {
    this.newsletterEmail = value
    this.newsletterDone = false
  }

  get newsletterValid(): boolean {
    return EMAIL_RE.test(this.newsletterEmail.trim())
  }

  subscribeNewsletter(): boolean {
    if (!this.newsletterValid) return false
    this.newsletterDone = true
    this.newsletterEmail = ''
    return true
  }
}
