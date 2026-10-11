import { makeAutoObservable } from 'mobx'
import {
  CONTACT_ADDRESS,
  CONTACT_ADDRESS_HINT,
  CONTACT_EMAIL,
  CONTACT_HOURS_SHORT,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_SALES_PHONE,
  CONTACT_SALES_PHONE_EXTRA,
} from '../data/contacts'

export interface ContactFields {
  name: string
  email: string
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REQUIRED = 'обязательно для заполнения'

/** Стор контактов: справочные данные и форма заявки с валидацией */
export class ContactsStore {
  readonly channels: ContactChannel[] = [
    {
      icon: '📍',
      title: 'Мастерская',
      value: CONTACT_ADDRESS,
      hint: CONTACT_ADDRESS_HINT,
    },
    {
      icon: '📞',
      title: 'Справочная',
      value: CONTACT_PHONE,
      hint: CONTACT_HOURS_SHORT,
      href: `tel:${CONTACT_PHONE_HREF}`,
    },
    {
      icon: '🧾',
      title: 'Отдел продаж',
      value: CONTACT_SALES_PHONE,
      hint: CONTACT_SALES_PHONE_EXTRA,
    },
    {
      icon: '✉️',
      title: 'Почта',
      value: CONTACT_EMAIL,
      hint: 'Опт, сотрудничество и пресса',
      href: `mailto:${CONTACT_EMAIL}`,
    },
  ]

  readonly hours: Array<{ day: string; time: string }> = [
    { day: 'Пн — Пт', time: '10:00 — 19:00' },
    { day: 'Суббота', time: '10:00 — 17:00' },
    { day: 'Воскресенье', time: 'выходной' },
  ]

  form: ContactFields = { name: '', email: '', message: '' }
  touched: Record<keyof ContactFields, boolean> = {
    name: false,
    email: false,
    message: false,
  }
  submitted = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get errors(): ContactErrors {
    const result: ContactErrors = {}
    const { name, email, message } = this.form

    // Пустое поле и слишком короткое значение подсвечиваем одинаково:
    // «обязательно для заполнения» — понятнее, чем подсказка про длину
    if (name.trim().length < 2) result.name = REQUIRED
    if (email.trim().length === 0) result.email = REQUIRED
    else if (!EMAIL_RE.test(email.trim())) result.email = 'Проверьте адрес почты'
    if (message.trim().length < 2) result.message = REQUIRED

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
    this.touched = { name: true, email: true, message: true }

    if (!this.isValid) return false

    this.submitted = true
    this.form = { name: '', email: '', message: '' }
    this.touched = { name: false, email: false, message: false }
    return true
  }
}
