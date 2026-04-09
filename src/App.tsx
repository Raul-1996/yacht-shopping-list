import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { createWebSocket } from './lib/api'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { InstallPrompt } from './components/layout/InstallPrompt'
import { VersionFooter } from './components/layout/VersionFooter'
import { ShoppingList } from './components/list/ShoppingList'
import { RecipesPage } from './components/recipes/RecipesPage'
import { MealPlanPage } from './components/mealplan/MealPlanPage'
import { PackingPage } from './components/packing/PackingPage'
import './styles/globals.css'

function App() {
  const { currentPage, darkMode, loading, loadAllData, handleWsMessage, setWsConnected } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    loadAllData()
    const ws = createWebSocket(handleWsMessage, loadAllData, setWsConnected)

    // Reload data when app returns from background (iOS kills WS in bg)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadAllData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      ws.close()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
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
        <VersionFooter />
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  )
}

export default App
