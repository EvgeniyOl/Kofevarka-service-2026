# Kofevarka Service

Сайт мастерской по ремонту кофемашин и магазина кофе: **React + Vite + MobX + TypeScript**,
маршрутизация на `react-router`, стили на CSS Modules, линт ESLint + Prettier, pre-commit хук.

Два направления бизнеса:

- **Ремонт** — бытовые и профессиональные кофемашины, кофемолки и техника для кофеен,
  обслуживание по договору и выезд мастера.
- **Продажа** — кофемашины и кофемолки с гарантией, зерно от обжарщиков, расходники и аксессуары.

Своей обжарки у мастерской нет: кофе закупается у поставщиков, а весь сервис построен вокруг
ремонта и подбора техники.

## Стек

| Слой      | Технология                                  |
| --------- | ------------------------------------------- |
| UI        | React 19                                    |
| Язык      | TypeScript 6.0 (strict)                     |
| Сборка    | Vite                                        |
| Роутинг   | react-router                                |
| Состояние | MobX + mobx-react-lite                      |
| Стили     | CSS Modules (`*.module.css`)                |
| Линт      | ESLint 10 (flat config) + typescript-eslint |
| Формат    | Prettier 3                                  |
| Коммит    | husky + lint-staged (pre-commit)            |

## Команды

```bash
npm install          # установить зависимости
npm run dev          # dev-сервер (http://localhost:5000)
npm run lint         # ESLint по всему проекту
npm run lint:fix     # ESLint с автоисправлением
npm run format       # Prettier: отформатировать всё
npm run format:check # Prettier: проверить стиль, ничего не меняя
npm run typecheck    # проверка типов (tsc -b)
npm run build        # проверка типов + production-сборка в dist
npm run preview      # локальный просмотр собранной версии
```

## Разделы, страницы и сторы

У каждого раздела свой компонент страницы и свой стор. Корзины нет: сайт
информационный, заказы принимаем по телефону и заявкой. Всё связывается
в `RootStore` (`src/stores/index.ts`).

| Маршрут         | Страница                 | Стор                | Что умеет                                                        |
| --------------- | ------------------------ | ------------------- | ---------------------------------------------------------------- |
| `/`             | `pages/HomePage`         | `HomeStore`         | герой про ремонт и кофе, избранное, порядок работ, цифры, отзывы |
| `/repair`       | `pages/RepairPage`       | `RepairStore`       | направления ремонта, этапы, цены, гарантия, FAQ                  |
| `/catalog`      | `pages/CatalogPage`      | `CatalogStore`      | поиск, фильтры по разделу и обжарке, сортировка, цены            |
| `/subscription` | `pages/SubscriptionPage` | `SubscriptionStore` | конструктор плана, расчёт цены, скидки и даты следующей доставки |
| `/about`        | `pages/AboutPage`        | `AboutStore`        | история по годам, принципы, команда                              |
| `/delivery`     | `pages/DeliveryPage`     | `DeliveryStore`     | условия доставки по Омску, подписка, FAQ-аккордеон               |
| `/contacts`     | `pages/ContactsPage`     | `ContactsStore`     | каналы связи, форма с валидацией, карта Яндекса                  |
| `*`             | `pages/NotFoundPage`     | —                   | 404                                                              |

Точка входа — `src/app/router.tsx` (маршруты), каркас с шапкой —
`src/app/Layout.tsx`, справочник путей для меню — `src/app/routes.ts`.

## Структура

```
Kofevarka/
├─ index.html               # HTML-точка входа
├─ vite.config.ts           # конфигурация Vite (порт 5000)
├─ eslint.config.js         # flat-конфиг ESLint
├─ prettier.config.js       # настройки Prettier
├─ lint-staged.config.js    # что делать с файлами из индекса
├─ tsconfig*.json           # конфиги TypeScript (app / node)
├─ .husky/pre-commit        # хук: lint-staged + typecheck
├─ AGENTS.md                # правила проекта для ИИ-агентов (язык, стили, состояние, проверки)
├─ public/coffee.svg        # иконка
└─ src/
   ├─ main.tsx              # бутстрап React + StoreProvider + AppRouter
   ├─ index.css             # глобально: сброс, токены, keyframes
   ├─ app/
   │  ├─ router.tsx         # маршруты приложения
   │  ├─ Layout.tsx         # шапка, содержимое раздела, title вкладки
   │  └─ routes.ts          # справочник путей и подписей
   ├─ components/           # Header, ProductCard, CupArt, Reveal, Logo, …
   ├─ data/products.ts      # каталог: техника, кофе, расходники — цены и варианты
   ├─ data/contacts.ts      # телефоны, почта и адрес мастерской
   ├─ pages/                # по паре .tsx + .module.css на раздел
   ├─ stores/               # по стору на раздел + RootStore
   ├─ styles/ui.module.css  # общие примитивы (кнопки, карточки, сетки)
   └─ utils/cx.ts           # склейка классов
```

## Дизайн: на чём основан

Перед версткой разобрали, как устроены популярные магазины кофе. Ориентиры:
Blue Bottle, Stumptown, Intelligentsia, Counter Culture, La Colombe, Peet’s,
Nespresso, Lavazza, Illy, Trade Coffee. Из живых примеров — 1790 Coffee
(нарративные «сцены» вместо плоских пакетов), Couplet Coffee (бегущая строка и
неоновые блоки), CONA (рисованные иллюстрации), Damn Fine Coffee Bar (контрастный
чёрный с акцентом).

Что взяли из разбора рынка ([CommerceRank, 2026](https://www.commercerank.ai/guides/themes/best-coffee-themes)):

- **история происхождения и обжарки поставщика** вместо абстрактных описаний;
- **выбор помола и объёма** прямо в карточке;
- **цена за 100 г** рядом с ценой за пакет — честное сравнение 250 г / 500 г / 1 кг;
- **подписка** как основной сценарий повторной покупки;
- **brew-гайды** (рецепты под способ заваривания) — контент, который возвращает клиента;
- **тёплая тёмная палитра**: эспрессо-база, крем, карамельный акцент.

Для сервисного направления добавили то, что спрашивают до звонка: срок диагностики,
ориентиры по цене, гарантию на работы и понятный порядок ремонта.

Отдельно учли главную проблему категории: у кофейных магазинов средний PageSpeed 55 —
их тормозят тяжёлые hero-видео и фото. Поэтому основной визуал сделан на CSS и SVG:
«сцены» карточек — градиенты, чашка — инлайновый SVG с анимацией пара. Фотографии
появились позже и только там, где нужны: герой главной и три карточки витрины
(источники и лицензии — в `public/photos/CREDITS.md`).

Анимации: появление блоков через `IntersectionObserver` (`Reveal`), набегающие цифры,
пар над чашкой, hover-подъёмы карточек, искры в сцене кузнеца.
Всё уважает системную настройку `prefers-reduced-motion`.

## Как работать с состоянием

1. Состояние раздела живёт в его сторе (`src/stores`), а не в компоненте.
   Локальный `useState` допустим только для чисто интерфейсных вещей вроде
   открытого мобильного меню.
2. Новый раздел — новый стор-класс, подключённый в `RootStore`.
3. Компонент оборачивается в `observer(...)` и получает сторы через `useStore()`:

```tsx
import { useStore } from '../stores/context'

const { catalog } = useStore()
```

4. Изменять состояние можно только методами (action) стора — так MobX корректно
   пересчитает computed-значения (суммы, скидки, прогресс) и перерисует компоненты.
5. В тестах удобно подставить свой набор сторов: `<StoreProvider store={mockStore}>`.

## Как работать со стилями

Все компонентные стили — только CSS Modules:

```tsx
import styles from './App.module.css'

export function Page() {
  return <main className={styles.page}>…</main>
}
```

Правила:

1. Файл стилей лежит рядом с компонентом и называется `<Компонент>.module.css`.
2. Классы объявляются без БЭМ-разделителей (`-`, `__`) — `camelCase` или одно слово.
3. Глобальным остаётся единственный файл `src/index.css` (сброс, токены, keyframes).
4. Общие примитивы (кнопки, карточки, поля, сетки) живут в `src/styles/ui.module.css` —
   это тоже модуль, просто один на проект.
5. Динамические классы собираются через `cx(...)` из `src/utils/cx.ts`.

## Линтинг и форматирование

- `eslint.config.js`: `js.configs.recommended`, `tseslint.configs.recommended`,
  `reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite`, а последним —
  `eslint-config-prettier` (гасит правила, конфликтующие с Prettier).
- Правила намеренно без проверки типов. Для `no-floating-promises` и подобных нужно
  перейти на `tseslint.configs.recommendedTypeChecked` + `projectService: true`.
- Fast Refresh требует, чтобы файл с компонентом экспортировал только компоненты —
  поэтому хук `useStore` живёт в `stores/context.ts`, а провайдер в `StoreProvider.tsx`.

## Pre-commit

`.husky/pre-commit` (активируется на `npm install` через `prepare`) выполняет:

1. `npx --no-install lint-staged` — по файлам из индекса: `eslint --fix` и
   `prettier --write` для кода, `prettier --write` для стилей, разметки и JSON
   (кроме `package-lock.json`);
2. `npm run typecheck` — типы по всему проекту.

Обойти хук для одного коммита: `git commit --no-verify`.

## TypeScript

- `strict` плюс `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`.
- `verbatimModuleSyntax`: типы импортируются только как типы.
- Версия 6.0.3 — самая новая из поддерживаемых `typescript-eslint`
  (`>=4.8.4 <6.1.0`). В TS 7 нет классического JS API, на котором держится линтер:
  [issue #12720](https://github.com/typescript-eslint/typescript-eslint/issues/12720).
