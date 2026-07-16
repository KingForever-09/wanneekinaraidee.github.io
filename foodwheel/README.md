# วันนี้กินอะไรดีนะ? (What should I eat today?)

A food-picker wheel site with real accounts and a real database:
sign up / log in, spin the wheel, browse the full menu, and — once you're
logged in — add, rename, or delete menu items. Everything is stored in
SQLite, not in the page, so your edits are still there the next time you
visit.

## What changed from the static version

- **Accounts**: sign up / log in / log out with hashed passwords
  (bcrypt) and secure session cookies. Editing the food list now
  requires being logged in.
- **Real database**: menus used to live in a JavaScript array in the
  page; they now live in a SQLite file (`data/foodwheel.db`) served
  through a small Express API.
- **More categories**: Noodles, Rice, and Sweets, plus three new ones —
  **Soup**, **Seafood**, and **Salad**.
- **Interactive "More below"**: it's a real button now. Clicking (or
  pressing Enter/Space on it) smooth-scrolls down to the full menu
  section and surfaces a quick rotating tip, instead of being purely
  decorative.

## File layout

```
foodwheel/
├── package.json
├── README.md
├── .gitignore
├── data/                     # created automatically — the SQLite database lives here
├── public/                   # everything the browser loads
│   ├── index.html
│   ├── style.css
│   └── app.js
└── server/                   # everything Node runs
    ├── server.js             # Express app entry point
    ├── db/
    │   ├── index.js          # SQLite connection + schema (auto-creates tables)
    │   └── seed.js           # fills categories/foods the first time only
    ├── middleware/
    │   └── requireAuth.js    # blocks write routes unless logged in
    └── routes/
        ├── auth.js           # /api/auth/signup, /login, /logout, /me
        └── food.js           # /api/categories, /api/foods/:category, etc.
```

## Running it locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd foodwheel
npm install       # installs express, better-sqlite3, bcryptjs, etc.
npm run seed       # creates data/foodwheel.db and fills it with the starter menu (optional — the server does this automatically on first boot too)
npm start          # starts the server
```

Then open **http://localhost:3000** in your browser.

To use a different port: `PORT=5000 npm start`.

## How the pieces fit together

- **`server/db/index.js`** opens (and if needed, creates) the SQLite
  file and makes sure the `users`, `categories`, and `foods` tables
  exist.
- **`server/db/seed.js`** inserts the six starter categories and their
  menus, but only into a category that's still empty — so it's safe to
  run again later (e.g. after you deploy an update) without wiping out
  anything a user added.
- **`server/routes/auth.js`** handles signup/login with bcrypt-hashed
  passwords and `express-session` (session data itself is also stored
  in SQLite, so logins survive a server restart).
- **`server/routes/food.js`** exposes the category list and the foods
  in each category, and lets logged-in users add, rename, or delete
  foods (`requireAuth` middleware guards the write routes).
- **`public/app.js`** is a single vanilla-JS file that fetches from
  `/api/...`, draws the wheel on a `<canvas>`, and renders the login
  state, food list, and full-menu modal.

## API reference

| Method | Path                    | Auth required | Description                          |
|--------|--------------------------|:---:|---------------------------------------|
| GET    | `/api/categories`        |     | List all categories                   |
| GET    | `/api/foods/:category`   |     | List foods in a category              |
| POST   | `/api/foods`             | ✅  | Add a food `{ category_key, name }`   |
| PUT    | `/api/foods/:id`         | ✅  | Rename a food `{ name }`              |
| DELETE | `/api/foods/:id`         | ✅  | Delete a food (min. 2 per category)   |
| POST   | `/api/auth/signup`       |     | `{ username, email, password }`       |
| POST   | `/api/auth/login`        |     | `{ identifier, password }`            |
| POST   | `/api/auth/logout`       |     |                                        |
| GET    | `/api/auth/me`           |     | Current session's user, or `null`     |

## Notes

- The session secret in `server/server.js` has a placeholder default —
  set a real one via the `SESSION_SECRET` environment variable before
  putting this anywhere public.
- `data/` is git-ignored; the database is created automatically the
  first time you run the server, so there's nothing to commit.
- Some food images point at third-party URLs and may occasionally 404;
  the site falls back to a plate emoji automatically when that
  happens, so nothing ever shows a broken image icon.
