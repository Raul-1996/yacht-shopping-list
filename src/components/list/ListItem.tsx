import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAppStore } from '../../store/appStore'
import type { UnifiedShoppingItem } from '../../types'
import { gastronomy } from '../../data/gastronomy'
import { getProductIcon } from '../../data/productIcons'
import { RecipeModal } from '../recipes/RecipeModal'

export function ListItem({ item }: { item: UnifiedShoppingItem }) {
  const { toggleShoppingItem, adjustShoppingQuantity, deleteShoppingItem, toggleHouseholdItem } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput, setQtyInput] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  const isHousehold = item._source === 'household'
  const isShopping = item._source === 'shopping'

  const usedRecipes = isShopping
    ? (item.used_in_recipes || [])
        .map((id) => gastronomy.recipes.find((r) => r.id === id))
        .filter(Boolean)
    : []

  const handleToggle = () => {
    if (isHousehold) toggleHouseholdItem(item.id)
    else toggleShoppingItem(item.id)
  }

  const handleQtyTap = () => {
    if (!isShopping) return
    setQtyInput(String(item.quantity))
    setEditingQty(true)
  }

  const handleQtySave = () => {
    const val = Math.round(parseFloat(qtyInput) * 100) / 100
    if (!isNaN(val) && val >= 0 && val !== item.quantity) {
      const delta = Math.round((val - item.quantity) * 100) / 100
      adjustShoppingQuantity(item.id, delta)
    }
    setEditingQty(false)
  }

  return (
    <div
      className={`rounded-xl px-3 py-2.5 transition-all ${
        item.checked
          ? 'bg-slate-100/50 dark:bg-slate-800/30'
          : 'bg-white dark:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
            item.checked
              ? 'bg-sea-green-500 border-sea-green-500 text-white'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {item.checked && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Icon */}
        <Icon icon={getProductIcon(item.id, item.category)} width={24} className="shrink-0" />

        {/* Name — tap to expand (shows recipes/delete) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex-1 text-left text-sm transition-colors min-h-[44px] flex items-center ${
            item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          <span>
            {item.name}
            {isHousehold && item.per_cabin && (
              <span className="ml-1.5 text-[10px] font-medium text-ocean-500 dark:text-ocean-400">
                (x4 каюты)
              </span>
            )}
          </span>
        </button>

        {/* Quantity controls */}
        <div className="flex items-center gap-1 shrink-0">
          {isShopping ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); adjustShoppingQuantity(item.id, -1) }}
                className="w-9 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-bold active:bg-slate-200 dark:active:bg-slate-600"
              >
                −
              </button>
              {editingQty ? (
                <input
                  type="number"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  onBlur={handleQtySave}
                  onKeyDown={(e) => e.key === 'Enter' && handleQtySave()}
                  className="w-16 h-9 text-center text-base bg-white dark:bg-slate-800 border border-ocean-400 rounded-lg focus:outline-none"
                  autoFocus
                  step="0.1"
                  min="0"
                />
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleQtyTap() }}
                  className="min-w-[3.5rem] h-9 px-1 text-xs font-medium text-slate-600 dark:text-slate-300 text-center tabular-nums rounded-lg active:bg-slate-100 dark:active:bg-slate-700"
                >
                  {Math.round(item.quantity * 100) / 100} {item.unit}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); adjustShoppingQuantity(item.id, 1) }}
                className="w-9 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-bold active:bg-slate-200 dark:active:bg-slate-600"
              >
                +
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {item.quantity} {item.unit}
            </span>
          )}
        </div>
      </div>

      {/* Expanded area: recipes + delete button */}
      {expanded && (
        <div className="mt-2 ml-[4.5rem] space-y-2">
          {/* Recipe tags */}
          {usedRecipes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {usedRecipes.map((r) => (
                <button
                  key={r!.id}
                  onClick={() => setSelectedRecipeId(r!.id)}
                  className="inline-block px-2 py-0.5 rounded-md bg-ocean-50 dark:bg-ocean-900/20 text-ocean-700 dark:text-ocean-300 text-[10px] cursor-pointer active:bg-ocean-100 dark:active:bg-ocean-800/30"
                >
                  {r!.name}
                </button>
              ))}
            </div>
          )}

          {/* Delete button — only visible when expanded */}
          {isShopping && (
            <button
              onClick={() => deleteShoppingItem(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral-400/10 text-coral-500 text-xs font-medium active:bg-coral-400/20"
            >
              ✕ Удалить
            </button>
          )}
        </div>
      )}

      {selectedRecipeId && (
        <RecipeModal recipeId={selectedRecipeId} onClose={() => setSelectedRecipeId(null)} />
      )}
    </div>
  )
}
