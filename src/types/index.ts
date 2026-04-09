export interface Recipe {
  id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  prep_time_minutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  is_fish_dish: boolean;
  fresh_catch: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  used_in_recipes: string[];
}

export interface MealPlanDay {
  day: number;
  date_label: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    snack: string[];
    dinner: string[];
  };
}

export interface HouseholdItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  per_cabin: boolean;
  checked: boolean;
}

export interface PackingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  essential: boolean;
  checked: boolean;
}

export interface EsimProvider {
  provider: string;
  data_amount: string;
  validity_days: number;
  price_usd: number;
  price_eur: number;
  coverage: string;
  setup_instructions: string;
  pros: string[];
  cons: string[];
  url: string;
}

export type Page = 'shopping' | 'recipes' | 'mealplan' | 'packing';
