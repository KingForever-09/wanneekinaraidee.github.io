const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'foodwheel.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '',
    img TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_key TEXT NOT NULL REFERENCES categories(key) ON DELETE CASCADE,
    name TEXT NOT NULL,
    kcal INTEGER NOT NULL DEFAULT 300,
    protein INTEGER NOT NULL DEFAULT 8,
    carbs INTEGER NOT NULL DEFAULT 40,
    fat INTEGER NOT NULL DEFAULT 10,
    benefit TEXT NOT NULL DEFAULT '',
    img TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category_key);

  -- Logged-in-only feature #1: favorites (one row per user+food, so it doubles as a like/unlike toggle)
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, food_id)
  );
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

  -- Logged-in-only feature #2: recipes (one row per food, ingredients/steps stored as JSON text)
  CREATE TABLE IF NOT EXISTS recipes (
    food_id INTEGER PRIMARY KEY REFERENCES foods(id) ON DELETE CASCADE,
    servings INTEGER NOT NULL DEFAULT 2,
    prep_minutes INTEGER NOT NULL DEFAULT 15,
    cook_minutes INTEGER NOT NULL DEFAULT 15,
    ingredients TEXT NOT NULL DEFAULT '[]',
    steps TEXT NOT NULL DEFAULT '[]'
  );
`);

module.exports = db;
