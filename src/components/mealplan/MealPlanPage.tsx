import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import { gastronomy } from '../../data/gastronomy'
import type { MealSlot, Recipe } from '../../types'
import { RecipeModal } from '../recipes/RecipeModal'
import { RecipePicker } from './RecipePicker'
import { SwipeToDelete } from '../ui/SwipeToDelete'

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

// Trip dates: Day 1 = April 11, Day 7 = April 17
const TRIP_START = new Date(2026, 3, 11) // April 11, 2026
const DAY_DATES = [11, 12, 13, 14, 15, 16, 17] // April dates

function getAutoDay(): number {
  const now = new Date()
  const diffMs = now.getTime() - TRIP_START.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 0      // Before trip → Day 1
  if (diffDays >= 7) return 6     // After trip → Day 7
  return diffDays                  // During trip → current day
}

export function MealPlanPage() {
  const { mealPlan, replaceRecipeInMealPlan, addRecipeToMealSlot, removeRecipeFromMealSlot, updateMealSlotNote, pageResetCounter } = useAppStore()
  const [selectedDay, setSelectedDay] = useState(getAutoDay)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [pickerState, setPickerState] = useState<{
    mealType: string
    mode: 'add' | 'replace'
    replaceRecipeId?: string
    currentRecipeIds: string[]
  } | null>(null)

  // Reset modals when user taps the same tab (pageResetCounter changes)
  useEffect(() => {
    setSelectedRecipeId(null)
    setPickerState(null)
  }, [pageResetCounter])

  const currentDay = mealPlan[selectedDay]

  // Swipe between days
  const swipeRef = useRef<{ startX: number; startY: number; active: boolean }>({ startX: 0, startY: 0, active: false })
  const [swipeOffset, setSwipeOffset] = useState(0)

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    // Don't start day-swipe if touch is inside a SwipeToDelete card
    const target = e.target as HTMLElement
    if (target.closest('[data-swipe-item]')) {
      swipeRef.current = { startX: 0, startY: 0, active: false }
      return
    }
    const touch = e.touches[0]
    swipeRef.current = { startX: touch.clientX, startY: touch.clientY, active: true }
  }, [])

  const handleSwipeMove = useCallback((e: React.TouchEvent) => {
    if (!swipeRef.current.active) return
    const touch = e.touches[0]
    const dx = touch.clientX - swipeRef.current.startX
    const dy = Math.abs(touch.clientY - swipeRef.current.startY)
    // Cancel if scrolling vertically
    if (dy > 30 && Math.abs(dx) < 30) {
      swipeRef.current.active = false
      setSwipeOffset(0)
      return
    }
    if (Math.abs(dx) > 20) {
      setSwipeOffset(dx)
    }
  }, [])

  const handleSwipeEnd = useCallback(() => {
    if (!swipeRef.current.active) { setSwipeOffset(0); return }
    swipeRef.current.active = false
    if (swipeOffset > 80 && selectedDay > 0) {
      setSelectedDay(selectedDay - 1)
    } else if (swipeOffset < -80 && selectedDay < mealPlan.length - 1) {
      setSelectedDay(selectedDay + 1)
    }
    setSwipeOffset(0)
  }, [swipeOffset, selectedDay, mealPlan.length])

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
    <div
      className="max-w-2xl mx-auto px-4 pt-4 space-y-4 pb-6"
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {mealPlan.map((day, i) => {
          const isToday = i === getAutoDay() && getAutoDay() >= 0 && getAutoDay() < 7
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-colors min-h-[44px] ${
                selectedDay === i
                  ? 'bg-ocean-500 text-white'
                  : isToday
                    ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 ring-1 ring-ocean-300 dark:ring-ocean-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-xs font-medium">День {day.day}</span>
              <span className="text-[10px] opacity-75">{DAY_DATES[i]} апр</span>
            </button>
          )
        })}
      </div>

      {currentDay && (
        <h2
          className="text-sm font-semibold text-slate-600 dark:text-slate-400"
          style={{
            transform: swipeOffset ? `translateX(${swipeOffset * 0.3}px)` : '',
            transition: swipeOffset ? 'none' : 'transform 0.2s ease-out',
            opacity: Math.abs(swipeOffset) > 60 ? 0.7 : 1,
          }}
        >
          {currentDay.title}
        </h2>
      )}

      {currentDay && (
        <div className="space-y-3">
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

            return (
              <SwipeToDelete key={recipe.id} onDelete={() => onDelete(recipe.id)}>
                <div
                  className={`rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 border-l-[3px] ${readinessColors[readiness]} px-3 py-2.5`}
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onRecipeClick(recipe.id) }}
                      className="flex-1 text-left text-sm font-medium text-slate-800 dark:text-slate-100 active:text-ocean-600 dark:active:text-ocean-400 truncate min-h-[44px] flex items-center"
                    >
                      {recipe.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 -mt-1">
                    <span>⏱ {recipe.prep_time_minutes} мин · {recipe.ingredients.length} ингр.</span>
                    {recipe.is_fish_dish && <span>🐟</span>}
                  </div>

                  {isExpanded && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); onReplace(recipe.id) }}
                        className="flex-1 py-2 min-h-[44px] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
                      >
                        🔄 Заменить
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRecipeClick(recipe.id) }}
                        className="flex-1 py-2 min-h-[44px] rounded-lg text-xs font-medium text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 active:bg-ocean-100 transition-colors"
                      >
                        📖 Рецепт
                      </button>
                    </div>
                  )}
                </div>
              </SwipeToDelete>
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
