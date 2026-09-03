module.exports = function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการนี้' });
  }
  next();
};
