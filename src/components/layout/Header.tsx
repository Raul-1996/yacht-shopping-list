import { useAppStore } from '../../store/appStore'

export function Header() {
  const { darkMode, toggleDarkMode, currentPage, onlineUsers } = useAppStore()

  const pageTitle: Record<string, string> = {
    shopping: 'Список покупок',
    recipes: 'Рецепты',
    mealplan: 'План питания',
    packing: 'Сборы и информация',
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛵</span>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {pageTitle[currentPage]}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Сейшелы · 8 человек · 7 дней
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onlineUsers > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sea-green-400/10 text-sea-green-500">
              <span className="w-2 h-2 rounded-full bg-sea-green-500 animate-pulse" />
              <span className="text-xs font-medium">{onlineUsers}</span>
            </div>
          )}
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Переключить тему"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}
