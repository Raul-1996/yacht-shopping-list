import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import type { ShoppingItem } from '../../types'
import { gastronomy } from '../../data/gastronomy'

export function ListItem({ item }: { item: ShoppingItem }) {
  const { toggleShoppingItem, adjustShoppingQuantity } = useAppStore()
  const [expanded, setExpanded] = useState(false)

  const usedRecipes = item.used_in_recipes
    .map((id) => gastronomy.recipes.find((r) => r.id === id))
    .filter(Boolean)

  return (
    <div
      className={`rounded-xl px-3 py-2.5 transition-all ${
        item.checked
          ? 'bg-slate-100/50 dark:bg-slate-800/30'
          : 'bg-white dark:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleShoppingItem(item.id)}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
            item.checked
              ? 'bg-sea-green-500 border-sea-green-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-ocean-400'
          }`}
        >
          {item.checked && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex-1 text-left text-sm transition-colors ${
            item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          {item.name}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => adjustShoppingQuantity(item.id, -1)}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            −
          </button>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 min-w-[3rem] text-center tabular-nums">
            {item.quantity} {item.unit}
          </span>
          <button
            onClick={() => adjustShoppingQuantity(item.id, 1)}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {expanded && usedRecipes.length > 0 && (
        <div className="mt-2 ml-9 flex flex-wrap gap-1">
          {usedRecipes.map((r) => (
            <span
              key={r!.id}
              className="inline-block px-2 py-0.5 rounded-md bg-ocean-50 dark:bg-ocean-900/20 text-ocean-700 dark:text-ocean-300 text-[10px]"
            >
              {r!.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
