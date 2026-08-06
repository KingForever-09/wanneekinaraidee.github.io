const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_ก-๙]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, email: row.email };
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่านให้ครบถ้วน' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้ต้องมีความยาว 3-20 ตัวอักษร (a-z, 0-9, _ หรือภาษาไทย)' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, password_hash);

  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(info.lastInsertRowid);

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'สมัครสำเร็จแต่เข้าสู่ระบบอัตโนมัติไม่สำเร็จ กรุณาเข้าสู่ระบบ' });
    req.session.userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน' });
  }

  const row = db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(identifier, identifier);

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่' });
    req.session.userId = row.id;
    res.json({ user: publicUser(row) });
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const row = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user: publicUser(row) });
});

module.exports = router;
