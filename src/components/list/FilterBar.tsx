import { useAppStore } from '../../store/appStore'

export function FilterBar({ categories }: { categories: string[] }) {
  const { filterMode, setFilterMode, selectedCategory, setSelectedCategory } = useAppStore()

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {([
          ['all', 'Все'],
          ['unchecked', 'Не куплено'],
          ['checked', 'Куплено'],
        ] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterMode === mode
                ? 'bg-ocean-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedCategory
              ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
          }`}
        >
          Все категории
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
