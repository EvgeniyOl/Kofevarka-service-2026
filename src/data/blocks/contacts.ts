/**
 * Редактируемые тексты страницы «Контакты».
 *
 * Списки (способы связи и график работы) — отдельный механизм: они лежат
 * в базе и правятся по элементам, см. `data/lists.ts`.
 */
import type { EditableBlock } from '../blockTypes'

export const CONTACTS_BLOCKS: Record<string, EditableBlock> = {
  hero: {
    key: 'contacts.hero',
    name: 'Первый экран контактов',
    where: 'Страница «Контакты», начало',
    defaults: {
      kicker: 'Контакты',
      title: 'Ответит тот, кто сам чинит и варит',
      lead: 'Пишите и звоните по ремонту и кофе: подскажем по симптомам машины, подберём помол, соберём заказ и оставим его в мастерской на Декабристов.',
    },
    fields: [
      { field: 'kicker', label: 'Надзаголовок', max: 60 },
      { field: 'title', label: 'Заголовок', max: 200 },
      { field: 'lead', label: 'Описание', multiline: true, max: 600 },
    ],
  },

  form: {
    key: 'contacts.form',
    name: 'Форма обратной связи',
    where: 'Контакты, карточка с формой',
    defaults: {
      title: 'Форма обратной связи',
      success: 'Сообщение отправлено — ответим на почту в течение рабочего дня.',
      labelName: 'Имя',
      placeholderName: 'Как к вам обращаться',
      labelEmail: 'Почта',
      placeholderEmail: 'you@example.com',
      labelMessage: 'Сообщение',
      placeholderMessage: 'напишите ваш вопрос',
      submit: 'Отправить сообщение',
      sending: 'Отправляем…',
    },
    fields: [
      { field: 'title', label: 'Заголовок карточки', max: 120 },
      {
        field: 'success',
        label: 'Сообщение после отправки',
        multiline: true,
        max: 300,
      },
      { field: 'labelName', label: 'Подпись поля «Имя»', max: 60 },
      { field: 'placeholderName', label: 'Подсказка поля «Имя»', max: 120 },
      { field: 'labelEmail', label: 'Подпись поля «Почта»', max: 60 },
      { field: 'placeholderEmail', label: 'Подсказка поля «Почта»', max: 120 },
      { field: 'labelMessage', label: 'Подпись поля «Сообщение»', max: 60 },
      { field: 'placeholderMessage', label: 'Подсказка поля «Сообщение»', max: 120 },
      { field: 'submit', label: 'Надпись кнопки', max: 60 },
      { field: 'sending', label: 'Надпись во время отправки', max: 60 },
    ],
  },

  map: {
    key: 'contacts.map',
    name: 'Карта мастерской',
    where: 'Контакты, карточка с картой',
    defaults: {
      label: 'Мастерская · улица Декабристов, 116/1, 1 этаж',
      link: 'Открыть в Яндекс Картах',
      frameTitle: 'Мастерская на карте: улица Декабристов, 116/1, Омск',
    },
    fields: [
      { field: 'label', label: 'Подпись под картой', max: 200 },
      { field: 'link', label: 'Надпись ссылки', max: 60 },
      {
        field: 'frameTitle',
        label: 'Название карты для незрячих',
        hint: 'Читают программы экранного доступа, на вид не влияет',
        max: 200,
      },
    ],
  },

  hours: {
    key: 'contacts.hours',
    name: 'Часы работы',
    where: 'Контакты, карточка с графиком',
    defaults: {
      title: 'Часы работы',
      note: 'Забрать заказ можно в рабочие часы: назовите номер заказа на входе.',
    },
    fields: [
      { field: 'title', label: 'Заголовок', max: 120 },
      { field: 'note', label: 'Примечание', multiline: true, max: 400 },
    ],
  },
}
