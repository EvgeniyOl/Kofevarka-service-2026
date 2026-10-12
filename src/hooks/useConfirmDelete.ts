import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Подтверждение удаления в два нажатия: первое «вооружает» кнопку, второе
 * удаляет. Нужно, чтобы случайный промах не сносил карточку.
 *
 * Почему не сброс по onBlur, как было раньше: подтверждение снималось раньше,
 * чем приходил клик. Уводить курсор с кнопки между нажатиями — обычное дело,
 * и удаление просто не срабатывало. Теперь подтверждение снимается только
 * при нажатии вне карточки.
 *
 * Возвращает:
 * - `armed` — ждём подтверждения (кнопка показывает «Точно удалить?»);
 * - `request` — обработчик кнопки удаления;
 * - `setCard` — ссылка на карточку, вне которой подтверждение снимается.
 *   Это колбэк, а не RefObject: карточка бывает и `article`, и `div`,
 *   а колбэк подходит к любому тегу;
 * - `disarm` — снять подтверждение вручную (например, при открытии формы).
 */
export const useConfirmDelete = (
  onConfirm: () => void | Promise<void>,
): {
  armed: boolean
  request: () => void
  setCard: (node: HTMLElement | null) => void
  disarm: () => void
} => {
  const [armed, setArmed] = useState(false)
  const cardRef = useRef<HTMLElement | null>(null)
  const setCard = useCallback((node: HTMLElement | null) => {
    cardRef.current = node
  }, [])

  useEffect(() => {
    if (!armed) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      // Нажатие внутри карточки — это движение к подтверждению, не сброс
      if (target && cardRef.current?.contains(target)) return
      setArmed(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [armed])

  const request = useCallback(() => {
    if (armed) {
      setArmed(false)
      void onConfirm()
      return
    }
    setArmed(true)
  }, [armed, onConfirm])

  const disarm = useCallback(() => setArmed(false), [])

  return { armed, request, setCard, disarm }
}
