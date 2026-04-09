import { useState, useRef, useCallback, type ReactNode } from 'react'

interface SwipeToDeleteProps {
  children: ReactNode
  onDelete: () => void
  disabled?: boolean
}

export function SwipeToDelete({ children, onDelete, disabled }: SwipeToDeleteProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const touchRef = useRef<{ startX: number; startY: number; active: boolean }>({ startX: 0, startY: 0, active: false })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    const touch = e.touches[0]
    touchRef.current = { startX: touch.clientX, startY: touch.clientY, active: true }
  }, [disabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.active) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchRef.current.startX
    const dy = Math.abs(touch.clientY - touchRef.current.startY)

    // Cancel if vertical
    if (dy > 30 && Math.abs(dx) < 20) {
      touchRef.current.active = false
      setOffsetX(showButton ? -80 : 0)
      return
    }

    if (showButton) {
      // When delete button is shown, allow swiping right to close
      // offsetX starts at -80, dx positive = swiping right
      const newOffset = Math.min(0, Math.max(-100, -80 + dx))
      setOffsetX(newOffset)
    } else {
      // Normal: only allow swipe left
      if (dx < -10) {
        setOffsetX(Math.max(dx, -100))
      }
    }
  }, [showButton])

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current.active) {
      setOffsetX(showButton ? -80 : 0)
      return
    }
    touchRef.current.active = false

    if (showButton) {
      // If swiped back past halfway, close
      if (offsetX > -40) {
        setOffsetX(0)
        setShowButton(false)
      } else {
        setOffsetX(-80)
      }
    } else {
      if (offsetX < -60) {
        setOffsetX(-80)
        setShowButton(true)
      } else {
        setOffsetX(0)
        setShowButton(false)
      }
    }
  }, [offsetX, showButton])

  const handleClose = useCallback(() => {
    setOffsetX(0)
    setShowButton(false)
  }, [])

  const handleDelete = useCallback(() => {
    setOffsetX(-300)
    setTimeout(() => {
      onDelete()
      setOffsetX(0)
      setShowButton(false)
    }, 200)
  }, [onDelete])

  return (
    <div className="relative overflow-hidden rounded-xl" data-swipe-item>
      {/* Delete button behind — only visible when swiped */}
      {offsetX < 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-coral-500 text-white text-xs font-semibold"
          onClick={handleDelete}
        >
          Удалить
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: touchRef.current.active ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={showButton ? handleClose : undefined}
      >
        {children}
      </div>
    </div>
  )
}
