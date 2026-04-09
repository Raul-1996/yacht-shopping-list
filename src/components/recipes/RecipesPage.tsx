import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { gastronomy } from '../../data/gastronomy'
import type { Recipe } from '../../types'

type MealFilter = 'all' | 'breakfast' | 'lunch' | 'snack' | 'dinner'
type ReadyFilter = 'all' | 'ready' | 'almost' | 'not_ready'

const mealLabels: Record<string, string> = {
  all: 'Все',
  breakfast: 'Завтрак',
  lunch: 'Обед',
  snack: 'Перекус',
  dinner: 'Ужин',
}

function getRecipeReadiness(recipe: Recipe, checkedItems: Set<string>): 'green' | 'yellow' | 'red' {
  const total = recipe.ingredients.length
  if (total === 0) return 'green'
  const missing = recipe.ingredients.filter((ing) => !checkedItems.has(ing.name.toLowerCase())).length
  if (missing === 0) return 'green'
  if (missing <= 2) return 'yellow'
  return 'red'
}

export function RecipesPage() {
  const { shoppingItems } = useAppStore()
  const [mealFilter, setMealFilter] = useState<MealFilter>('all')
  const [readyFilter, setReadyFilter] = useState<ReadyFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const checkedNames = useMemo(
    () => new Set(shoppingItems.filter((i) => i.checked).map((i) => i.name.toLowerCase())),
    [shoppingItems]
  )

  const filtered = useMemo(() => {
    let recipes = gastronomy.recipes
    if (mealFilter !== 'all') recipes = recipes.filter((r) => r.meal_type === mealFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      recipes = recipes.filter((r) => r.name.toLowerCase().includes(q))
    }
    if (readyFilter !== 'all') {
      recipes = recipes.filter((r) => {
        const readiness = getRecipeReadiness(r, checkedNames)
        if (readyFilter === 'ready') return readiness === 'green'
        if (readyFilter === 'almost') return readiness === 'yellow'
        return readiness === 'red'
      })
    }
    return recipes
  }, [mealFilter, readyFilter, searchQuery, checkedNames])

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск рецептов..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500 transition-all"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(Object.entries(mealLabels) as [MealFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMealFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mealFilter === key
                ? 'bg-ocean-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {([
          ['all', 'Все', ''],
          ['ready', 'Можно готовить', '🟢'],
          ['almost', 'Почти готово', '🟡'],
          ['not_ready', 'Не хватает', '🔴'],
        ] as [ReadyFilter, string, string][]).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setReadyFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              readyFilter === key
                ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">{filtered.length} рецептов</p>

      <div className="space-y-2">
        {filtered.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            readiness={getRecipeReadiness(recipe, checkedNames)}
            expanded={expandedId === recipe.id}
            onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
          />
        ))}
      </div>
    </div>
  )
}

function RecipeCard({
  recipe,
  readiness,
  expanded,
  onToggle,
}: {
  recipe: Recipe
  readiness: 'green' | 'yellow' | 'red'
  expanded: boolean
  onToggle: () => void
}) {
  const readinessColors = {
    green: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    red: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800',
  }
  const readinessIcon = { green: '🟢', yellow: '🟡', red: '🔴' }

  return (
    <div className={`rounded-2xl border ${readinessColors[readiness]} overflow-hidden transition-all`}>
      <button onClick={onToggle} className="w-full px-4 py-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs">{readinessIcon[readiness]}</span>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{recipe.name}</h3>
              {recipe.is_fish_dish && <span className="text-xs">🐟</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>⏱ {recipe.prep_time_minutes} мин</span>
              <span>👥 {recipe.servings} порций</span>
              <span className="capitalize">{mealTypeLabel(recipe.meal_type)}</span>
            </div>
          </div>
          <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="pt-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Ингредиенты</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>{ing.name}</span>
                  <span className="text-slate-400 tabular-nums">{ing.quantity} {ing.unit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Приготовление</h4>
            <ol className="space-y-1.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                  <span className="text-ocean-500 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function mealTypeLabel(type: string): string {
  const map: Record<string, string> = {
    breakfast: 'завтрак',
    lunch: 'обед',
    snack: 'перекус',
    dinner: 'ужин',
  }
  return map[type] || type
}
