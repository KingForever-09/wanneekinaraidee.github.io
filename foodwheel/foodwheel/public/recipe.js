function onAuthChanged() { /* nothing page-specific to refresh beyond the header */ }

async function init() {
  await checkSession();
  const params = new URLSearchParams(window.location.search);
  const foodId = params.get('food');
  const content = document.getElementById('recipeContent');

  if (!foodId) {
    content.innerHTML = `<p>ไม่พบเมนูที่ระบุ — <a href="/">กลับไปหน้าแรก</a></p>`;
    return;
  }

  try {
    const { food, recipe } = await api('/recipes/' + foodId);
    renderRecipe(food, recipe);
  } catch (err) {
    // The API still sends back the food info even on a "no recipe yet" 404
    try {
      const res = await fetch('/api/recipes/' + foodId, { credentials: 'include' });
      const data = await res.json();
      if (data && data.food) {
        renderNoRecipeYet(data.food);
        return;
      }
    } catch (_) { /* fall through to generic error */ }
    content.innerHTML = `<p>โหลดสูตรอาหารไม่สำเร็จ: ${err.message} — <a href="/">กลับไปหน้าแรก</a></p>`;
  }
}

function renderRecipe(food, recipe) {
  const content = document.getElementById('recipeContent');
  const isFav = favoriteIds.has(food.id);

  const ingredientsHtml = recipe.ingredients.map(ing => `
    <li>${[ing.amount, ing.unit, ing.name].filter(Boolean).join(' ')}</li>
  `).join('');

  const stepsHtml = recipe.steps.map((step, i) => `
    <li><span class="step-num">${i + 1}</span><span>${step}</span></li>
  `).join('');

  content.innerHTML = `
    <div class="recipe-header">
      <img src="${pickImg(food.img)}" alt="${food.name}" onerror="this.src='${FALLBACK_IMAGE}'">
      <div>
        <h1 class="page-title" style="text-align:left;">${food.name}</h1>
        <div class="recipe-meta">
          <span>🍽️ ${recipe.servings} ที่</span>
          <span>⏱️ เตรียม ${recipe.prep_minutes} นาที</span>
          <span>🔥 ปรุง ${recipe.cook_minutes} นาที</span>
        </div>
        <div class="benefit-box"><b>ประโยชน์:</b> ${food.benefit}</div>
        <button class="fav-toggle-btn ${isFav ? 'is-favorited' : ''}" id="recipeFavBtn">${isFav ? '♥ บันทึกแล้ว' : '♡ บันทึกเป็นเมนูโปรด'}</button>
      </div>
    </div>

    <div class="recipe-body">
      <div class="recipe-ingredients">
        <h2>วัตถุดิบ</h2>
        <ul>${ingredientsHtml}</ul>
      </div>
      <div class="recipe-steps">
        <h2>ขั้นตอนการทำ</h2>
        <ol>${stepsHtml}</ol>
      </div>
    </div>
  `;
  document.getElementById('recipeFavBtn').onclick = () => toggleFavorite(food.id, document.getElementById('recipeFavBtn'));
}

function renderNoRecipeYet(food) {
  const content = document.getElementById('recipeContent');
  const isFav = favoriteIds.has(food.id);
  content.innerHTML = `
    <div class="recipe-header">
      <img src="${pickImg(food.img)}" alt="${food.name}" onerror="this.src='${FALLBACK_IMAGE}'">
      <div>
        <h1 class="page-title" style="text-align:left;">${food.name}</h1>
        <p>ยังไม่มีสูตรสำหรับเมนูนี้ในระบบ — กำลังทยอยเพิ่มอยู่เรื่อยๆ 🙏</p>
        <button class="fav-toggle-btn ${isFav ? 'is-favorited' : ''}" id="recipeFavBtn">${isFav ? '♥ บันทึกแล้ว' : '♡ บันทึกเป็นเมนูโปรด'}</button>
        <a href="/" class="close-modal-btn" style="text-decoration:none;display:inline-block;margin-left:10px;">กลับไปหน้าแรก</a>
      </div>
    </div>
  `;
  document.getElementById('recipeFavBtn').onclick = () => toggleFavorite(food.id, document.getElementById('recipeFavBtn'));
}

init();
