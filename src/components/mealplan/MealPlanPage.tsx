import { useState } from 'react'
import { gastronomy } from '../../data/gastronomy'
import type { MealSlot } from '../../types'
import { RecipeModal } from '../recipes/RecipeModal'

const mealIcons: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍌',
  dinner: '🌙',
}

const mealLabels: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  snack: 'Перекус',
  dinner: 'Ужин',
}

export function MealPlanPage() {
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {gastronomy.meal_plan.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-colors ${
              selectedDay === i
                ? 'bg-ocean-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-xs font-medium">День {day.day}</span>
          </button>
        ))}
      </div>

      {gastronomy.meal_plan[selectedDay] && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {gastronomy.meal_plan[selectedDay].title}
          </h2>
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealType) => {
            const slot = gastronomy.meal_plan[selectedDay].meals[mealType] as MealSlot
            const recipes = (slot?.recipe_ids || [])
              .map((id) => gastronomy.recipes.find((r) => r.id === id))
              .filter(Boolean)

            return (
              <MealCard
                key={mealType}
                mealType={mealType}
                note={slot?.note}
                recipes={recipes as typeof gastronomy.recipes}
                onRecipeClick={setSelectedRecipeId}
              />
            )
          })}
        </div>
      )}

      {selectedRecipeId && (
        <RecipeModal recipeId={selectedRecipeId} onClose={() => setSelectedRecipeId(null)} />
      )}
    </div>
  )
}

function MealCard({
  mealType,
  note,
  recipes,
  onRecipeClick,
}: {
  mealType: string
  note?: string
  recipes: typeof gastronomy.recipes
  onRecipeClick: (id: string) => void
}) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-700/50">
        <span>{mealIcons[mealType]}</span>
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          {mealLabels[mealType]}
        </span>
      </div>
      <div className="px-4 py-2 space-y-2">
        {note && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">{note}</p>
        )}
        {recipes.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">Нет рецептов</p>
        ) : (
          recipes.map((recipe) => (
            <div key={recipe.id} className="py-2 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRecipeClick(recipe.id)}
                    className="text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer hover:underline text-left"
                  >
                    {recipe.name}
                  </button>
                  {recipe.is_fish_dish && <span className="text-xs">🐟</span>}
                  {recipe.fresh_catch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-ocean-100 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-300">
                      свежий улов
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ⏱ {recipe.prep_time_minutes} мин · {recipe.ingredients.length} ингр.
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
