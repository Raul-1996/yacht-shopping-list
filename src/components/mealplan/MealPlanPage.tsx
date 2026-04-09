import { useState, useMemo, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { gastronomy } from '../../data/gastronomy'
import type { MealSlot, Recipe } from '../../types'
import { RecipeModal } from '../recipes/RecipeModal'
import { RecipePicker } from './RecipePicker'

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
  const { mealPlan, replaceRecipeInMealPlan, addRecipeToMealSlot, removeRecipeFromMealSlot, updateMealSlotNote } = useAppStore()
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [pickerState, setPickerState] = useState<{
    mealType: string
    mode: 'add' | 'replace'
    replaceRecipeId?: string
    currentRecipeIds: string[]
  } | null>(null)

  const currentDay = mealPlan[selectedDay]

  function openPicker(mealType: string, mode: 'add' | 'replace', currentRecipeIds: string[], replaceRecipeId?: string) {
    setPickerState({ mealType, mode, currentRecipeIds, replaceRecipeId })
  }

  function handlePickerSelect(recipeId: string) {
    if (!pickerState || !currentDay) return
    const dayNum = currentDay.day
    if (pickerState.mode === 'replace' && pickerState.replaceRecipeId) {
      replaceRecipeInMealPlan(dayNum, pickerState.mealType, pickerState.replaceRecipeId, recipeId)
    } else {
      addRecipeToMealSlot(dayNum, pickerState.mealType, recipeId)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4 pb-6">
      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {mealPlan.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-colors min-h-[44px] ${
              selectedDay === i
                ? 'bg-ocean-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-xs font-medium">День {day.day}</span>
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {currentDay.title}
          </h2>
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealType) => {
            const slot = currentDay.meals[mealType] as MealSlot
            const recipeIds = slot?.recipe_ids || []
            const recipes = recipeIds
              .map((id) => gastronomy.recipes.find((r) => r.id === id))
              .filter((r): r is Recipe => r != null)

            return (
              <MealCard
                key={mealType}
                day={currentDay.day}
                mealType={mealType}
                note={slot?.note || ''}
                recipes={recipes}
                recipeIds={recipeIds}
                onRecipeClick={setSelectedRecipeId}
                onReplace={(recipeId) => openPicker(mealType, 'replace', recipeIds, recipeId)}
                onDelete={(recipeId) => removeRecipeFromMealSlot(currentDay.day, mealType, recipeId)}
                onAdd={() => openPicker(mealType, 'add', recipeIds)}
                onNoteChange={(note) => updateMealSlotNote(currentDay.day, mealType, note)}
              />
            )
          })}
        </div>
      )}

      {selectedRecipeId && (
        <RecipeModal recipeId={selectedRecipeId} onClose={() => setSelectedRecipeId(null)} />
      )}

      {pickerState && (
        <RecipePicker
          mealType={pickerState.mealType}
          currentRecipeIds={pickerState.currentRecipeIds}
          onSelect={handlePickerSelect}
          onClose={() => setPickerState(null)}
        />
      )}
    </div>
  )
}

function MealCard({
  day: _day,
  mealType,
  note,
  recipes,
  recipeIds: _recipeIds,
  onRecipeClick,
  onReplace,
  onDelete,
  onAdd,
  onNoteChange,
}: {
  day: number
  mealType: string
  note: string
  recipes: Recipe[]
  recipeIds: string[]
  onRecipeClick: (id: string) => void
  onReplace: (recipeId: string) => void
  onDelete: (recipeId: string) => void
  onAdd: () => void
  onNoteChange: (note: string) => void
}) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(note)
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const noteInputRef = useRef<HTMLInputElement>(null)
  const { shoppingItems } = useAppStore()

  const checkedNames = useMemo(
    () => new Set(shoppingItems.filter((i) => i.checked).map((i) => i.name.toLowerCase())),
    [shoppingItems]
  )

  // Sync note from props when it changes externally
  useEffect(() => {
    if (!editingNote) setNoteValue(note)
  }, [note, editingNote])

  useEffect(() => {
    if (editingNote && noteInputRef.current) {
      noteInputRef.current.focus()
    }
  }, [editingNote])

  function handleNoteBlur() {
    setEditingNote(false)
    if (noteValue !== note) {
      onNoteChange(noteValue)
    }
  }

  function getReadiness(recipe: Recipe): 'green' | 'yellow' | 'red' {
    const total = recipe.ingredients.length
    if (total === 0) return 'green'
    const missing = recipe.ingredients.filter((ing) => !checkedNames.has(ing.name.toLowerCase())).length
    if (missing === 0) return 'green'
    if (missing <= 2) return 'yellow'
    return 'red'
  }

  const readinessColors: Record<string, string> = {
    green: 'border-l-emerald-400',
    yellow: 'border-l-amber-400',
    red: 'border-l-red-400',
  }

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
      {/* Meal type header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-700/50">
        <span>{mealIcons[mealType]}</span>
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          {mealLabels[mealType]}
        </span>
      </div>

      <div className="px-4 py-2 space-y-2">
        {/* Editable note */}
        {editingNote ? (
          <input
            ref={noteInputRef}
            type="text"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNoteBlur() }}
            className="w-full text-base text-slate-600 dark:text-slate-300 italic bg-transparent border-b border-ocean-400 dark:border-ocean-500 focus:outline-none py-1"
            placeholder="Добавить описание..."
          />
        ) : (
          <button
            onClick={() => setEditingNote(true)}
            className="w-full text-left text-xs italic py-1 min-h-[32px] flex items-center"
          >
            <span className={noteValue ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}>
              {noteValue || 'Добавить описание...'}
            </span>
          </button>
        )}

        {/* Recipe cards */}
        {recipes.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">Нет рецептов</p>
        ) : (
          recipes.map((recipe) => {
            const readiness = getReadiness(recipe)
            const isExpanded = expandedRecipeId === recipe.id
            const isConfirming = confirmDeleteId === recipe.id

            return (
              <div
                key={recipe.id}
                className={`rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 border-l-[3px] ${readinessColors[readiness]} px-3 py-2.5`}
                onClick={() => {
                  if (isExpanded) {
                    setExpandedRecipeId(null)
                    setConfirmDeleteId(null)
                  } else {
                    setExpandedRecipeId(recipe.id)
                    setConfirmDeleteId(null)
                  }
                }}
              >
                {/* Row 1: name */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRecipeClick(recipe.id) }}
                    className="flex-1 text-left text-sm font-medium text-slate-800 dark:text-slate-100 active:text-ocean-600 dark:active:text-ocean-400 truncate min-h-[44px] flex items-center"
                  >
                    {recipe.name}
                  </button>
                </div>
                {/* Row 2: meta */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 -mt-1">
                  <span>⏱ {recipe.prep_time_minutes} мин · {recipe.ingredients.length} ингр.</span>
                  {recipe.is_fish_dish && <span>🐟</span>}
                </div>

                {/* Action buttons - shown on tap */}
                {isExpanded && !isConfirming && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={(e) => { e.stopPropagation(); onReplace(recipe.id) }}
                      className="flex-1 py-2 min-h-[44px] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
                    >
                      🔄 Заменить
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(recipe.id) }}
                      className="flex-1 py-2 min-h-[44px] rounded-lg text-xs font-medium text-coral-500 dark:text-coral-400 bg-coral-400/10 dark:bg-coral-400/10 active:bg-coral-400/20 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                )}

                {/* Delete confirmation */}
                {isConfirming && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Удалить блюдо?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                        className="flex-1 py-2 min-h-[44px] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); setExpandedRecipeId(null); setConfirmDeleteId(null) }}
                        className="flex-1 py-2 min-h-[44px] rounded-lg text-xs font-medium text-white bg-coral-500 active:bg-coral-400 transition-colors"
                      >
                        Да, удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Add recipe button */}
        <button
          onClick={onAdd}
          className="w-full py-3 min-h-[44px] rounded-xl border-2 border-dashed border-ocean-300 dark:border-ocean-700 text-ocean-500 dark:text-ocean-400 text-sm font-medium active:bg-ocean-50 dark:active:bg-ocean-950/30 transition-colors"
        >
          ＋ Добавить блюдо
        </button>
      </div>
    </div>
  )
}
