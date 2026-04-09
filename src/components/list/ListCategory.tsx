import { useState } from 'react'
import type { ShoppingItem } from '../../types'
import { ListItem } from './ListItem'

export function ListCategory({ category, items }: { category: string; items: ShoppingItem[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const checkedCount = items.filter((i) => i.checked).length
  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)
  const sorted = [...unchecked, ...checked]

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs transition-transform ${collapsed ? '' : 'rotate-90'}`}>▶</span>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{category}</span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          {checkedCount}/{items.length}
        </span>
      </button>
      {!collapsed && (
        <div className="px-2 pb-2 space-y-0.5">
          {sorted.map((item) => (
            <ListItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
