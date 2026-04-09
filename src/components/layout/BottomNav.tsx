import { useAppStore } from '../../store/appStore'
import type { Page } from '../../types'

const tabs: { id: Page; label: string; icon: string }[] = [
  { id: 'shopping', label: 'Покупки', icon: '🛒' },
  { id: 'recipes', label: 'Рецепты', icon: '👨‍🍳' },
  { id: 'mealplan', label: 'Меню', icon: '📅' },
  { id: 'packing', label: 'Сборы', icon: '🧳' },
]

export function BottomNav() {
  const { currentPage, setPage } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPage(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
              currentPage === tab.id
                ? 'text-ocean-600 dark:text-ocean-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
