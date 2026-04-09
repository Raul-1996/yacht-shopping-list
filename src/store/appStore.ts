import { create } from 'zustand'
import type { ShoppingItem, HouseholdItem, PackingItem, Page } from '../types'
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
  loading: boolean;

  shoppingItems: ShoppingItem[];
  householdItems: HouseholdItem[];
  packingItems: PackingItem[];

  setPage: (page: Page) => void;
  toggleDarkMode: () => void;
  setSearchQuery: (q: string) => void;
  setFilterMode: (mode: 'all' | 'unchecked' | 'checked') => void;
  setSelectedCategory: (cat: string | null) => void;
  setOnlineUsers: (count: number) => void;

  toggleShoppingItem: (id: string) => void;
  adjustShoppingQuantity: (id: string, delta: number) => void;
  addShoppingItem: (name: string, category: string, quantity: number, unit: string) => void;
  deleteShoppingItem: (id: string) => void;
  toggleHouseholdItem: (id: string) => void;
  togglePackingItem: (id: string) => void;

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
  loading: true,

  shoppingItems: [],
  householdItems: [],
  packingItems: [],

  setPage: (page) => set({ currentPage: page, searchQuery: '', selectedCategory: null }),
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
    const newQty = Math.max(0, item.quantity + delta);
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

  loadAllData: async () => {
    set({ loading: true });
    try {
      const [shopping, householdData, packing] = await Promise.all([
        api.fetchShoppingItems(),
        api.fetchHouseholdItems(),
        api.fetchPackingItems(),
      ]);
      set({ shoppingItems: shopping, householdItems: householdData, packingItems: packing, loading: false });
    } catch (e) {
      console.error('API unavailable, using bundled data:', e);
      // Offline fallback: load from static JSON bundled in the app
      set({
        shoppingItems: gastronomy.shopping_list.map((item) => ({ ...item, checked: false })),
        householdItems: household.household_supplies.map((item) => ({ ...item, checked: false })),
        packingItems: household.packing_checklist.map((item) => ({ ...item, checked: false })),
        loading: false,
      });
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
      case 'packing:update':
        set((s) => ({
          packingItems: s.packingItems.map((i) => i.id === (msg.item as PackingItem)?.id ? msg.item as PackingItem : i),
        }));
        break;
      case 'presence':
        set({ onlineUsers: msg.count || 0 });
        break;
    }
  },
}));
