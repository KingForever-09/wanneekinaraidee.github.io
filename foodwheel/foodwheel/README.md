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
- **"Our Menu" now genuinely paginates**: only the first 3 categories
  show at first. Clicking **More below** expands to reveal the rest
  (and toggles to "Show less" to collapse again) — it used to just
  scroll to content that was already fully visible, so nothing
  appeared to happen.
- **Two logged-in-only features, each on its own page** (not a modal):
  - **❤️ Favorites** (`/favorites.html`) — save any food from the
    result popup or the favorites page itself, and come back to a
    grid of everything you've saved.
  - **📖 Recipes** (`/recipe.html?food=ID`) — full ingredients list and
    numbered steps for a curated set of dishes; anything without a
    written recipe yet shows a friendly "not added yet" message
    instead of a dead end.
  Both pages are gated **server-side** — visiting the URL directly
  while logged out redirects you home with a prompt to log in, it's
  not just a hidden nav link.
- **Where accounts are stored**: in the `users` table in
  `data/foodwheel.db` — the same SQLite file as everything else.
  Passwords are never stored in plain text; only a bcrypt hash
  (`password_hash`) is saved, so even with direct access to the
  database file, nobody can read the original password back out.
- **Emails on signup and login**: a welcome email on signup, and a
  login-alert email every time the account is logged into, showing
  the time, device, IP, and an approximate location (see "Email &
  login alerts" below for how to turn this on).
- **Login history**: every login is also logged in the app itself
  (`login_history` table) — visit `/favorites.html` while logged in
  and scroll down to "🔐 ความปลอดภัยของบัญชี" to see your last 20
  logins with device, location, and time, without needing to check
  email at all.
- **Account settings** (also on `/favorites.html`, under
  "⚙️ การตั้งค่าบัญชี"):
  - **Change password** — requires the current password, rejects
    reusing the same one, and emails you a confirmation.
  - **Delete account** — permanent, requires re-entering your
    password to confirm. Deletes your favorites and login history
    (cascading foreign keys), destroys your session immediately, and
    sends a farewell email. Any food items you'd added stay in the
    database (just no longer attributed to a deleted account) so the
    shared menu doesn't lose data when someone leaves.
- **Search** (home page, under "🔍 ค้นหาเมนู"): search by dish name,
  or by nutrition — type natural phrases like "healthy food",
  "less fat food", "low calorie food", or just click a tag chip
  (low-calorie, low-fat, high-protein, low-carb, healthy, มื้อจุใจ).
  Tags aren't hand-typed per dish — they're computed from each food's
  actual kcal/protein/carbs/fat numbers, so a tag can never drift out
  of sync with the nutrition shown elsewhere on the site. Every food
  card (search results, the full-menu catalog, the nutrition popup)
  shows its tags as small badges.
- **Corrected menu data**: several rice and noodle dishes had been
  renamed to more specific/authentic dishes (e.g. "Paella" → "Pad Kra
  Pao (ผัดกระเพรา)", "Nasi Goreng" → "American fried rice (ข้าวผัด
  อเมริกัน)") without updating their nutrition numbers or benefit
  text to match — those have been corrected to reflect the actual
  dish named.
- **Admin dashboard** (`/admin.html`, only visible/reachable if your
  account email is in `ADMIN_EMAILS` — see "Admin access" below):
  stats overview, a table of every user with a delete button, and a
  table of every food where an admin can edit **every** nutrition
  field (not just the name, unlike the regular edit-your-own-food
  flow) or delete it outright. Gated server-side like Favorites/
  Recipes — visiting the URL directly without admin access redirects
  you away.
- **Google Sheets signup mirror**: the database is still what
  actually handles login (accounts, password hashing, sessions —
  none of that changed). What's new is that every signup is *also*
  appended as a row to a Google Sheet you control, purely so you can
  glance at new registrations without opening the database. See
  "Google Sheets signup mirror" below for setup and for why passwords
  work the way they do here.

## Admin access

There's no "make this user an admin" button and no admin flag stored
in the database — admin status is computed from a `ADMIN_EMAILS`
environment variable every time it's checked, so the person who
controls the server's environment variables is the only one who can
grant it:

```
ADMIN_EMAILS=you@example.com,teammate@example.com
```

Comma-separated, case-insensitive. Anyone who signs up (or already
has an account) with one of these emails sees a "🛠️ Admin" link in
the nav and can reach `/admin.html`; everyone else gets redirected
away from it, both from the page itself and from every `/api/admin/*`
endpoint. Changing the list requires restarting the server (or
redeploying, if that's how your host applies new env vars).

## Google Sheets signup mirror

**Passwords are still only ever checked against the database** — the
spreadsheet is a one-way mirror the app writes to and never reads
from. That said, since this spreadsheet does end up holding a bcrypt
hash of every password (a deliberate choice, not a default), treat
sharing access to it the same way you'd treat database access: don't
share it more broadly than you would the database itself, and don't
turn on "anyone with the link can view."

**Setup:**
1. Create a Google Sheet. Give the first row headers if you want:
   `Username | Email | Password Hash | Signed Up At`.
2. In [Google Cloud Console](https://console.cloud.google.com/), create
   a project (or use an existing one) and enable the **Google Sheets
   API**.
3. Under **IAM & Admin → Service Accounts**, create a service account.
   No special role is needed at the project level.
4. Open the service account → **Keys** → **Add key** → **Create new
   key** → JSON. This downloads a `.json` file — you need two values
   out of it: `client_email` and `private_key`.
5. **Share the Google Sheet itself** with that `client_email` address,
   giving it **Editor** access (same as sharing with any person).
6. Set these environment variables on your host:

| Variable | Example | Notes |
|---|---|---|
| `GOOGLE_SHEET_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` | The long ID in the sheet's URL, between `/d/` and `/edit` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `foodwheel@your-project.iam.gserviceaccount.com` | The `client_email` from the JSON key |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n` | The `private_key` from the JSON key, pasted as-is |

Most hosts (Render included) store multi-line env vars fine if you
paste the key with its literal `\n` sequences intact — the app
converts those back into real newlines itself.

Until these are set, signups work completely normally — the server
just logs `📄 [Google Sheets not configured] Would log signup: ...`
to the console instead of writing a row, the same "degrade gracefully"
pattern as the email feature.

## Email & login alerts

By default, no email is actually sent — the server just logs what
*would* have been sent to the console, so the app runs out of the box
with zero setup. To send real emails, set these environment variables
before starting the server (locally in a `.env`-style export, or in
your host's environment variable settings):

| Variable      | Example                  | Notes                                |
|---------------|---------------------------|---------------------------------------|
| `EMAIL_HOST`  | `smtp.gmail.com`          | Your SMTP server                      |
| `EMAIL_PORT`  | `587`                     | `465` for SSL, `587` for STARTTLS     |
| `EMAIL_USER`  | `you@gmail.com`           | SMTP username                         |
| `EMAIL_PASS`  | `xxxx xxxx xxxx xxxx`     | SMTP password / app password          |
| `EMAIL_FROM`  | `"Food Wheel <you@gmail.com>"` | Optional — defaults to `EMAIL_USER` |

**Easiest option for testing**: a free transactional email provider
like [Resend](https://resend.com) or [Mailtrap](https://mailtrap.io) —
sign up, grab their SMTP credentials, and drop them into the variables
above. **Using Gmail directly** works too, but you'll need a
[Google App Password](https://myaccount.google.com/apppasswords)
(your normal Gmail password won't work for SMTP).

Location lookups use [ip-api.com](https://ip-api.com) (free, no API
key needed) to turn a login's IP address into an approximate
city/region/country. This is best-effort — on `localhost` or behind a
private network it'll just say "local network" instead of guessing.

## File layout

```
foodwheel/
├── package.json
├── README.md
├── .gitignore
├── data/                     # created automatically — the SQLite database lives here
├── public/                   # everything the browser loads
│   ├── index.html            # home page — the wheel + category browser
│   ├── favorites.html        # logged-in-only — "My Favorites" page
│   ├── recipe.html           # logged-in-only — recipe detail page
│   ├── admin.html            # admin-only — dashboard
│   ├── style.css
│   ├── common.js             # shared: auth state, nav, toasts, shared modals
│   ├── app.js                # home-page-only logic (wheel, categories, food list, search)
│   ├── favorites.js          # favorites.html-only logic
│   ├── recipe.js             # recipe.html-only logic
│   └── admin.js              # admin.html-only logic
└── server/                   # everything Node runs
    ├── server.js              # Express app entry point
    ├── db/
    │   ├── index.js           # SQLite connection + schema (auto-creates tables)
    │   ├── seed.js            # fills categories/foods/recipes the first time only
    │   ├── recipes-seed.js    # the actual recipe content (ingredients + steps)
    │   └── reset-foods.js     # clears food/category data so seed.js can repopulate it fresh
    ├── email/
    │   ├── transporter.js      # sends mail via SMTP, or logs to console if unconfigured
    │   └── templates.js        # welcome/login-alert/password-changed/account-deleted emails
    ├── google/
    │   └── sheetsSync.js       # mirrors new signups to a Google Sheet, or logs if unconfigured
    ├── utils/
    │   ├── requestInfo.js      # IP, user-agent parsing, IP geolocation lookup
    │   ├── foodTags.js         # nutrition tags computed from kcal/protein/carbs/fat + search aliases
    │   └── admin.js            # checks an email against the ADMIN_EMAILS env var
    ├── middleware/
    │   ├── requireAuth.js       # blocks API write routes unless logged in
    │   ├── requirePageAuth.js   # blocks favorites.html/recipe.html unless logged in
    │   ├── requireAdmin.js      # blocks /api/admin/* unless the account is an admin
    │   └── requireAdminPage.js  # blocks admin.html unless the account is an admin
    └── routes/
        ├── auth.js             # /api/auth/signup, /login, /logout, /me, /login-history, /password, /account
        ├── food.js             # /api/categories, /api/tags, /api/foods/search, /api/foods/:category, etc.
        ├── favorites.js        # /api/favorites, /api/favorites/:foodId, /api/favorites/ids
        ├── recipes.js          # /api/recipes/:foodId
        └── admin.js            # /api/admin/stats, /api/admin/users, /api/admin/foods
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

**If you already have a database and just changed something in
`seed.js`** (a dish's nutrition, a new food, etc.) — `npm run seed`
alone won't pick it up, because it only fills in categories/foods that
don't exist yet, so it never overwrites data a user might have added.
Run `npm run reset-foods` first to clear just the food/category data
(user accounts are left alone), then `npm run seed` to repopulate:
```bash
npm run reset-foods
npm run seed
```
On Render's free tier specifically, you don't need to do this — the
filesystem resets on every restart/redeploy, so a fresh deploy already
starts from a clean, freshly-seeded database automatically.

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
| GET    | `/api/tags`               |     | Nutrition tags available for filtering |
| GET    | `/api/foods/search`      |     | Search: `?q=` (name/benefit/tag phrase) and/or `?tag=` |
| GET    | `/api/foods/:category`   |     | List foods in a category (each includes its tags) |
| POST   | `/api/foods`             | ✅  | Add a food `{ category_key, name }`   |
| PUT    | `/api/foods/:id`         | ✅  | Rename a food `{ name }`              |
| DELETE | `/api/foods/:id`         | ✅  | Delete a food (min. 2 per category)   |
| GET    | `/api/favorites`         | ✅  | Your saved foods, most recent first   |
| GET    | `/api/favorites/ids`     | ✅  | Just the food IDs you've saved (for heart states) |
| POST   | `/api/favorites/:foodId` | ✅  | Save a food                           |
| DELETE | `/api/favorites/:foodId` | ✅  | Unsave a food                         |
| GET    | `/api/recipes/:foodId`   | ✅  | Ingredients + steps, or a 404 with a friendly message if none written yet |
| POST   | `/api/auth/signup`       |     | `{ username, email, password }`       |
| POST   | `/api/auth/login`        |     | `{ identifier, password }`            |
| POST   | `/api/auth/logout`       |     |                                        |
| GET    | `/api/auth/me`           |     | Current session's user, or `null`     |
| GET    | `/api/auth/login-history`| ✅  | Your last 20 logins (time, IP, device, location) |
| PUT    | `/api/auth/password`     | ✅  | Change password `{ currentPassword, newPassword }` |
| DELETE | `/api/auth/account`      | ✅  | Permanently delete your account `{ password }` |
| GET    | `/api/admin/stats`       | 🛠️  | Dashboard counts (users, foods, favorites, recent activity) |
| GET    | `/api/admin/users`       | 🛠️  | Every user, with favorite counts and last-login time |
| DELETE | `/api/admin/users/:id`   | 🛠️  | Delete any account except your own |
| GET    | `/api/admin/foods`       | 🛠️  | Every food across every category, with tags |
| PUT    | `/api/admin/foods/:id`   | 🛠️  | Full edit — name, category, every nutrition field, benefit, image |
| DELETE | `/api/admin/foods/:id`   | 🛠️  | Delete a food, no minimum-per-category restriction |

🛠️ = requires an account whose email is listed in `ADMIN_EMAILS`, not just any logged-in account.

## Notes

- The session secret in `server/server.js` has a placeholder default —
  set a real one via the `SESSION_SECRET` environment variable before
  putting this anywhere public.
- `data/` is git-ignored; the database is created automatically the
  first time you run the server, so there's nothing to commit.
- Some food images point at third-party URLs and may occasionally 404;
  the site falls back to a plate emoji automatically when that
  happens, so nothing ever shows a broken image icon.
