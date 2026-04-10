import { create } from 'zustand'
import type { ShoppingItem, HouseholdItem, PackingItem, MealPlanDay, MealSlot, Page } from '../types'
import * as api from '../lib/api'
import { gastronomy } from '../data/gastronomy'
import { household } from '../data/household'

interface AppState {
  currentPage: Page;
  darkMode: boolean;
  searchQuery: string;
  filterMode: 'all' | 'unchecked' | 'checked';
  selectedCategory: string | null;
  onlineUsers: number;
  wsConnected: boolean;
  loading: boolean;
  pageResetCounter: number;

  shoppingItems: ShoppingItem[];
  householdItems: HouseholdItem[];
  packingItems: PackingItem[];
  mealPlan: MealPlanDay[];

  setPage: (page: Page) => void;
  toggleDarkMode: () => void;
  setSearchQuery: (q: string) => void;
  setFilterMode: (mode: 'all' | 'unchecked' | 'checked') => void;
  setSelectedCategory: (cat: string | null) => void;
  setOnlineUsers: (count: number) => void;
  setWsConnected: (connected: boolean) => void;

  toggleShoppingItem: (id: string) => void;
  adjustShoppingQuantity: (id: string, delta: number) => void;
  addShoppingItem: (name: string, category: string, quantity: number, unit: string) => void;
  deleteShoppingItem: (id: string) => void;
  toggleHouseholdItem: (id: string) => void;
  adjustHouseholdQuantity: (id: string, delta: number) => void;
  deleteHouseholdItem: (id: string) => void;
  togglePackingItem: (id: string) => void;

  replaceRecipeInMealPlan: (day: number, mealType: string, oldRecipeId: string, newRecipeId: string) => void;
  addRecipeToMealSlot: (day: number, mealType: string, recipeId: string) => void;
  removeRecipeFromMealSlot: (day: number, mealType: string, recipeId: string) => void;
  updateMealSlotNote: (day: number, mealType: string, note: string) => void;

  loadAllData: () => void;
  handleWsMessage: (data: unknown) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  currentPage: 'shopping',
  darkMode: localStorage.getItem('yacht-dark-mode') === 'true',
  searchQuery: '',
  filterMode: 'all',
  selectedCategory: null,
  onlineUsers: 0,
  wsConnected: false,
  loading: true,
  pageResetCounter: 0,

  shoppingItems: [],
  householdItems: [],
  packingItems: [],
  mealPlan: [],

  setPage: (page) => set((s) => ({ currentPage: page, searchQuery: '', selectedCategory: null, pageResetCounter: (s.pageResetCounter || 0) + 1 })),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem('yacht-dark-mode', String(next));
    document.documentElement.classList.toggle('dark', next);
    return { darkMode: next };
  }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterMode: (mode) => set({ filterMode: mode }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setOnlineUsers: (count) => set({ onlineUsers: count }),
  setWsConnected: (connected) => set({ wsConnected: connected }),

  toggleShoppingItem: (id) => {
    const item = get().shoppingItems.find((i) => i.id === id);
    if (!item) return;
    const newChecked = !item.checked;
    // Optimistic update
    set((s) => ({
      shoppingItems: s.shoppingItems.map((i) => i.id === id ? { ...i, checked: newChecked } : i),
    }));
    api.toggleShoppingItem(id, newChecked).catch(() => {
      // Rollback
      set((s) => ({
        shoppingItems: s.shoppingItems.map((i) => i.id === id ? { ...i, checked: !newChecked } : i),
      }));
    });
  },

  adjustShoppingQuantity: (id, delta) => {
    const item = get().shoppingItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.round(Math.max(0, item.quantity + delta) * 100) / 100;
    set((s) => ({
      shoppingItems: s.shoppingItems.map((i) => i.id === id ? { ...i, quantity: newQty } : i),
    }));
    api.adjustShoppingQuantity(id, newQty).catch(() => {
      set((s) => ({
        shoppingItems: s.shoppingItems.map((i) => i.id === id ? { ...i, quantity: item.quantity } : i),
      }));
    });
  },

  addShoppingItem: async (name, category, quantity, unit) => {
    try {
      const item = await api.addShoppingItem(name, category, quantity, unit);
      // Will be added via WebSocket broadcast, but add optimistically too
      set((s) => {
        if (s.shoppingItems.find((i) => i.id === item.id)) return {};
        return { shoppingItems: [...s.shoppingItems, item] };
      });
    } catch (e) {
      console.error('Failed to add item:', e);
    }
  },

  deleteShoppingItem: (id) => {
    set((s) => ({
      shoppingItems: s.shoppingItems.filter((i) => i.id !== id),
    }));
    api.deleteShoppingItem(id).catch(() => {
      // Reload on error
      get().loadAllData();
    });
  },

  deleteHouseholdItem: (id) => {
    set((s) => ({
      householdItems: s.householdItems.filter((i) => i.id !== id),
    }));
    api.deleteHouseholdItem(id).catch(() => {
      get().loadAllData();
    });
  },

  toggleHouseholdItem: (id) => {
    const item = get().householdItems.find((i) => i.id === id);
    if (!item) return;
    const newChecked = !item.checked;
    set((s) => ({
      householdItems: s.householdItems.map((i) => i.id === id ? { ...i, checked: newChecked } : i),
    }));
    api.toggleHouseholdItem(id, newChecked).catch(() => {
      set((s) => ({
        householdItems: s.householdItems.map((i) => i.id === id ? { ...i, checked: !newChecked } : i),
      }));
    });
  },

  adjustHouseholdQuantity: (id, delta) => {
    const item = get().householdItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.round(Math.max(0, item.quantity + delta) * 100) / 100;
    set((s) => ({
      householdItems: s.householdItems.map((i) => i.id === id ? { ...i, quantity: newQty } : i),
    }));
    api.adjustHouseholdQuantity(id, newQty).catch(() => {
      set((s) => ({
        householdItems: s.householdItems.map((i) => i.id === id ? { ...i, quantity: item.quantity } : i),
      }));
    });
  },

  togglePackingItem: (id) => {
    const item = get().packingItems.find((i) => i.id === id);
    if (!item) return;
    const newChecked = !item.checked;
    set((s) => ({
      packingItems: s.packingItems.map((i) => i.id === id ? { ...i, checked: newChecked } : i),
    }));
    api.togglePackingItem(id, newChecked).catch(() => {
      set((s) => ({
        packingItems: s.packingItems.map((i) => i.id === id ? { ...i, checked: !newChecked } : i),
      }));
    });
  },

  replaceRecipeInMealPlan: (day, mealType, oldRecipeId, newRecipeId) => {
    const prev = get().mealPlan;
    set((s) => ({
      mealPlan: s.mealPlan.map((d) =>
        d.day === day
          ? {
              ...d,
              meals: {
                ...d.meals,
                [mealType]: {
                  ...d.meals[mealType as keyof typeof d.meals],
                  recipe_ids: (d.meals[mealType as keyof typeof d.meals] as MealSlot).recipe_ids.map((id) =>
                    id === oldRecipeId ? newRecipeId : id
                  ),
                },
              },
            }
          : d
      ),
    }));
    const slot = get().mealPlan.find((d) => d.day === day)?.meals[mealType as keyof MealPlanDay['meals']];
    api.updateMealSlot(day, mealType, { recipe_ids: slot?.recipe_ids }).catch(() => {
      set({ mealPlan: prev });
    });
  },

  addRecipeToMealSlot: (day, mealType, recipeId) => {
    const prev = get().mealPlan;
    set((s) => ({
      mealPlan: s.mealPlan.map((d) =>
        d.day === day
          ? {
              ...d,
              meals: {
                ...d.meals,
                [mealType]: {
                  ...d.meals[mealType as keyof typeof d.meals],
                  recipe_ids: [...(d.meals[mealType as keyof typeof d.meals] as MealSlot).recipe_ids, recipeId],
                },
              },
            }
          : d
      ),
    }));
    const slot = get().mealPlan.find((d) => d.day === day)?.meals[mealType as keyof MealPlanDay['meals']];
    api.updateMealSlot(day, mealType, { recipe_ids: slot?.recipe_ids }).catch(() => {
      set({ mealPlan: prev });
    });
  },

  removeRecipeFromMealSlot: (day, mealType, recipeId) => {
    const prev = get().mealPlan;
    set((s) => ({
      mealPlan: s.mealPlan.map((d) =>
        d.day === day
          ? {
              ...d,
              meals: {
                ...d.meals,
                [mealType]: {
                  ...d.meals[mealType as keyof typeof d.meals],
                  recipe_ids: (d.meals[mealType as keyof typeof d.meals] as MealSlot).recipe_ids.filter((id) => id !== recipeId),
                },
              },
            }
          : d
      ),
    }));
    const slot = get().mealPlan.find((d) => d.day === day)?.meals[mealType as keyof MealPlanDay['meals']];
    api.updateMealSlot(day, mealType, { recipe_ids: slot?.recipe_ids }).catch(() => {
      set({ mealPlan: prev });
    });
  },

  updateMealSlotNote: (day, mealType, note) => {
    const prev = get().mealPlan;
    set((s) => ({
      mealPlan: s.mealPlan.map((d) =>
        d.day === day
          ? {
              ...d,
              meals: {
                ...d.meals,
                [mealType]: {
                  ...d.meals[mealType as keyof typeof d.meals],
                  note,
                },
              },
            }
          : d
      ),
    }));
    api.updateMealSlot(day, mealType, { note }).catch(() => {
      set({ mealPlan: prev });
    });
  },

  loadAllData: async () => {
    set({ loading: true });
    try {
      const [shopping, householdData, packing, mealPlanData] = await Promise.all([
        api.fetchShoppingItems(),
        api.fetchHouseholdItems(),
        api.fetchPackingItems(),
        api.fetchMealPlan(),
      ]);
      set({ shoppingItems: shopping, householdItems: householdData, packingItems: packing, mealPlan: mealPlanData, loading: false });
      // Cache data for offline use
      try {
        localStorage.setItem('yacht-cache-shopping', JSON.stringify(shopping));
        localStorage.setItem('yacht-cache-household', JSON.stringify(householdData));
        localStorage.setItem('yacht-cache-packing', JSON.stringify(packing));
        localStorage.setItem('yacht-cache-mealplan', JSON.stringify(mealPlanData));
      } catch { /* localStorage full — ignore */ }
    } catch (e) {
      console.error('API unavailable, trying offline cache:', e);
      // Try localStorage cache first (has checked states from last session)
      const cachedShopping = localStorage.getItem('yacht-cache-shopping');
      const cachedHousehold = localStorage.getItem('yacht-cache-household');
      const cachedPacking = localStorage.getItem('yacht-cache-packing');
      const cachedMealplan = localStorage.getItem('yacht-cache-mealplan');

      if (cachedShopping && cachedHousehold && cachedPacking) {
        set({
          shoppingItems: JSON.parse(cachedShopping),
          householdItems: JSON.parse(cachedHousehold),
          packingItems: JSON.parse(cachedPacking),
          mealPlan: cachedMealplan ? JSON.parse(cachedMealplan) : gastronomy.meal_plan,
          loading: false,
        });
      } else {
        // Last resort: bundled data (no checked states)
        set({
          shoppingItems: gastronomy.shopping_list.map((item) => ({ ...item, checked: false })),
          householdItems: household.household_supplies.map((item) => ({ ...item, checked: false })),
          packingItems: household.packing_checklist.map((item) => ({ ...item, checked: false })),
          mealPlan: gastronomy.meal_plan,
          loading: false,
        });
      }
    }
  },

  handleWsMessage: (data: unknown) => {
    const msg = data as { type: string; item?: ShoppingItem | HouseholdItem | PackingItem; id?: string; count?: number };
    switch (msg.type) {
      case 'shopping:update':
        set((s) => ({
          shoppingItems: s.shoppingItems.map((i) => i.id === (msg.item as ShoppingItem)?.id ? msg.item as ShoppingItem : i),
        }));
        break;
      case 'shopping:add':
        set((s) => {
          if (s.shoppingItems.find((i) => i.id === (msg.item as ShoppingItem)?.id)) return {};
          return { shoppingItems: [...s.shoppingItems, msg.item as ShoppingItem] };
        });
        break;
      case 'shopping:delete':
        set((s) => ({
          shoppingItems: s.shoppingItems.filter((i) => i.id !== msg.id),
        }));
        break;
      case 'household:update':
        set((s) => ({
          householdItems: s.householdItems.map((i) => i.id === (msg.item as HouseholdItem)?.id ? msg.item as HouseholdItem : i),
        }));
        break;
      case 'household:add':
        set((s) => {
          if (s.householdItems.find((i) => i.id === (msg.item as HouseholdItem)?.id)) return {};
          return { householdItems: [...s.householdItems, msg.item as HouseholdItem] };
        });
        break;
      case 'household:delete':
        set((s) => ({
          householdItems: s.householdItems.filter((i) => i.id !== msg.id),
        }));
        break;
      case 'packing:update':
        set((s) => ({
          packingItems: s.packingItems.map((i) => i.id === (msg.item as PackingItem)?.id ? msg.item as PackingItem : i),
        }));
        break;
      case 'mealplan:update': {
        const { day, mealType, data } = msg as any;
        set((s) => ({
          mealPlan: s.mealPlan.map((d) =>
            d.day === day ? { ...d, meals: { ...d.meals, [mealType]: data } } : d
          ),
        }));
        break;
      }
      case 'presence':
        set({ onlineUsers: msg.count || 0 });
        break;
    }
  },
}));
