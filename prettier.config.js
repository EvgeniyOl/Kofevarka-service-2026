/**
 * Настройки Prettier — единственный источник правды по форматированию кода.
 * ESLint за форматирование не отвечает (см. eslint-config-prettier в eslint.config.js),
 * поэтому «красоту» правит только Prettier.
 *
 * Значения ниже отличаются от дефолтных только там, где это осознанный выбор:
 * без точек с запятой, одинарные кавычки, ширина строки 100, переводы строк LF.
 *
 * @see https://prettier.io/docs/options
 * @type {import('prettier').Config}
 */
export default {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  endOfLine: 'lf',
}
