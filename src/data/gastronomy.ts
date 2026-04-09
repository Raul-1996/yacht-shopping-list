import type { Recipe, ShoppingItem, MealPlanDay } from '../types'
import data from './gastronomy.json'

interface GastronomyData {
  recipes: Recipe[]
  meal_plan: MealPlanDay[]
  shopping_list: Omit<ShoppingItem, 'checked'>[]
}

export const gastronomy = data as unknown as GastronomyData
