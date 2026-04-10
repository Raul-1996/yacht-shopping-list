import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'

const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак', 'рул', 'бут']

export function InlinAddItem({ category, source }: { category: string; source: 'shopping' | 'household' }) {
  const { addShoppingItem, addHouseholdItem } = useAppStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('шт')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSubmit = () => {
    const itemName = name.trim()
    if (!itemName) return

    if (source === 'shopping') {
      addShoppingItem(itemName, category, Number(quantity) || 1, unit)
    } else {
      addHouseholdItem(itemName, category, Number(quantity) || 1, unit)
    }
    setName('')
    setQuantity('1')
    setUnit('шт')
    // keep form open for adding multiple items
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-medium hover:text-ocean-500 dark:hover:text-ocean-400 hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-center gap-1"
      >
        <span className="text-base leading-none">+</span>
        <span>Добавить</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/60 px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название..."
          className="flex-1 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 min-h-[36px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600 text-xs px-1"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="0.1"
          className="w-16 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="px-4 py-1.5 rounded-lg bg-ocean-500 text-white text-sm font-medium hover:bg-ocean-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[36px]"
        >
          +
        </button>
      </div>
    </div>
  )
}
