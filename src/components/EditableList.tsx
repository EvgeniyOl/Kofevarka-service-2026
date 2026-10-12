import { observer } from 'mobx-react-lite'
import { Fragment, useState, type ReactNode } from 'react'
import { useStore } from '../stores/context'
import type { ListedItem } from '../stores/ItemsStore'
import type { ListConfig } from '../data/lists'
import { EditableItem, ItemForm } from './EditableItem'
import styles from './EditableItem.module.css'

interface EditableListProps {
  config: ListConfig
  /** Класс контейнера: сетку или список задаёт страница */
  className?: string
  /** Тег контейнера: для нумерованных и маркированных списков важна семантика */
  container?: 'div' | 'ul' | 'ol'
  /** Обёртка появления вокруг элемента */
  wrapper?: (children: ReactNode, index: number) => ReactNode
  /** Как показать элемент: страница рисует свою разметку */
  children: (item: ListedItem, index: number) => ReactNode
}

/**
 * Список с правкой элементов прямо на странице.
 *
 * Админ получает у каждого элемента кнопки «Изменить» и «Удалить», а под
 * списком — плитку добавления. Посетитель видит обычные карточки: ни кнопок,
 * ни формы он не замечает.
 *
 * Пока список не наполнен в базе, элементы берутся из кода: их видно,
 * но изменить нельзя — идентификаторов для правки ещё нет. Наполняет базу
 * админ при первой загрузке страницы.
 */
export const EditableList = observer(function EditableList({
  config,
  className,
  container = 'div',
  wrapper,
  children,
}: EditableListProps) {
  const { items, auth } = useStore()
  const [adding, setAdding] = useState(false)

  const list = items.items(config.key, config.defaults)
  const canEdit = auth.isAdmin && items.editable(config.key)

  const Container = container

  return (
    <>
      <Container className={className}>
        {list.map((item, index) => {
          const view = children(item, index)
          const key = item.id ?? `default-${index}`

          if (!canEdit) {
            const inner = <div className={styles.item}>{view}</div>
            return <Fragment key={key}>{wrapper ? wrapper(inner, index) : inner}</Fragment>
          }

          return (
            <EditableItem
              key={key}
              config={config}
              item={item}
              wrapper={wrapper ? (node) => wrapper(node, index) : undefined}
            >
              {view}
            </EditableItem>
          )
        })}
      </Container>

      {/*
        Форму добавления и плитку держим вне контейнера: если список — сетка
        с auto-fit, лишний элемент схлопывается в колонку нулевой ширины,
        и кнопка пропадает с экрана.
      */}
      {canEdit && adding ? (
        <ItemForm
          config={config}
          initial={{}}
          submitLabel={config.addLabel}
          onSubmit={async (values) => {
            const ok = await items.add(config.key, values)
            if (ok) setAdding(false)
            return ok
          }}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      {canEdit && !adding ? (
        <button
          type="button"
          className={styles.addCard}
          onClick={() => {
            items.clearError()
            setAdding(true)
          }}
        >
          <span className={styles.addIcon} aria-hidden="true">
            +
          </span>
          <span className={styles.addText}>{config.addLabel}</span>
        </button>
      ) : null}

      {auth.isAdmin && !items.editable(config.key) ? (
        <p className={styles.notice}>
          Список ещё не перенесён в базу: обновите страницу, и элементы можно будет править.
        </p>
      ) : null}
    </>
  )
})
