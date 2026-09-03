let categoryLabels = {};
let favoritesData = []; // cached so the result modal can look items up without refetching

async function init() {
  await checkSession(); // page is server-gated too, but this also loads favoriteIds + username
  handleAuthRedirectFlag();
  await loadCategoryLabels();
  await loadFavorites();
  await loadLoginHistory();
}

// common.js calls this after logout — but logout on this page already redirects home
// via data-requires-auth, so this mostly matters if login happens without a reload.
function onAuthChanged() {
  loadFavorites();
  loadLoginHistory();
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

async function loadLoginHistory() {
  const wrap = document.getElementById('loginHistoryList');
  try {
    const { history } = await api('/auth/login-history');
    if (history.length === 0) {
      wrap.innerHTML = '<p class="loading-text">ยังไม่มีประวัติการเข้าสู่ระบบ</p>';
      return;
    }
    wrap.innerHTML = history.map((h, i) => `
      <div class="login-history-row ${i === 0 ? 'is-latest' : ''}">
        <div class="lh-device">${h.device}${i === 0 ? ' <span class="lh-tag">ล่าสุด</span>' : ''}</div>
        <div class="lh-detail">📍 ${h.location} &nbsp;·&nbsp; ${h.ip}</div>
        <div class="lh-time">${new Date(h.created_at + 'Z').toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>
    `).join('');
  } catch (err) {
    wrap.innerHTML = `<p class="loading-text">โหลดประวัติไม่สำเร็จ: ${err.message}</p>`;
  }
}

/* ---------- ACCOUNT SETTINGS: change password ---------- */
async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  const errEl = document.getElementById('changePasswordError');
  errEl.textContent = "";

  if (newPassword !== confirmNewPassword) {
    errEl.textContent = "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน";
    return false;
  }

  try {
    await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    document.getElementById('changePasswordForm').reset();
    showToast("เปลี่ยนรหัสผ่านสำเร็จ ✅ เราส่งอีเมลแจ้งเตือนให้คุณแล้ว");
  } catch (err) {
    errEl.textContent = err.message;
  }
  return false;
}

/* ---------- ACCOUNT SETTINGS: delete account ---------- */
function openDeleteAccountModal() {
  document.getElementById('deleteAccountPassword').value = "";
  document.getElementById('deleteAccountError').textContent = "";
  document.getElementById('deleteAccountModal').classList.add('active');
}
function closeDeleteAccountModal() {
  document.getElementById('deleteAccountModal').classList.remove('active');
}
document.getElementById('openDeleteAccountBtn').addEventListener('click', openDeleteAccountModal);
document.getElementById('deleteAccountModal').addEventListener('click', function (e) {
  if (e.target === this) closeDeleteAccountModal();
});

async function confirmDeleteAccount() {
  const password = document.getElementById('deleteAccountPassword').value;
  const errEl = document.getElementById('deleteAccountError');
  errEl.textContent = "";
  if (!password) {
    errEl.textContent = "กรุณากรอกรหัสผ่านเพื่อยืนยัน";
    return;
  }

  const btn = document.getElementById('confirmDeleteAccountBtn');
  btn.disabled = true;
  btn.textContent = "กำลังลบบัญชี...";
  try {
    await api('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    window.location.href = '/?accountDeleted=1';
  } catch (err) {
    errEl.textContent = err.message;
    btn.disabled = false;
    btn.textContent = "ลบบัญชีถาวร";
  }
}
document.getElementById('confirmDeleteAccountBtn').addEventListener('click', confirmDeleteAccount);

document.getElementById('resultModal').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('active');
});

init();
