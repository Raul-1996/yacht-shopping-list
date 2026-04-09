import { useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { ListCategory } from './ListCategory'
import { SearchBar } from './SearchBar'
import { ProgressBar } from './ProgressBar'
import { FilterBar } from './FilterBar'
import { AddItemForm } from './AddItemForm'

export function ShoppingList() {
  const { shoppingItems, searchQuery, filterMode, selectedCategory } = useAppStore()

  const filtered = useMemo(() => {
    let items = shoppingItems
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (filterMode === 'unchecked') items = items.filter((i) => !i.checked)
    if (filterMode === 'checked') items = items.filter((i) => i.checked)
    return items
  }, [shoppingItems, searchQuery, filterMode])

  const categories = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const item of filtered) {
      const cat = item.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return Array.from(map.entries())
      .filter(([cat]) => !selectedCategory || cat === selectedCategory)
      .sort(([a], [b]) => a.localeCompare(b, 'ru'))
  }, [filtered, selectedCategory])

  const totalItems = shoppingItems.length
  const checkedItems = shoppingItems.filter((i) => i.checked).length

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    shoppingItems.forEach((i) => cats.add(i.category))
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [shoppingItems])

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
      <ProgressBar checked={checkedItems} total={totalItems} />
      <SearchBar />
      <FilterBar categories={allCategories} />
      {categories.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <p className="text-4xl mb-2">🔍</p>
          <p>Ничего не найдено</p>
        </div>
      ) : (
        categories.map(([category, items]) => (
          <ListCategory key={category} category={category} items={items} />
        ))
      )}
      <AddItemForm />
    </div>
  )
}
