import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'

const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'упак', 'рул', 'бут'];

type ItemType = 'shopping' | 'household'

export function AddItemForm() {
  const { shoppingItems, householdItems, addShoppingItem, addHouseholdItem } = useAppStore()
  const [open, setOpen] = useState(false)
  const [itemType, setItemType] = useState<ItemType>('shopping')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('шт')

  const categories = useMemo(() => {
    const cats = new Set<string>()
    const items = itemType === 'shopping' ? shoppingItems : householdItems
    items.forEach((i) => cats.add(i.category))
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [shoppingItems, householdItems, itemType])

  const handleTypeChange = (type: ItemType) => {
    setItemType(type)
    setCategory('')
    setCustomCategory('')
  }

  const handleSubmit = () => {
    const itemName = name.trim()
    const itemCategory = category === '__custom__' ? customCategory.trim() : category
    if (!itemName || !itemCategory) return

    if (itemType === 'shopping') {
      addShoppingItem(itemName, itemCategory, Number(quantity) || 1, unit)
    } else {
      addHouseholdItem(itemName, itemCategory, Number(quantity) || 1, unit)
    }
    setName('')
    setQuantity('1')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm font-medium hover:border-ocean-400 hover:text-ocean-500 transition-colors"
      >
        + Добавить позицию
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          {itemType === 'shopping' ? 'Новый продукт' : 'Новый хозтовар'}
        </span>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
      </div>

      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => handleTypeChange('shopping')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            itemType === 'shopping'
              ? 'bg-ocean-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          Продукт
        </button>
        <button
          onClick={() => handleTypeChange('household')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            itemType === 'household'
              ? 'bg-ocean-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          Хозтовар
        </button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название..."
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
      >
        <option value="">Выберите категорию...</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="__custom__">+ Другая категория</option>
      </select>

      {category === '__custom__' && (
        <input
          type="text"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Название категории..."
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
        />
      )}

      <div className="flex gap-2">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="0.1"
          className="w-20 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base text-center focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base focus:outline-none focus:ring-2 focus:ring-ocean-500/50"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim() || (!category || (category === '__custom__' && !customCategory.trim()))}
        className="w-full py-2.5 rounded-xl bg-ocean-500 text-white text-sm font-medium hover:bg-ocean-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Добавить
      </button>
    </div>
  )
}
