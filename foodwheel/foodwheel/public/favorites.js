let categoryLabels = {};
let favoritesData = []; // cached so the result modal can look items up without refetching

async function init() {
  await checkSession(); // page is server-gated too, but this also loads favoriteIds + username
  handleAuthRedirectFlag();
  await loadCategoryLabels();
  await loadFavorites();
}

// common.js calls this after logout — but logout on this page already redirects home
// via data-requires-auth, so this mostly matters if login happens without a reload.
function onAuthChanged() {
  loadFavorites();
}

async function loadCategoryLabels() {
  try {
    const { categories } = await api('/categories');
    categories.forEach(c => { categoryLabels[c.key] = `${c.label} ${c.emoji}`.trim(); });
  } catch (_) { /* labels are cosmetic — fine if this fails */ }
}

async function loadFavorites() {
  const grid = document.getElementById('favoritesGrid');
  try {
    const { favorites } = await api('/favorites');
    favoritesData = favorites;
    if (favorites.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p style="font-size:3rem;margin:0;">🤍</p>
          <p>ยังไม่มีเมนูโปรดเลย ลองไปหมุนวงล้อแล้วกด "บันทึกเป็นเมนูโปรด" ดูสิ!</p>
          <a href="/" class="close-modal-btn" style="text-decoration:none;display:inline-block;">ไปหมุนวงล้อ</a>
        </div>
      `;
      return;
    }
    grid.innerHTML = "";
    favorites.forEach(item => {
      const card = document.createElement('div');
      card.className = 'favorite-card';
      card.innerHTML = `
        <img src="${pickImg(item.img)}" alt="${item.name}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
        <div class="favorite-card-body">
          <span class="result-cat-tag">${categoryLabels[item.category_key] || item.category_key}</span>
          <h3>${item.name}</h3>
          <div class="kcal-badge">${item.kcal} kcal</div>
          <div class="favorite-card-actions">
            <button class="fav-toggle-btn is-favorited" data-food-id="${item.id}">♥ นำออก</button>
            <button class="recipe-btn" data-food-id="${item.id}" ${item.has_recipe ? '' : 'disabled title="ยังไม่มีสูตรสำหรับเมนูนี้"'}>📖 สูตรอาหาร</button>
          </div>
        </div>
      `;
      card.querySelector('.fav-toggle-btn').onclick = () => removeFavoriteCard(item.id, card);
      card.querySelector('.recipe-btn').onclick = () => { window.location.href = '/recipe.html?food=' + item.id; };
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="loading-text">โหลดเมนูโปรดไม่สำเร็จ: ${err.message}</p>`;
  }
}

async function removeFavoriteCard(foodId, cardEl) {
  try {
    await api('/favorites/' + foodId, { method: 'DELETE' });
    favoriteIds.delete(foodId);
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.9)';
    setTimeout(() => loadFavorites(), 180);
  } catch (err) {
    showToast(err.message);
  }
}

document.getElementById('resultModal').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('active');
});

init();
