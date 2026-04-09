import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { createWebSocket } from './lib/api'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { ShoppingList } from './components/list/ShoppingList'
import { RecipesPage } from './components/recipes/RecipesPage'
import { MealPlanPage } from './components/mealplan/MealPlanPage'
import { PackingPage } from './components/packing/PackingPage'
import './styles/globals.css'

function App() {
  const { currentPage, darkMode, loading, loadAllData, handleWsMessage } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    loadAllData()
    const ws = createWebSocket(handleWsMessage)
    return () => ws.close()
  }, [loadAllData, handleWsMessage])

  return (
    <div className="min-h-dvh flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-2 animate-pulse">⛵</div>
              <p>Загрузка...</p>
            </div>
          </div>
        ) : (
          <>
            {currentPage === 'shopping' && <ShoppingList />}
            {currentPage === 'recipes' && <RecipesPage />}
            {currentPage === 'mealplan' && <MealPlanPage />}
            {currentPage === 'packing' && <PackingPage />}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

export default App
