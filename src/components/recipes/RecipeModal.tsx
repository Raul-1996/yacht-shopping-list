import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { gastronomy } from '../../data/gastronomy'

interface RecipeModalProps {
  recipeId: string
  onClose: () => void
}

export function RecipeModal({ recipeId, onClose }: RecipeModalProps) {
  const recipe = gastronomy.recipes.find((r) => r.id === recipeId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const touchStart = useRef<{ x: number; y: number; started: boolean }>({ x: 0, y: 0, started: false })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    scrollRef.current?.scrollTo(0, 0)
    return () => {
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, recipeId])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    // Only start swipe if touch begins within 30px of left edge
    if (touch.clientX <= 30) {
      touchStart.current = { x: touch.clientX, y: touch.clientY, started: true }
      setSwiping(true)
    } else {
      touchStart.current = { x: 0, y: 0, started: false }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current.started) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = Math.abs(touch.clientY - touchStart.current.y)
    // Cancel if vertical scroll is dominant
    if (dy > 50 && dx < 30) {
      touchStart.current.started = false
      setSwiping(false)
      setSwipeX(0)
      return
    }
    if (dx > 0) {
      setSwipeX(dx)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current.started) return
    touchStart.current.started = false
    if (swipeX > 100) {
      // Swipe threshold reached — close with animation
      setSwipeX(window.innerWidth)
      setTimeout(onClose, 200)
    } else {
      setSwiping(false)
      setSwipeX(0)
    }
  }, [swipeX, onClose])

  if (!recipe) return null

  const translateStyle = swipeX > 0
    ? { transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease-out' }
    : {}

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col"
      style={translateStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator — subtle bar on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-ocean-300/30 dark:bg-ocean-500/20 z-10" />

      {/* Top bar with back button */}
      <div className="shrink-0 flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),8px)] pb-2 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="flex items-center gap-1 h-11 px-3 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-400 text-sm font-semibold active:bg-ocean-100 dark:active:bg-ocean-800/50"
        >
          ← Назад
        </button>
        <span className="flex-1 text-center text-sm font-medium text-slate-400 dark:text-slate-500 truncate pr-12">
          {recipe.name}
        </span>
      </div>

      {/* Scrollable recipe content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain pb-24">
        {/* Title + tags */}
        <div className="px-5 pt-4 pb-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {recipe.name}
          </h2>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              ⏱ {recipe.prep_time_minutes} мин
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              👥 {recipe.servings} порц.
            </span>
            {recipe.is_fish_dish && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-300">
                🐟 рыбное
              </span>
            )}
            {recipe.fresh_catch && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-sea-green-400/15 dark:bg-sea-green-400/10 text-sea-green-500 dark:text-sea-green-400 font-medium">
                🎣 свежий улов
              </span>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Ингредиенты
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="text-ocean-500 dark:text-ocean-400">•</span>
                <span className="text-slate-700 dark:text-slate-200">{ing.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums ml-auto shrink-0">
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Приготовление
          </h3>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-ocean-100 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-300 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Bottom back button */}
        <div className="px-5 py-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-400 text-sm font-semibold active:bg-ocean-100"
          >
            ← Вернуться назад
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
