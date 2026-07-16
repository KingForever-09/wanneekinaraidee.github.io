const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/categories  -> all categories, ordered
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT key, label, emoji, img FROM categories ORDER BY sort_order ASC, id ASC').all();
  res.json({ categories: rows });
});

// GET /api/foods/:category -> all foods in a category
router.get('/foods/:category', (req, res) => {
  const cat = db.prepare('SELECT key FROM categories WHERE key = ?').get(req.params.category);
  if (!cat) return res.status(404).json({ error: 'ไม่พบหมวดหมู่นี้' });

  const rows = db
    .prepare('SELECT id, category_key, name, kcal, protein, carbs, fat, benefit, img FROM foods WHERE category_key = ? ORDER BY id ASC')
    .all(req.params.category);
  res.json({ foods: rows });
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

  const food = db.prepare('SELECT id, category_key, name, kcal, protein, carbs, fat, benefit, img FROM foods WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ food });
});

// PUT /api/foods/:id -> edit a food's name (requires login)
router.put('/foods/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  const name = (req.body.name ?? existing.name).toString().trim();
  if (!name) return res.status(400).json({ error: 'ชื่อเมนูห้ามว่าง' });

  db.prepare('UPDATE foods SET name = ? WHERE id = ?').run(name, req.params.id);
  const food = db.prepare('SELECT id, category_key, name, kcal, protein, carbs, fat, benefit, img FROM foods WHERE id = ?').get(req.params.id);
  res.json({ food });
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
