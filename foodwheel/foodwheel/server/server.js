const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);

const db = require('./db');
require('./db/seed'); // idempotent — seeds categories/foods only if empty

const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const favoritesRoutes = require('./routes/favorites');
const recipesRoutes = require('./routes/recipes');
const requirePageAuth = require('./middleware/requirePageAuth');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'kin-arai-dee-na-dev-secret-change-me';

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    store: new SqliteStore({
      client: db,
      expired: { clear: true, intervalMs: 15 * 60 * 1000 },
    }),
    name: 'connect.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api', foodRoutes);
app.use('/api', favoritesRoutes);
app.use('/api', recipesRoutes);

// Pages that only make sense when logged in are gated *before* static
// serving, so hitting the URL directly (not just clicking a hidden nav
// link) still redirects a logged-out visitor back home.
app.get('/favorites.html', requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favorites.html'));
});
app.get('/recipe.html', requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'recipe.html'));
});

app.use(express.static(path.join(__dirname, '..', 'public')));


app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️  วันนี้กินอะไรดีนะ? running at http://localhost:${PORT}`);
});
