import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { gastronomy } from '../../data/gastronomy'
import type { Recipe } from '../../types'

interface RecipePickerProps {
  mealType: string
  currentRecipeIds: string[]
  onSelect: (recipeId: string) => void
  onClose: () => void
}

type ReadinessFilter = 'all' | 'green' | 'yellow'

function getRecipeReadiness(recipe: Recipe, checkedItems: Set<string>): 'green' | 'yellow' | 'red' {
  const total = recipe.ingredients.length
  if (total === 0) return 'green'
  const missing = recipe.ingredients.filter((ing) => !checkedItems.has(ing.name.toLowerCase())).length
  if (missing === 0) return 'green'
  if (missing <= 2) return 'yellow'
  return 'red'
}

const readinessIcon = { green: '🟢', yellow: '🟡', red: '🔴' }

export function RecipePicker({ mealType, currentRecipeIds, onSelect, onClose }: RecipePickerProps) {
  const { shoppingItems } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('all')
  const [closing, setClosing] = useState(false)

  const checkedNames = useMemo(
    () => new Set(shoppingItems.filter((i) => i.checked).map((i) => i.name.toLowerCase())),
    [shoppingItems]
  )

  const [mealTypeFilter, setMealTypeFilter] = useState<string>(mealType)

  const filtered = useMemo(() => {
    let recipes = gastronomy.recipes.filter((r) => r.meal_type === mealTypeFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      recipes = recipes.filter((r) => r.name.toLowerCase().includes(q))
    }
    if (readinessFilter !== 'all') {
      recipes = recipes.filter((r) => getRecipeReadiness(r, checkedNames) === readinessFilter)
    }
    return recipes
  }, [mealTypeFilter, searchQuery, readinessFilter, checkedNames])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(() => onClose(), 200)
  }

  function handleSelect(recipeId: string) {
    onSelect(recipeId)
    handleClose()
  }

  const currentSet = new Set(currentRecipeIds)

  return (
    <div
      className={`fixed inset-0 z-50 ${closing ? 'animate-[fadeOut_200ms_ease-in_forwards]' : 'animate-[fadeIn_200ms_ease-out]'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Full-screen panel on mobile, centered card on desktop */}
      <div
        className={`absolute inset-0 sm:inset-4 sm:m-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-2xl flex flex-col bg-white dark:bg-slate-900 sm:shadow-xl ${closing ? 'animate-[slideDown_200ms_ease-in_forwards]' : 'animate-[slideUp_250ms_ease-out]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* === Fixed header (does NOT scroll) === */}
        <div className="shrink-0">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Header with close */}
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Выбрать блюдо
            </h3>
            <button
              onClick={handleClose}
              className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск рецептов..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500 transition-all"
                enterKeyHint="search"
              />
            </div>
          </div>

          {/* Meal type filter */}
          <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto">
            {([
              ['breakfast', '🌅 Завтрак'],
              ['lunch', '☀️ Обед'],
              ['snack', '🍌 Перекус'],
              ['dinner', '🌙 Ужин'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMealTypeFilter(key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mealTypeFilter === key
                    ? 'bg-ocean-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Readiness filter buttons */}
          <div className="flex gap-1.5 px-4 pb-3">
            {([
              ['all', 'Все'],
              ['green', 'Готовые 🟢'],
              ['yellow', 'Почти 🟡'],
            ] as [ReadinessFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setReadinessFilter(key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  readinessFilter === key
                    ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* === Scrollable recipe list === */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Нет подходящих рецептов</p>
          ) : (
            filtered.map((recipe) => {
              const readiness = getRecipeReadiness(recipe, checkedNames)
              const isAlreadyAdded = currentSet.has(recipe.id)

              return (
                <button
                  key={recipe.id}
                  onClick={() => !isAlreadyAdded && handleSelect(recipe.id)}
                  disabled={isAlreadyAdded}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                    isAlreadyAdded
                      ? 'bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-default'
                      : 'bg-slate-50 dark:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{readinessIcon[readiness]}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1">
                      {recipe.name}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-xs text-slate-400 shrink-0">✓ Уже добавлен</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-6 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>⏱ {recipe.prep_time_minutes} мин</span>
                    <span>{recipe.ingredients.length} ингр.</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
