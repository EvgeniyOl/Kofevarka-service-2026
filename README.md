# Kofevarka Service

Приложение для продажи кофейка: **React + Vite + MobX + TypeScript**.

## Стек

| Слой      | Технология                                  |
| --------- | ------------------------------------------- |
| UI        | React 19                                    |
| Язык      | TypeScript 6.0 (strict)                     |
| Сборка    | Vite                                        |
| Состояние | MobX + mobx-react-lite                      |
| Стили     | CSS Modules (`*.module.css`)                |
| Линт      | ESLint 10 (flat config) + typescript-eslint |
| Формат    | Prettier 3                                  |
| Коммит    | husky + lint-staged (pre-commit)            |

## Команды

```bash
npm install         # установить зависимости
npm run dev         # dev-сервер (http://localhost:5000)
npm run lint        # ESLint по всему проекту
npm run lint:fix    # ESLint с автоисправлением
npm run format      # Prettier: отформатировать всё
npm run format:check # Prettier: проверить стиль, ничего не меняя
npm run typecheck   # проверка типов (tsc -b)
npm run build       # проверка типов + production-сборка в dist
npm run preview     # локальный просмотр собранной версии
```

## Структура

```
Kofevarka/
├─ index.html               # HTML-точка входа
├─ vite.config.ts           # конфигурация Vite (порт 5000)
├─ eslint.config.js         # flat-конфиг ESLint
├─ prettier.config.js       # настройки Prettier
├─ lint-staged.config.js    # что делать с файлами из индекса
├─ .prettierignore          # что Prettier не трогает
├─ .gitattributes           # переводы строк: всегда LF
├─ .husky/
│  └─ pre-commit            # хук: lint-staged + typecheck
├─ tsconfig.json            # корневой конфиг: ссылки на два проекта
├─ tsconfig.app.json        # настройки для src (DOM, strict, vite/client)
├─ tsconfig.node.json       # настройки для vite.config.ts
├─ public/
│  └─ coffee.svg            # иконка
└─ src/
   ├─ main.tsx              # бутстрап React + StoreProvider
   ├─ App.tsx               # страница «Продажа кофейка» (observer)
   ├─ App.module.css        # стили страницы (CSS Modules)
   ├─ index.css             # глобальные стили: сброс и токены
   ├─ vite-env.d.ts         # типы Vite: импорт css, import.meta.env
   └─ stores/
      ├─ CoffeeStore.ts     # состояние продаж (MobX)
      ├─ index.ts           # RootStore + инстанс rootStore
      ├─ context.ts         # StoreContext + хук useStore()
      └─ StoreProvider.tsx  # компонент-провайдер
```

## Линтинг

`eslint.config.js` собран из готовых наборов:

| Набор                                 | Что даёт                     |
| ------------------------------------- | ---------------------------- |
| `js.configs.recommended`              | базовые правила JS           |
| `tseslint.configs.recommended`        | правила TypeScript           |
| `reactHooks.configs.flat.recommended` | правила хуков React          |
| `reactRefresh.configs.vite`           | совместимость с Fast Refresh |

Правила намеренно **без проверки типов** (`recommended`, а не `recommendedTypeChecked`):
так линт работает быстро и без обращения к компилятору. Если понадобятся правила
уровня «забытый `await`» (`no-floating-promises` и прочие), нужно перейти на
`tseslint.configs.recommendedTypeChecked` и добавить в конфиг:

```js
languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } }
```

Важно про Fast Refresh: файл с компонентом должен экспортировать **только компоненты**.
Правило `react-refresh/only-export-components` поэтому ругается на смешанные файлы —
именно из-за него `useStore` живёт в `stores/context.ts`, а провайдер в
`stores/StoreProvider.tsx`. Глушить правило (`allowExportNames`) не стоит: иначе
правка такого файла перезагружает страницу целиком.

## Форматирование

За стиль кода отвечает **только Prettier**, ESLint форматированием не занимается:

- `prettier.config.js` — единственный источник правды. Отличия от дефолтов:
  `semi: false`, `singleQuote: true`, `printWidth: 100`, `endOfLine: 'lf'`.
- `eslint-config-prettier` подключён **последним** в `eslint.config.js`: он выключает
  правила ESLint, которые спорили бы с Prettier.
- `eslint-plugin-prettier` намеренно не используется — гонять Prettier как правило
  линта медленнее, стиль превращается в «ошибки линта», а редактор всё равно
  форматирует файл на сохранении. Так рекомендует сам Prettier.

Проверка в CI:

```bash
npm run format:check
```

`.prettierignore` исключает `dist`, `node_modules`, `package-lock.json`.

Чтобы редактор форматировал на сохранении (VS Code), добавьте в `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

## Pre-commit

Хук `.husky/pre-commit` включает то, что не должно попадать в историю. Ставится
автоматически: в `package.json` есть скрипт `"prepare": "husky"`, поэтому хук
подхватывается на `npm install` (и у каждого, кто клонирует репозиторий).

Что выполняется:

1. `npx --no-install lint-staged` — только по файлам из индекса:
   - `*.{js,mjs,ts,tsx}` → `eslint --fix`, затем `prettier --write`;
   - `*.{css,html,md}` → `prettier --write`;
   - `!(*lock).json` → `prettier --write` (`package-lock.json` не трогаем — его пишет npm).
     Исправления lint-staged сам добавляет в коммит, отдельный `git add` не нужен.
     Флаг `--no-install` гарантирует, что хук не полезет скачивать инструменты из сети.
2. `npm run typecheck` — типы проверяются по всему проекту: по одному файлу `tsc`
   работать не умеет. Запуск инкрементальный, поэтому занимает около секунды.

Если любая проверка упала — коммит не состоится, а рабочая копия возвращается
в исходное состояние. Обойти хук для одного коммита: `git commit --no-verify`.

Служебная папка `.husky/_` (shim-ы git) генерируется husky и в репозиторий не
попадает — у неё собственный `.gitignore`.

### Переводы строк

`.gitattributes` фиксирует `eol=lf` для всех текстовых файлов. Без этого git на
Windows (`core.autocrlf=true`) перезаписал бы файлы в CRLF при клонировании, и
`npm run format:check` начал бы падать на каждом файле. Это же критично для
`.husky/pre-commit`: CRLF в sh-скрипте ломает его выполнение.

## TypeScript

- `strict` плюс `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`.
- `verbatimModuleSyntax`: типы импортируются только как типы — либо
  `import type { RootStore } from './index'`, либо инлайново
  `import { rootStore, type RootStore } from './index'`.
- Типы проверяются отдельно от сборки: Vite просто стирает аннотации, поэтому
  перед коммитом запускайте `npm run typecheck` (она же входит в `npm run build`).
- `document.getElementById('root')` имеет тип `HTMLElement | null` — в `main.tsx`
  стоит явная проверка, non-null `!` не используется.
- Типы CSS Modules приходят из `vite/client`, поэтому `styles.page` — это `string`.
- Расширения `.ts`/`.tsx` в импортах не пишем: `moduleResolution: "bundler"` их
  и так резолвит.

### Почему TypeScript 6, а не 7

TypeScript 7 — нативная (Go) реализация компилятора, и она **не предоставляет
классический JS API**: `require('typescript').createSourceFile` и `createProgram`
там `undefined`, доступны только `./unstable/*`. На этом API держится
`typescript-eslint`, поэтому ESLint для `.ts` с TS 7 сейчас не работает — у
`typescript-eslint@8` peer-диапазон `typescript >=4.8.4 <6.1.0`
([issue #12720](https://github.com/typescript-eslint/typescript-eslint/issues/12720)).

Отсюда версия `6.0.3` — самая новая из поддерживаемых. Когда `typescript-eslint`
научится работать с TS 7, достаточно поднять версию в `package.json`.

## Как работать с состоянием

1. Состояние живёт только в сторах (`src/stores`), не в компонентах.
2. Новый раздел — новый стор-класс, подключённый в `RootStore`.
3. Компонент оборачивается в `observer(...)` и получает стор через `useStore()`
   с полной типизацией:

```tsx
import { useStore } from './stores/context'

const { coffee } = useStore() // RootStore
```

4. Изменять состояние можно только методами (action) стора — так MobX корректно
   пересчитает зависимые computed-значения и перерисует компоненты.
5. В тестах удобно подставить свой стор: `<StoreProvider store={mockStore}>`.

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
2. Классы объявляются без БЭМ-разделителей (`-`, `__`) — `camelCase` или одно слово
   (`.page`, `.title`), чтобы имя читалось и как `styles.title`, и как `styles['title']`.
3. Глобальным остаётся единственный файл `src/index.css` (сброс, `:root`-токены).
   Всё новое — в модули, чтобы классы не «протекали» между компонентами.
4. Динамические классы удобно собирать через вспомогательную функцию:

```ts
const cx = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(' ')
```

Хеширование имён и их уникальность обеспечивает Vite — отдельная настройка не нужна.
