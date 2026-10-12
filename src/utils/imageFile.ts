/**
 * Утилита для картинок, которые админ загружает из браузера.
 *
 * Зачем сжимать: логотип хранится в базе как data URL (на Vercel файловая
 * система только для чтения, записать файл на диск нельзя). Исходник на
 * 1–2 МБ раздул бы и запрос, и ответ API, поэтому уменьшаем картинку
 * на клиенте ещё до отправки.
 */

/** Что получилось после обработки файла */
export interface ProcessedImage {
  /** Data URL для сохранения */
  dataUrl: string
  /** Размер в байтах после кодирования (примерно) */
  bytes: number
  width: number
  height: number
}

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Файл не похож на картинку'))
    image.src = src
  })

/**
 * Готовит картинку к сохранению: уменьшает до maxWidth и перекодирует в WebP.
 * WebP выбран потому, что поддерживает прозрачность — у логотипов она есть.
 */
export const processImage = async (file: File, maxWidth: number): Promise<ProcessedImage> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Нужен файл изображения: PNG, JPG или WebP')
  }

  const original = await readFile(file)
  const image = await loadImage(original)

  const scale = Math.min(1, maxWidth / image.naturalWidth)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Браузер не смог обработать картинку')

  // Фон не заливаем: прозрачность логотипа должна сохраниться
  context.drawImage(image, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/webp', 0.9)
  // Длина data URL в символах ≈ размер в байтах для ASCII-строки base64
  return { dataUrl, bytes: Math.round(dataUrl.length * 0.75), width, height }
}

/** Человекочитаемый размер: 54 КБ, 1,2 МБ */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`
}
