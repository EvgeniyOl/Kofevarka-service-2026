/**
 * lint-staged: что выполняется по файлам, попавшим в индекс.
 *
 * Все правки (eslint --fix, prettier --write) lint-staged сам добавляет в коммит,
 * поэтому отдельно «git add» после хука делать не нужно.
 */
export default {
  // Код: сначала автоисправления ESLint, затем форматирование
  '*.{js,mjs,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // Стили, разметка и документация — только форматирование
  '*.{css,html,md}': ['prettier --write'],

  // JSON, кроме lock-файла: package-lock.json пишет npm, его не форматируем
  '!(*lock).json': ['prettier --write'],
}
