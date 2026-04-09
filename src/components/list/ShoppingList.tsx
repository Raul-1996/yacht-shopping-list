import { useMemo, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import { ListCategory } from './ListCategory'
import { SearchBar } from './SearchBar'
import { ProgressBar } from './ProgressBar'
import { FilterBar } from './FilterBar'
import { AddItemForm } from './AddItemForm'
import type { UnifiedShoppingItem } from '../../types'

export function ShoppingList() {
  const { shoppingItems, householdItems, searchQuery, filterMode, selectedCategory } = useAppStore()

  // Tag items with their source for unified rendering
  const allItems = useMemo(() => {
    const shopping: UnifiedShoppingItem[] = shoppingItems.map((i) => ({ ...i, _source: 'shopping' as const }))
    const household: UnifiedShoppingItem[] = householdItems.map((i) => ({ ...i, _source: 'household' as const }))
    return [...shopping, ...household]
  }, [shoppingItems, householdItems])

  const filtered = useMemo(() => {
    let items = allItems
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (filterMode === 'unchecked') items = items.filter((i) => !i.checked)
    if (filterMode === 'checked') items = items.filter((i) => i.checked)
    return items
  }, [allItems, searchQuery, filterMode])

  // Separate food (shopping) and household categories
  const categories = useMemo(() => {
    const foodItems = filtered.filter((i) => i._source === 'shopping')
    const hhItems = filtered.filter((i) => i._source === 'household')

    const foodMap = new Map<string, UnifiedShoppingItem[]>()
    for (const item of foodItems) {
      if (!foodMap.has(item.category)) foodMap.set(item.category, [])
      foodMap.get(item.category)!.push(item)
    }

    const hhMap = new Map<string, UnifiedShoppingItem[]>()
    for (const item of hhItems) {
      if (!hhMap.has(item.category)) hhMap.set(item.category, [])
      hhMap.get(item.category)!.push(item)
    }

    const foodCats = Array.from(foodMap.entries())
      .filter(([cat]) => !selectedCategory || cat === selectedCategory)
      .sort(([a], [b]) => a.localeCompare(b, 'ru'))

    const hhCats = Array.from(hhMap.entries())
      .filter(([cat]) => !selectedCategory || cat === selectedCategory)
      .sort(([a], [b]) => a.localeCompare(b, 'ru'))

    return { food: foodCats, household: hhCats }
  }, [filtered, selectedCategory])

  const totalItems = allItems.length
  const checkedItems = allItems.filter((i) => i.checked).length

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    allItems.forEach((i) => cats.add(i.category))
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [allItems])

  const hasResults = categories.food.length > 0 || categories.household.length > 0

  const buildListText = useCallback(() => {
    const lines: string[] = []
    lines.push('Список покупок — Яхта Сейшелы')
    lines.push('')

    const foodMap = new Map<string, typeof shoppingItems>()
    for (const item of shoppingItems) {
      if (!foodMap.has(item.category)) foodMap.set(item.category, [])
      foodMap.get(item.category)!.push(item)
    }
    const foodCats = Array.from(foodMap.entries()).sort(([a], [b]) => a.localeCompare(b, 'ru'))

    for (const [cat, items] of foodCats) {
      lines.push(`${cat}:`)
      for (const item of items) {
        const check = item.checked ? '☑' : '☐'
        lines.push(`${check} ${item.name} — ${Math.round(item.quantity * 100) / 100} ${item.unit}`)
      }
      lines.push('')
    }

    if (householdItems.length > 0) {
      lines.push('🧹 Хозяйственные товары')
      lines.push('')
      const hhMap = new Map<string, typeof householdItems>()
      for (const item of householdItems) {
        if (!hhMap.has(item.category)) hhMap.set(item.category, [])
        hhMap.get(item.category)!.push(item)
      }
      const hhCats = Array.from(hhMap.entries()).sort(([a], [b]) => a.localeCompare(b, 'ru'))

      for (const [cat, items] of hhCats) {
        lines.push(`${cat}:`)
        for (const item of items) {
          const check = item.checked ? '☑' : '☐'
          lines.push(`${check} ${item.name} — ${item.quantity} ${item.unit}`)
        }
        lines.push('')
      }
    }

    const allTotal = shoppingItems.length + householdItems.length
    const allChecked = shoppingItems.filter((i) => i.checked).length + householdItems.filter((i) => i.checked).length
    const pct = allTotal > 0 ? Math.round((allChecked / allTotal) * 100) : 0
    lines.push(`Куплено: ${allChecked} из ${allTotal} (${pct}%)`)

    return lines.join('\n')
  }, [shoppingItems, householdItems])

  const shareList = useCallback(async () => {
    const text = buildListText()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Список покупок — Яхта', text })
      } catch { /* user cancelled */ }
    } else {
      // Fallback: download as .txt
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'yacht-shopping-list.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [buildListText])

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar checked={checkedItems} total={totalItems} />
        </div>
        <button
          onClick={shareList}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          aria-label="Поделиться списком"
          title="Поделиться списком"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
      <SearchBar />
      <FilterBar categories={allCategories} />
      {!hasResults ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <p className="text-4xl mb-2">🔍</p>
          <p>Ничего не найдено</p>
        </div>
      ) : (
        <>
          {categories.food.map(([category, items]) => (
            <ListCategory key={category} category={category} items={items} />
          ))}

          {categories.household.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  🧹 Хозяйственные товары
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
              {categories.household.map(([category, items]) => (
                <ListCategory key={category} category={category} items={items} />
              ))}
            </>
          )}
        </>
      )}
      <AddItemForm />
    </div>
  )
}
