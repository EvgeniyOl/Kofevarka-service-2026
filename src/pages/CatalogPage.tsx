import { observer } from 'mobx-react-lite'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import {
  GRIND_OPTIONS,
  ROAST_LABELS,
  VARIANT_OPTIONS,
  pricePer100,
  type Roast,
} from '../data/products'
import { CATEGORY_FILTERS, SORT_OPTIONS } from '../stores/CatalogStore'
import { useStore } from '../stores/context'
import { cx } from '../utils/cx'
import ui from '../styles/ui.module.css'
import styles from './CatalogPage.module.css'

const ROAST_FILTERS: ReadonlyArray<{ value: Roast | 'all'; label: string }> = [
  { value: 'all', label: 'Любая' },
  { value: 1, label: ROAST_LABELS[1] },
  { value: 2, label: ROAST_LABELS[2] },
  { value: 3, label: ROAST_LABELS[3] },
  { value: 4, label: ROAST_LABELS[4] },
  { value: 5, label: ROAST_LABELS[5] },
]

const GRIND_LABELS: Record<string, string> = Object.fromEntries(
  GRIND_OPTIONS.map((option) => [option.value, option.label]),
)

/**
 * Витрина: техника, кофе и расходники. Поиск, фильтр по категории и обжарке,
 * сортировка. Объём и помол относятся только к кофе —
 * для остальных категорий скрыты.
 */
export const CatalogPage = observer(function CatalogPage() {
  const { catalog } = useStore()

  return (
    <section className={cx(ui.container, styles.page)}>
      <SectionHeading
        kicker="Витрина"
        title="Кофемашины, кофе и всё для ухода"
        lead="Ремонтируем кофемашины и продаём то, что проверяем в своей мастерской: технику с гарантией, зерно от проверенных обжарщиков и расходники. Цена кофе пересчитывается под объём, рядом всегда цена за 100 грамм."
      />

      <div className={cx(ui.card, styles.toolbar)}>
        <div className={styles.row}>
          <label className={styles.search}>
            <span className={styles.label}>Поиск</span>
            <input
              className={ui.input}
              type="search"
              value={catalog.search}
              onChange={(event) => catalog.setSearch(event.target.value)}
              placeholder="кофемолка, Кения, средство от накипи…"
            />
          </label>

          <label className={styles.select}>
            <span className={styles.label}>Сортировка</span>
            <select
              className={ui.input}
              value={catalog.sort}
              onChange={(event) =>
                catalog.setSort(event.target.value as (typeof SORT_OPTIONS)[number]['value'])
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <div className={styles.group}>
            <span className={styles.label}>Раздел</span>
            <div className={styles.chips}>
              {CATEGORY_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cx(
                    styles.chip,
                    catalog.category === option.value && styles.chipActive,
                  )}
                  onClick={() => catalog.setCategory(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {catalog.coffeeFiltersAvailable ? (
            <div className={styles.group}>
              <span className={styles.label}>Обжарка</span>
              <div className={styles.chips}>
                {ROAST_FILTERS.map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={cx(styles.chip, catalog.roast === option.value && styles.chipActive)}
                    onClick={() => catalog.setRoast(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.group}>
            <span className={styles.label}>Объём кофе</span>
            <div className={styles.chips}>
              {VARIANT_OPTIONS.coffee.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cx(
                    styles.chip,
                    catalog.coffeeSize === option.value && styles.chipActive,
                  )}
                  onClick={() => catalog.setCoffeeSize(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.label}>Помол</span>
            <div className={styles.chips}>
              {GRIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cx(styles.chip, catalog.grind === option.value && styles.chipActive)}
                  onClick={() => catalog.setGrind(option.value)}
                  title={option.hint}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={catalog.decafOnly}
              onChange={() => catalog.toggleDecaf()}
            />
            <span>Только без кофеина</span>
          </label>
        </div>

        <div className={styles.summary}>
          <span className={ui.muted}>
            Найдено {catalog.visibleCount} из {catalog.totalCount} · {catalog.categorySummary}
            {catalog.coffeeFiltersAvailable ? ` · обжарка: ${catalog.roastSummary}` : ''}
          </span>
          {catalog.hasFilters ? (
            <button type="button" className={styles.reset} onClick={() => catalog.resetFilters()}>
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </div>

      {catalog.visibleCount > 0 ? (
        <div className={styles.cards}>
          {catalog.visible.map((product, index) => {
            const isCoffee = product.category === 'coffee'
            const variant = isCoffee ? catalog.coffeeSize : '1'

            return (
              <Reveal key={product.id} delay={index * 60}>
                <ProductCard
                  product={product}
                  variant={variant}
                  grindLabel={isCoffee ? GRIND_LABELS[catalog.grind] : undefined}
                  per100={isCoffee ? pricePer100(product, variant) : null}
                />
              </Reveal>
            )
          })}
        </div>
      ) : (
        <div className={cx(ui.card, styles.empty)}>
          <h3 className={styles.emptyTitle}>Под такие условия ничего не нашлось</h3>
          <p className={ui.muted}>
            Попробуйте убрать часть фильтров — например, выбрать другой раздел или расширить
            обжарку.
          </p>
          <button type="button" className={ui.btn} onClick={() => catalog.resetFilters()}>
            Сбросить фильтры
          </button>
        </div>
      )}
    </section>
  )
})
