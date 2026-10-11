/**
 * Проверка того, что работает без базы: хеширование паролей и сессионные
 * токены. Запуск: node --experimental-strip-types api/_lib/selftest.ts
 *
 * Это самопроверка, а не полноценные тесты: она отвечает на вопрос
 * «не сломана ли криптография», которую иначе не увидеть глазами.
 */
import { hashPassword, verifyPassword } from './password.ts'
import { createSessionToken, readSessionToken } from './session.ts'

let failures = 0

const check = (name: string, condition: boolean): void => {
  console.log(`${condition ? 'ок  ' : 'ОШИБКА'} ${name}`)
  if (!condition) failures += 1
}

// — пароли —
const hash = await hashPassword('kofevarka-2026')
check('хеш отличается от пароля', hash !== 'kofevarka-2026')
check('хеш помечен схемой scrypt', hash.startsWith('scrypt$'))
check('верный пароль подходит', await verifyPassword('kofevarka-2026', hash))
check('неверный пароль не подходит', !(await verifyPassword('kofevarka-2027', hash)))

const second = await hashPassword('kofevarka-2026')
check('два хеша одного пароля различаются (соль случайна)', hash !== second)
check('второй хеш тоже проверяется', await verifyPassword('kofevarka-2026', second))
check('мусор вместо хеша не проходит', !(await verifyPassword('kofevarka-2026', 'не-хеш')))

// — сессии —
const token = createSessionToken(42)
check('токен читается и даёт того же пользователя', readSessionToken(token) === 42)
check('пустой токен отвергается', readSessionToken(undefined) === null)
check('мусорный токен отвергается', readSessionToken('abc.def') === null)

// Подпись обязана ломаться при подмене данных
const [data, signature] = token.split('.')
const forgedPayload = Buffer.from(JSON.stringify({ sub: 1, exp: 9999999999 })).toString('base64url')
check('подмена данных ломает подпись', readSessionToken(`${forgedPayload}.${signature}`) === null)
check('подмена подписи отвергается', readSessionToken(`${data}.подпись`) === null)

// Просроченный токен
const expired = Buffer.from(
  JSON.stringify({ sub: 7, exp: Math.floor(Date.now() / 1000) - 10 }),
).toString('base64url')
check('просроченный токен отвергается', readSessionToken(`${expired}.${signature}`) === null)

console.log(failures ? `\nпровалено проверок: ${failures}` : '\nвсе проверки пройдены')
process.exit(failures ? 1 : 0)
