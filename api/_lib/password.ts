/**
 * Пароли: хеширование через scrypt из стандартной библиотеки Node.
 * Внешние пакеты не нужны, а scrypt — рекомендованный алгоритм для паролей
 * (в отличие от быстрого SHA, он специально медленный и требователен к памяти).
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

const KEY_LENGTH = 64
const SALT_LENGTH = 16

/** Формат хранения: scrypt$<соль в hex>$<хеш в hex> */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  return `scrypt$${salt}$${hash.toString('hex')}`
}

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'hex')
  const actual = (await scrypt(password, salt, expected.length)) as Buffer

  // Сравнение с постоянным временем: обычное === раскрывает длину совпадения
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
