const db = require('../db');
const { isAdminEmail } = require('../utils/admin');

module.exports = function requireAdminPage(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/?auth=required');
  }
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !isAdminEmail(user.email)) {
    return res.redirect('/?adminRequired=1');
  }
  next();
};
