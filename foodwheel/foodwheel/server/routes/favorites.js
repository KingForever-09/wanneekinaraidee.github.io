const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const FOOD_FIELDS = 'f.id, f.category_key, f.name, f.kcal, f.protein, f.carbs, f.fat, f.benefit, f.img';

// GET /api/favorites -> the logged-in user's favorited foods, most recent first
router.get('/favorites', requireAuth, (req, res) => {
  const rows = db
    .prepare(`
      SELECT ${FOOD_FIELDS}, fav.created_at AS favorited_at,
             EXISTS(SELECT 1 FROM recipes r WHERE r.food_id = f.id) AS has_recipe
      FROM favorites fav
      JOIN foods f ON f.id = fav.food_id
      WHERE fav.user_id = ?
      ORDER BY fav.created_at DESC
    `)
    .all(req.session.userId);
  res.json({ favorites: rows });
});

// POST /api/favorites/:foodId -> favorite a food (idempotent)
router.post('/favorites/:foodId', requireAuth, (req, res) => {
  const food = db.prepare('SELECT id FROM foods WHERE id = ?').get(req.params.foodId);
  if (!food) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  db.prepare('INSERT OR IGNORE INTO favorites (user_id, food_id) VALUES (?, ?)')
    .run(req.session.userId, req.params.foodId);
  res.status(201).json({ ok: true, favorited: true });
});

// DELETE /api/favorites/:foodId -> unfavorite a food
router.delete('/favorites/:foodId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND food_id = ?')
    .run(req.session.userId, req.params.foodId);
  res.json({ ok: true, favorited: false });
});

// GET /api/favorites/ids -> just the set of food IDs the user has favorited (cheap, for UI heart states)
router.get('/favorites/ids', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT food_id FROM favorites WHERE user_id = ?').all(req.session.userId);
  res.json({ ids: rows.map(r => r.food_id) });
});

module.exports = router;
