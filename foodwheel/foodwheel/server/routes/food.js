const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { attachTags, FILTERABLE_TAGS, tagSlugsMatchingQuery } = require('../utils/foodTags');

const router = express.Router();

const FOOD_COLUMNS = 'id, category_key, name, kcal, protein, carbs, fat, benefit, img';

// GET /api/categories  -> all categories, ordered
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT key, label, emoji, img FROM categories ORDER BY sort_order ASC, id ASC').all();
  res.json({ categories: rows });
});

// GET /api/tags -> the list of filterable nutrition tags, for building quick-filter buttons
router.get('/tags', (req, res) => {
  res.json({ tags: FILTERABLE_TAGS });
});

// GET /api/foods/search?q=...&tag=...  -> search by name/benefit across every category,
// optionally narrowed by a computed nutrition tag (e.g. "low-calorie", "healthy").
// `q` also understands natural-language nutrition phrases — "healthy food",
// "less fat food", "low calorie food" — by matching them against each tag's
// aliases, so a text search alone can answer those without picking a chip.
// Registered before /foods/:category so "search" is never swallowed as a category key.
router.get('/foods/search', (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const tag = (req.query.tag || '').toString().trim().toLowerCase();

  let rows = db
    .prepare(`SELECT f.${FOOD_COLUMNS.replace(/(^|, )/g, '$1f.').replace('f.id', 'id')}, c.label AS category_label, c.emoji AS category_emoji
              FROM foods f JOIN categories c ON c.key = f.category_key
              ORDER BY f.name ASC`)
    .all();

  rows = attachTags(rows);

  if (q) {
    const impliedTagSlugs = tagSlugsMatchingQuery(q);
    rows = rows.filter((f) =>
      f.name.toLowerCase().includes(q) ||
      f.benefit.toLowerCase().includes(q) ||
      (impliedTagSlugs.length > 0 && f.tags.some((t) => impliedTagSlugs.includes(t.slug)))
    );
  }

  if (tag) {
    rows = rows.filter((f) => f.tags.some((t) => t.slug === tag));
  }

  res.json({ foods: rows, count: rows.length });
});

// GET /api/foods/:category -> all foods in a category
router.get('/foods/:category', (req, res) => {
  const cat = db.prepare('SELECT key FROM categories WHERE key = ?').get(req.params.category);
  if (!cat) return res.status(404).json({ error: 'ไม่พบหมวดหมู่นี้' });

  const rows = db
    .prepare(`SELECT ${FOOD_COLUMNS} FROM foods WHERE category_key = ? ORDER BY id ASC`)
    .all(req.params.category);
  res.json({ foods: attachTags(rows) });
});

// POST /api/foods -> add a new food (requires login)
router.post('/foods', requireAuth, (req, res) => {
  const { category_key, name } = req.body || {};
  if (!category_key || !name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุหมวดหมู่และชื่อเมนู' });
  }
  const cat = db.prepare('SELECT key FROM categories WHERE key = ?').get(category_key);
  if (!cat) return res.status(404).json({ error: 'ไม่พบหมวดหมู่นี้' });

  const kcal = Number.isFinite(+req.body.kcal) ? +req.body.kcal : 300;
  const protein = Number.isFinite(+req.body.protein) ? +req.body.protein : 8;
  const carbs = Number.isFinite(+req.body.carbs) ? +req.body.carbs : 40;
  const fat = Number.isFinite(+req.body.fat) ? +req.body.fat : 10;
  const benefit = (req.body.benefit || 'เมนูที่เพิ่มเองโดยผู้ใช้ — ข้อมูลโภชนาการเป็นค่าประมาณ').toString();
  const img = (req.body.img || '').toString();

  const info = db
    .prepare(`INSERT INTO foods (category_key, name, kcal, protein, carbs, fat, benefit, img, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(category_key, name.trim(), kcal, protein, carbs, fat, benefit, img, req.session.userId);

  const food = db.prepare(`SELECT ${FOOD_COLUMNS} FROM foods WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ food: attachTags([food])[0] });
});

// PUT /api/foods/:id -> edit a food's name (requires login)
router.put('/foods/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  const name = (req.body.name ?? existing.name).toString().trim();
  if (!name) return res.status(400).json({ error: 'ชื่อเมนูห้ามว่าง' });

  db.prepare('UPDATE foods SET name = ? WHERE id = ?').run(name, req.params.id);
  const food = db.prepare(`SELECT ${FOOD_COLUMNS} FROM foods WHERE id = ?`).get(req.params.id);
  res.json({ food: attachTags([food])[0] });
});

// DELETE /api/foods/:id -> remove a food (requires login, min 2 per category enforced client-side + here)
router.delete('/foods/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  const { c } = db.prepare('SELECT COUNT(*) AS c FROM foods WHERE category_key = ?').get(existing.category_key);
  if (c <= 2) {
    return res.status(400).json({ error: 'ต้องมีรายการอาหารอย่างน้อย 2 รายการในหมวดหมู่นี้' });
  }

  db.prepare('DELETE FROM foods WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
