// Run with: npm run reset-foods
//
// seed.js only inserts into a category that's still empty, so it won't
// overwrite food data that's already in the database — that's normally what
// you want (so it doesn't clobber things users have added), but it also
// means correcting a dish's name/nutrition in seed.js has no effect on a
// database that's already been seeded once.
//
// This script clears categories + foods (which cascades to their recipes
// and any favorites pointing at them) so the next `npm run seed` repopulates
// everything fresh from the current seed.js. User accounts, login history,
// and passwords are untouched.
const db = require('./index');

const { foods: foodCount } = db.prepare('SELECT COUNT(*) AS foods FROM foods').get();
const { users: userCount } = db.prepare('SELECT COUNT(*) AS users FROM users').get();

db.prepare('DELETE FROM foods').run();       // cascades: recipes, favorites
db.prepare('DELETE FROM categories').run();

console.log(`🗑️  Cleared ${foodCount} foods and their categories/recipes/favorites.`);
console.log(`👤 Left ${userCount} user account(s) untouched.`);
console.log('   Run "npm run seed" now to repopulate with the current menu data.');
