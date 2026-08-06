const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/recipes/:foodId -> recipe for a food, or a clear "not written yet" 404
router.get('/recipes/:foodId', requireAuth, (req, res) => {
  const food = db
    .prepare('SELECT id, category_key, name, kcal, protein, carbs, fat, benefit, img FROM foods WHERE id = ?')
    .get(req.params.foodId);
  if (!food) return res.status(404).json({ error: 'ไม่พบเมนูนี้' });

  const recipe = db.prepare('SELECT * FROM recipes WHERE food_id = ?').get(req.params.foodId);
  if (!recipe) {
    return res.status(404).json({ error: 'ยังไม่มีสูตรสำหรับเมนูนี้', food });
  }

  res.json({
    food,
    recipe: {
      servings: recipe.servings,
      prep_minutes: recipe.prep_minutes,
      cook_minutes: recipe.cook_minutes,
      ingredients: JSON.parse(recipe.ingredients),
      steps: JSON.parse(recipe.steps),
    },
  });
});

module.exports = router;
