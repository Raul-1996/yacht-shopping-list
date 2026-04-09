import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'yacht.db');
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(dirname(DB_PATH), { recursive: true });

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS shopping_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'шт',
    checked INTEGER NOT NULL DEFAULT 0,
    used_in_recipes TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS household_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'шт',
    per_cabin INTEGER NOT NULL DEFAULT 0,
    checked INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS packing_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    essential INTEGER NOT NULL DEFAULT 0,
    checked INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS meal_plan (
    day INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    recipe_ids TEXT NOT NULL DEFAULT '[]',
    note TEXT DEFAULT '',
    PRIMARY KEY (day, meal_type)
  );
`);

// Seed data if tables are empty
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM shopping_items').get();
  if (count.c > 0) return;

  console.log('Seeding database...');

  // Load seed data
  const gastronomyPath = join(__dirname, '..', 'src', 'data', 'gastronomy.json');
  const householdPath = join(__dirname, '..', 'src', 'data', 'household.json');

  if (existsSync(gastronomyPath)) {
    const gastronomy = JSON.parse(readFileSync(gastronomyPath, 'utf8'));
    const insertShopping = db.prepare(
      'INSERT OR IGNORE INTO shopping_items (id, name, category, quantity, unit, used_in_recipes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertMany = db.transaction((items) => {
      items.forEach((item, i) => {
        insertShopping.run(item.id, item.name, item.category, item.quantity, item.unit, JSON.stringify(item.used_in_recipes || []), i);
      });
    });
    insertMany(gastronomy.shopping_list);
    console.log(`  Seeded ${gastronomy.shopping_list.length} shopping items`);
  }

  if (existsSync(householdPath)) {
    const household = JSON.parse(readFileSync(householdPath, 'utf8'));

    const insertHousehold = db.prepare(
      'INSERT OR IGNORE INTO household_items (id, name, category, quantity, unit, per_cabin) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertHH = db.transaction((items) => {
      items.forEach((item) => {
        insertHousehold.run(item.id, item.name, item.category, item.quantity, item.unit, item.per_cabin ? 1 : 0);
      });
    });
    insertHH(household.household_supplies);
    console.log(`  Seeded ${household.household_supplies.length} household items`);

    const insertPacking = db.prepare(
      'INSERT OR IGNORE INTO packing_items (id, name, category, quantity, essential) VALUES (?, ?, ?, ?, ?)'
    );
    const insertP = db.transaction((items) => {
      items.forEach((item) => {
        insertPacking.run(item.id, item.name, item.category, item.quantity, item.essential ? 1 : 0);
      });
    });
    insertP(household.packing_checklist);
    console.log(`  Seeded ${household.packing_checklist.length} packing items`);
  }

  // Seed meal plan
  if (existsSync(gastronomyPath)) {
    const gastronomy = JSON.parse(readFileSync(gastronomyPath, 'utf8'));
    if (gastronomy.meal_plan) {
      const insertMeal = db.prepare(
        'INSERT OR IGNORE INTO meal_plan (day, meal_type, recipe_ids, note) VALUES (?, ?, ?, ?)'
      );
      const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
      const insertMeals = db.transaction((days) => {
        let count = 0;
        days.forEach((dayObj) => {
          mealTypes.forEach((mealType) => {
            const meal = dayObj.meals[mealType];
            if (meal) {
              insertMeal.run(dayObj.day, mealType, JSON.stringify(meal.recipe_ids || []), meal.note || '');
              count++;
            }
          });
        });
        return count;
      });
      const mealCount = insertMeals(gastronomy.meal_plan);
      console.log(`  Seeded ${mealCount} meal plan entries`);
    }
  }

  console.log('Seeding complete.');
}

seedIfEmpty();

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// --- Shopping Items ---
app.get('/api/shopping', (req, res) => {
  const items = db.prepare('SELECT * FROM shopping_items ORDER BY sort_order, category, name').all();
  res.json(items.map(i => ({ ...i, checked: !!i.checked, used_in_recipes: JSON.parse(i.used_in_recipes) })));
});

app.patch('/api/shopping/:id', (req, res) => {
  const { id } = req.params;
  const { checked, quantity } = req.body;
  if (checked !== undefined) {
    db.prepare('UPDATE shopping_items SET checked = ? WHERE id = ?').run(checked ? 1 : 0, id);
  }
  if (quantity !== undefined) {
    db.prepare('UPDATE shopping_items SET quantity = ? WHERE id = ?').run(quantity, id);
  }
  const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const result = { ...item, checked: !!item.checked, used_in_recipes: JSON.parse(item.used_in_recipes) };
  broadcast({ type: 'shopping:update', item: result });
  res.json(result);
});

app.post('/api/shopping', (req, res) => {
  const { name, category, quantity, unit } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category required' });
  const id = 'custom_' + Date.now();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM shopping_items').get();
  db.prepare(
    'INSERT INTO shopping_items (id, name, category, quantity, unit, used_in_recipes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, category, quantity || 1, unit || 'шт', '[]', (maxOrder.m || 0) + 1);
  const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id);
  const result = { ...item, checked: !!item.checked, used_in_recipes: JSON.parse(item.used_in_recipes) };
  broadcast({ type: 'shopping:add', item: result });
  res.status(201).json(result);
});

app.delete('/api/shopping/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM shopping_items WHERE id = ?').run(id);
  broadcast({ type: 'shopping:delete', id });
  res.json({ ok: true });
});

// --- Household Items ---
app.get('/api/household', (req, res) => {
  const items = db.prepare('SELECT * FROM household_items ORDER BY category, name').all();
  res.json(items.map(i => ({ ...i, checked: !!i.checked, per_cabin: !!i.per_cabin })));
});

app.patch('/api/household/:id', (req, res) => {
  const { id } = req.params;
  const { checked } = req.body;
  if (checked !== undefined) {
    db.prepare('UPDATE household_items SET checked = ? WHERE id = ?').run(checked ? 1 : 0, id);
  }
  const item = db.prepare('SELECT * FROM household_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const result = { ...item, checked: !!item.checked, per_cabin: !!item.per_cabin };
  broadcast({ type: 'household:update', item: result });
  res.json(result);
});

// --- Packing Items ---
app.get('/api/packing', (req, res) => {
  const items = db.prepare('SELECT * FROM packing_items ORDER BY category, name').all();
  res.json(items.map(i => ({ ...i, checked: !!i.checked, essential: !!i.essential })));
});

app.patch('/api/packing/:id', (req, res) => {
  const { id } = req.params;
  const { checked } = req.body;
  if (checked !== undefined) {
    db.prepare('UPDATE packing_items SET checked = ? WHERE id = ?').run(checked ? 1 : 0, id);
  }
  const item = db.prepare('SELECT * FROM packing_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const result = { ...item, checked: !!item.checked, essential: !!item.essential };
  broadcast({ type: 'packing:update', item: result });
  res.json(result);
});

// --- Meal Plan ---
app.get('/api/mealplan', (req, res) => {
  const rows = db.prepare('SELECT * FROM meal_plan ORDER BY day, meal_type').all();
  const dayMap = {};
  rows.forEach((row) => {
    if (!dayMap[row.day]) dayMap[row.day] = { day: row.day, meals: {} };
    dayMap[row.day].meals[row.meal_type] = {
      recipe_ids: JSON.parse(row.recipe_ids),
      note: row.note || '',
    };
  });
  res.json(Object.values(dayMap).sort((a, b) => a.day - b.day));
});

app.patch('/api/mealplan/:day/:mealType', (req, res) => {
  const day = parseInt(req.params.day, 10);
  const { mealType } = req.params;
  const { recipe_ids, note } = req.body;

  if (recipe_ids !== undefined) {
    db.prepare('UPDATE meal_plan SET recipe_ids = ? WHERE day = ? AND meal_type = ?')
      .run(JSON.stringify(recipe_ids), day, mealType);
  }
  if (note !== undefined) {
    db.prepare('UPDATE meal_plan SET note = ? WHERE day = ? AND meal_type = ?')
      .run(note, day, mealType);
  }

  const row = db.prepare('SELECT * FROM meal_plan WHERE day = ? AND meal_type = ?').get(day, mealType);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const data = { recipe_ids: JSON.parse(row.recipe_ids), note: row.note || '' };
  broadcast({ type: 'mealplan:update', day, mealType, data });
  res.json(data);
});

// --- Categories list ---
app.get('/api/categories', (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM shopping_items ORDER BY category').all();
  res.json(cats.map(c => c.category));
});

// HTTP server + WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });

  // Send current connected count
  broadcastPresence();
});

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}

function broadcastPresence() {
  broadcast({ type: 'presence', count: clients.size });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}/ws`);
});
