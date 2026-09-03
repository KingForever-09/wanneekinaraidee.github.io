const db = require('../db');
const { isAdminEmail } = require('../utils/admin');

module.exports = function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
  }
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !isAdminEmail(user.email)) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
  }
  next();
};
