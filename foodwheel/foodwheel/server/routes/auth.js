const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { sendEmail } = require('../email/transporter');
const { welcomeEmail, loginAlertEmail, passwordChangedEmail, accountDeletedEmail } = require('../email/templates');
const { parseUserAgent, getClientIp, lookupLocation } = require('../utils/requestInfo');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_ก-๙]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, email: row.email };
}

const insertLoginHistory = db.prepare(
  'INSERT INTO login_history (user_id, ip, location, device) VALUES (?, ?, ?, ?)'
);

// Fire-and-forget: log the login to the DB and email the user about it.
// Never awaited by the route handler — a slow geolocation lookup or a slow
// mail server should never delay the login response itself.
async function notifyLogin(user, req) {
  const ip = getClientIp(req);
  const device = parseUserAgent(req.headers['user-agent'] || '');
  const location = await lookupLocation(ip);

  insertLoginHistory.run(user.id, ip, location, device);

  const time = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const { subject, html } = loginAlertEmail({ username: user.username, time, ip, location, device });
  await sendEmail({ to: user.email, subject, html });
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

    const { subject, html } = welcomeEmail({ username: user.username });
    sendEmail({ to: user.email, subject, html }).catch((e) => console.error('welcome email failed', e));
    notifyLogin(user, req).catch((e) => console.error('login notify failed', e));
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

    notifyLogin(row, req).catch((e) => console.error('login notify failed', e));
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

// GET /api/auth/login-history -> the logged-in user's own recent login activity
router.get('/login-history', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT ip, location, device, created_at FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(req.session.userId);
  res.json({ history: rows });
});

// PUT /api/auth/password -> change password (must know the current one)
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  }
  if (bcrypt.compareSync(newPassword, row.password_hash)) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, row.id);

  res.json({ ok: true });

  const time = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const { subject, html } = passwordChangedEmail({ username: row.username, time });
  sendEmail({ to: row.email, subject, html }).catch((e) => console.error('password-changed email failed', e));
});

// DELETE /api/auth/account -> permanently delete the account (must confirm with password)
// Cascades via foreign keys clear favorites and login_history automatically;
// any foods this user added are kept (created_by just becomes NULL).
router.delete('/account', requireAuth, (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเพื่อยืนยันการลบบัญชี' });
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(row.id);

  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });

    const { subject, html } = accountDeletedEmail({ username: row.username });
    sendEmail({ to: row.email, subject, html }).catch((e) => console.error('account-deleted email failed', e));
  });
});

module.exports = router;
