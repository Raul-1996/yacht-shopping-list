const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

export async function fetchShoppingItems() {
  const res = await fetch(`${API_BASE}/api/shopping`);
  return res.json();
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const res = await fetch(`${API_BASE}/api/shopping/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  return res.json();
}

export async function adjustShoppingQuantity(id: string, quantity: number) {
  const res = await fetch(`${API_BASE}/api/shopping/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  return res.json();
}

export async function addShoppingItem(name: string, category: string, quantity: number, unit: string) {
  const res = await fetch(`${API_BASE}/api/shopping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category, quantity, unit }),
  });
  return res.json();
}

export async function deleteShoppingItem(id: string) {
  await fetch(`${API_BASE}/api/shopping/${id}`, { method: 'DELETE' });
}

export async function fetchHouseholdItems() {
  const res = await fetch(`${API_BASE}/api/household`);
  return res.json();
}

export async function toggleHouseholdItem(id: string, checked: boolean) {
  const res = await fetch(`${API_BASE}/api/household/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  return res.json();
}

export async function fetchPackingItems() {
  const res = await fetch(`${API_BASE}/api/packing`);
  return res.json();
}

export async function togglePackingItem(id: string, checked: boolean) {
  const res = await fetch(`${API_BASE}/api/packing/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/categories`);
  return res.json();
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
