import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ShoppingItem, HouseholdItem, PackingItem, Page } from '../types'

interface AppState {
  currentPage: Page;
  darkMode: boolean;
  searchQuery: string;
  filterMode: 'all' | 'unchecked' | 'checked';
  selectedCategory: string | null;

  shoppingItems: ShoppingItem[];
  householdItems: HouseholdItem[];
  packingItems: PackingItem[];

  setPage: (page: Page) => void;
  toggleDarkMode: () => void;
  setSearchQuery: (q: string) => void;
  setFilterMode: (mode: 'all' | 'unchecked' | 'checked') => void;
  setSelectedCategory: (cat: string | null) => void;

  toggleShoppingItem: (id: string) => void;
  adjustShoppingQuantity: (id: string, delta: number) => void;
  toggleHouseholdItem: (id: string) => void;
  togglePackingItem: (id: string) => void;

  initShoppingItems: (items: ShoppingItem[]) => void;
  initHouseholdItems: (items: HouseholdItem[]) => void;
  initPackingItems: (items: PackingItem[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'shopping',
      darkMode: false,
      searchQuery: '',
      filterMode: 'all',
      selectedCategory: null,

      shoppingItems: [],
      householdItems: [],
      packingItems: [],

      setPage: (page) => set({ currentPage: page, searchQuery: '', selectedCategory: null }),
      toggleDarkMode: () => set((s) => {
        const next = !s.darkMode;
        document.documentElement.classList.toggle('dark', next);
        return { darkMode: next };
      }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterMode: (mode) => set({ filterMode: mode }),
      setSelectedCategory: (cat) => set({ selectedCategory: cat }),

      toggleShoppingItem: (id) => set((s) => ({
        shoppingItems: s.shoppingItems.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      })),
      adjustShoppingQuantity: (id, delta) => set((s) => ({
        shoppingItems: s.shoppingItems.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ),
      })),
      toggleHouseholdItem: (id) => set((s) => ({
        householdItems: s.householdItems.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      })),
      togglePackingItem: (id) => set((s) => ({
        packingItems: s.packingItems.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      })),

      initShoppingItems: (items) => set((s) => {
        if (s.shoppingItems.length > 0) return {};
        return { shoppingItems: items };
      }),
      initHouseholdItems: (items) => set((s) => {
        if (s.householdItems.length > 0) return {};
        return { householdItems: items };
      }),
      initPackingItems: (items) => set((s) => {
        if (s.packingItems.length > 0) return {};
        return { packingItems: items };
      }),
    }),
    {
      name: 'yacht-shopping-list',
      partialize: (state) => ({
        darkMode: state.darkMode,
        shoppingItems: state.shoppingItems,
        householdItems: state.householdItems,
        packingItems: state.packingItems,
      }),
    }
  )
)
