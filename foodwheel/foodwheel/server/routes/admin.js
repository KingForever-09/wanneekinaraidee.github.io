const express = require('express');
const db = require('../db');
const requireAdmin = require('../middleware/requireAdmin');
const { isAdminEmail } = require('../utils/admin');
const { attachTags } = require('../utils/foodTags');

const router = express.Router();

// GET /api/admin/stats -> quick counts for the dashboard cards
router.get('/admin/stats', requireAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const totalFoods = db.prepare('SELECT COUNT(*) c FROM foods').get().c;
  const totalFavorites = db.prepare('SELECT COUNT(*) c FROM favorites').get().c;
  const totalCategories = db.prepare('SELECT COUNT(*) c FROM categories').get().c;
  const signupsLast7Days = db
    .prepare("SELECT COUNT(*) c FROM users WHERE created_at >= datetime('now', '-7 days')")
    .get().c;
  const loginsLast24h = db
    .prepare("SELECT COUNT(*) c FROM login_history WHERE created_at >= datetime('now', '-1 day')")
    .get().c;

  res.json({ totalUsers, totalFoods, totalFavorites, totalCategories, signupsLast7Days, loginsLast24h });
});

// GET /api/admin/users -> every account, with favorite counts and admin status
router.get('/admin/users', requireAdmin, (req, res) => {
  const rows = db
    .prepare(`
      SELECT u.id, u.username, u.email, u.created_at,
             (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id) AS favorite_count,
             (SELECT MAX(created_at) FROM login_history lh WHERE lh.user_id = u.id) AS last_login_at
      FROM users u
      ORDER BY u.created_at DESC
    `)
    .all()
    .map((u) => ({ ...u, isAdmin: isAdminEmail(u.email) }));
  res.json({ users: rows });
});

// DELETE /api/admin/users/:id -> remove any account (except your own — use Account Settings for that)
router.delete('/admin/users/:id', requireAdmin, (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.session.userId) {
    return res.status(400).json({ error: 'ใช้หน้าการตั้งค่าบัญชีเพื่อลบบัญชีของตัวเอง' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!existing) return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId); // cascades favorites + login_history
  res.json({ ok: true });
});

// GET /api/admin/foods -> every food across every category, with tags, for the admin table
router.get('/admin/foods', requireAdmin, (req, res) => {
  const rows = db
    .prepare(`
      SELECT f.id, f.category_key, f.name, f.kcal, f.protein, f.carbs, f.fat, f.benefit, f.img,
             c.label AS category_label, c.emoji AS category_emoji
      FROM foods f JOIN categories c ON c.key = f.category_key
      ORDER BY c.sort_order ASC, f.name ASC
    `)
    .all();
  res.json({ foods: attachTags(rows) });
});

// PUT /api/admin/foods/:id -> full edit (name + every nutrition field + benefit + image + category)
// Regular users can only rename a food (see routes/food.js); this is the admin-only superset,
// meant for fixing incorrect nutrition data without needing a code change.
router.put('/admin/foods/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  const b = req.body || {};
  const category_key = (b.category_key || existing.category_key).toString();
  const name = (b.name ?? existing.name).toString().trim();
  const kcal = Number.isFinite(+b.kcal) ? +b.kcal : existing.kcal;
  const protein = Number.isFinite(+b.protein) ? +b.protein : existing.protein;
  const carbs = Number.isFinite(+b.carbs) ? +b.carbs : existing.carbs;
  const fat = Number.isFinite(+b.fat) ? +b.fat : existing.fat;
  const benefit = (b.benefit ?? existing.benefit).toString();
  const img = (b.img ?? existing.img).toString();

  if (!name) return res.status(400).json({ error: 'ชื่อเมนูห้ามว่าง' });
  const cat = db.prepare('SELECT key FROM categories WHERE key = ?').get(category_key);
  if (!cat) return res.status(404).json({ error: 'ไม่พบหมวดหมู่นี้' });

  db.prepare(`
    UPDATE foods SET category_key = ?, name = ?, kcal = ?, protein = ?, carbs = ?, fat = ?, benefit = ?, img = ?
    WHERE id = ?
  `).run(category_key, name, kcal, protein, carbs, fat, benefit, img, req.params.id);

  const food = db.prepare('SELECT id, category_key, name, kcal, protein, carbs, fat, benefit, img FROM foods WHERE id = ?').get(req.params.id);
  res.json({ food: attachTags([food])[0] });
});

// DELETE /api/admin/foods/:id -> admin delete, no minimum-per-category restriction
router.delete('/admin/foods/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM foods WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  db.prepare('DELETE FROM foods WHERE id = ?').run(req.params.id); // cascades recipes + favorites
  res.json({ ok: true });
});

module.exports = router;
