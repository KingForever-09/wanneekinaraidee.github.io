// Tags are *computed* from nutrition numbers rather than hand-typed per dish.
// That means they can never drift out of sync with the kcal/protein/carbs/fat
// values — change the numbers and the tags update automatically.
//
// Thresholds are reasonable rules of thumb for a single restaurant-style
// serving, not clinical guidance.
//
// `aliases` are extra free-text phrases (English included) that should also
// match this tag when someone types it into the search box — e.g. typing
// "low calorie food" should find everything tagged low-calorie even though
// the tag's own label is Thai.
const TAG_DEFS = [
  {
    slug: 'low-calorie', label: 'แคลอรีต่ำ', emoji: '🔥',
    aliases: ['low calorie', 'low cal', 'less calorie', 'diet food', 'แคลอรีต่ำ'],
    test: (f) => f.kcal <= 300,
  },
  {
    slug: 'low-fat', label: 'ไขมันต่ำ', emoji: '🫒',
    aliases: ['low fat', 'less fat', 'lean food', 'ไขมันต่ำ'],
    test: (f) => f.fat <= 10,
  },
  {
    slug: 'high-protein', label: 'โปรตีนสูง', emoji: '🍗',
    aliases: ['high protein', 'protein food', 'โปรตีนสูง'],
    test: (f) => f.protein >= 20,
  },
  {
    slug: 'low-carb', label: 'คาร์บต่ำ', emoji: '🌾',
    aliases: ['low carb', 'keto', 'คาร์บต่ำ'],
    test: (f) => f.carbs <= 20,
  },
  {
    slug: 'healthy', label: 'เพื่อสุขภาพ', emoji: '🥗',
    aliases: ['healthy', 'healthy food', 'clean eating', 'เพื่อสุขภาพ', 'สุขภาพ'],
    test: (f) => f.kcal <= 350 && f.fat <= 15 && f.protein >= 15,
  },
  {
    slug: 'high-calorie', label: 'มื้อจุใจ', emoji: '💪',
    aliases: ['high calorie', 'heavy food', 'มื้อจุใจ', 'แคลอรีสูง'],
    test: (f) => f.kcal >= 550,
  },
];

// The subset of tags exposed as quick-filter buttons in search (all of them,
// currently — kept as its own list in case that ever needs to differ).
const FILTERABLE_TAGS = TAG_DEFS.map(({ slug, label, emoji }) => ({ slug, label, emoji }));

function computeTags(food) {
  return TAG_DEFS.filter((t) => t.test(food)).map(({ slug, label, emoji }) => ({ slug, label, emoji }));
}

function attachTags(foods) {
  return foods.map((f) => ({ ...f, tags: computeTags(f) }));
}

// Does a free-text query "mean" one of the tags? Checked both directions so
// "low fat" matches alias "low fat", and "low fat food" (which contains the
// alias) matches too.
function tagSlugsMatchingQuery(query) {
  const q = query.toLowerCase();
  return TAG_DEFS
    .filter((t) => t.aliases.some((a) => q.includes(a.toLowerCase()) || a.toLowerCase().includes(q)))
    .map((t) => t.slug);
}

module.exports = { computeTags, attachTags, FILTERABLE_TAGS, tagSlugsMatchingQuery };
