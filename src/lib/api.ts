import type { MealPlanDay } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

async function jsonOrThrow(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchShoppingItems() {
  const res = await fetch(`${API_BASE}/api/shopping`);
  return jsonOrThrow(res);
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const res = await fetch(`${API_BASE}/api/shopping/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  return jsonOrThrow(res);
}

export async function adjustShoppingQuantity(id: string, quantity: number) {
  const res = await fetch(`${API_BASE}/api/shopping/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  return jsonOrThrow(res);
}

export async function addShoppingItem(name: string, category: string, quantity: number, unit: string) {
  const res = await fetch(`${API_BASE}/api/shopping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category, quantity, unit }),
  });
  return jsonOrThrow(res);
}

export async function deleteShoppingItem(id: string) {
  const res = await fetch(`${API_BASE}/api/shopping/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchHouseholdItems() {
  const res = await fetch(`${API_BASE}/api/household`);
  return jsonOrThrow(res);
}

export async function toggleHouseholdItem(id: string, checked: boolean) {
  const res = await fetch(`${API_BASE}/api/household/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  return jsonOrThrow(res);
}

export async function fetchPackingItems() {
  const res = await fetch(`${API_BASE}/api/packing`);
  return jsonOrThrow(res);
}

export async function togglePackingItem(id: string, checked: boolean) {
  const res = await fetch(`${API_BASE}/api/packing/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  return jsonOrThrow(res);
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/categories`);
  return jsonOrThrow(res);
}

export async function fetchMealPlan(): Promise<MealPlanDay[]> {
  const res = await fetch(`${API_BASE}/api/mealplan`);
  return jsonOrThrow(res);
}

export async function updateMealSlot(day: number, mealType: string, data: { recipe_ids?: string[], note?: string }) {
  const res = await fetch(`${API_BASE}/api/mealplan/${day}/${mealType}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return jsonOrThrow(res);
}

export function createWebSocket(onMessage: (data: unknown) => void): { close: () => void } {
  let closed = false;
  let currentWs: WebSocket | null = null;

  function connect() {
    if (closed) return;
    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);
    currentWs = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      if (!closed) setTimeout(connect, 2000);
    };
  }

  connect();
  return {
    close() {
      closed = true;
      currentWs?.close();
    },
  };
}
