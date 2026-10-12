/**
 * Редактируемые тексты служебных страниц и карточки товара.
 *
 * Товары живут в коде (`data/products.ts`): это структурированные данные
 * с ценами и характеристиками, а не текст страницы. Но подписи вокруг них —
 * «Уточнить наличие», «обжарка», «Гарантия» — это контент, и админ их правит.
 */
import type { EditableBlock } from '../blockTypes'

export const COMMON_BLOCKS: Record<string, EditableBlock> = {
  notFound: {
    key: 'notfound.page',
    name: 'Страница 404',
    where: 'Показывается, если адрес не найден',
    defaults: {
      title: 'Такой страницы у нас не заварилось',
      lead: 'Возможно, ссылка устарела или в адресе опечатка. Начните с главной — там всё на месте.',
      actionHome: 'На главную',
      actionContacts: 'Связаться с нами',
    },
    fields: [
      { field: 'title', label: 'Заголовок', max: 200 },
      { field: 'lead', label: 'Описание', multiline: true, max: 400 },
      { field: 'actionHome', label: 'Первая кнопка', hint: 'Ведёт на главную', max: 60 },
      { field: 'actionContacts', label: 'Вторая кнопка', hint: 'Ведёт на контакты', max: 60 },
    ],
  },
}
