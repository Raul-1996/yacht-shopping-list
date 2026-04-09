import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { ShoppingList } from './components/list/ShoppingList'
import { RecipesPage } from './components/recipes/RecipesPage'
import { MealPlanPage } from './components/mealplan/MealPlanPage'
import { PackingPage } from './components/packing/PackingPage'
import { gastronomy } from './data/gastronomy'
import { household } from './data/household'
import './styles/globals.css'

function App() {
  const { currentPage, darkMode, initShoppingItems, initHouseholdItems, initPackingItems } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    initShoppingItems(gastronomy.shopping_list.map((item) => ({ ...item, checked: false })))
    initHouseholdItems(household.household_supplies.map((item) => ({ ...item, checked: false })))
    initPackingItems(household.packing_checklist.map((item) => ({ ...item, checked: false })))
  }, [initShoppingItems, initHouseholdItems, initPackingItems])

  return (
    <div className="min-h-dvh flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        {currentPage === 'shopping' && <ShoppingList />}
        {currentPage === 'recipes' && <RecipesPage />}
        {currentPage === 'mealplan' && <MealPlanPage />}
        {currentPage === 'packing' && <PackingPage />}
      </main>
      <BottomNav />
    </div>
  )
}

export default App
