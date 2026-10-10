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
      value: 'ул. Обжарочная, 12, корпус 3',
      hint: 'Пн–Пт 10:00–19:00, забор заказов до 18:30',
    },
    {
      icon: '📞',
      title: 'Телефон',
      value: '+7 (900) 123-45-67',
      hint: 'Отвечаем с 9:00 до 20:00, без ботов',
      href: 'tel:+79001234567',
    },
    {
      icon: '✉️',
      title: 'Почта',
      value: 'hello@kofevarka.service',
      hint: 'Опт, сотрудничество и пресса',
      href: 'mailto:hello@kofevarka.service',
    },
    {
      icon: '☕',
      title: 'Дегустации',
      value: 'Каждую субботу в 12:00',
      hint: 'Бесплатно, по 8 человек, нужна запись',
    },
  ]

  readonly hours: Array<{ day: string; time: string }> = [
    { day: 'Понедельник — пятница', time: '10:00 — 19:00' },
    { day: 'Суббота', time: '11:00 — 17:00' },
    { day: 'Воскресенье', time: 'закрыто' },
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
