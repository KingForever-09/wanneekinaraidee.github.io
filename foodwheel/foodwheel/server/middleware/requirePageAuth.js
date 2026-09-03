const path = require('path');

// Used for pages that only make sense when logged in (favorites.html, recipe.html).
// If there's no session, redirect to the homepage with a flag the frontend
// reads to pop the login modal and explain why they landed back there.
module.exports = function requirePageAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/?auth=required');
  }
  next();
};
