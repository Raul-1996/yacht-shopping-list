import { useEffect } from 'react'
import { gastronomy } from '../../data/gastronomy'

interface RecipeModalProps {
  recipeId: string
  onClose: () => void
}

export function RecipeModal({ recipeId, onClose }: RecipeModalProps) {
  const recipe = gastronomy.recipes.find((r) => r.id === recipeId)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!recipe) return null

  return (
    <div
      className="fixed inset-0 z-50 animate-[fadeIn_200ms_ease-out]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Full-screen on mobile, centered card on desktop */}
      <div
        className="absolute inset-0 sm:inset-4 sm:m-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-2xl bg-white dark:bg-slate-900 sm:shadow-xl animate-[slideUp_250ms_ease-out] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>

        {/* Header — non-scrollable */}
        <div className="shrink-0 px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 pr-8">
            {recipe.name}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              ⏱ {recipe.prep_time_minutes} мин
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              👥 {recipe.servings} порц.
            </span>
            {recipe.is_fish_dish && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-300">
                🐟 рыбное
              </span>
            )}
            {recipe.fresh_catch && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-sea-green-400/15 dark:bg-sea-green-400/10 text-sea-green-500 dark:text-sea-green-400 font-medium">
                🎣 свежий улов
              </span>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Ingredients */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Ингредиенты
          </h3>
          <ul className="space-y-1.5">
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
        <div className="px-5 py-3 pb-10 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Приготовление
          </h3>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ocean-100 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-300 text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        </div>{/* end scrollable content */}
      </div>
    </div>
  )
}
