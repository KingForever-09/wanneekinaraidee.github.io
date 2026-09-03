let categoriesCache = []; // [{ key, label, emoji }]
let editingFoodId = null;

function onAuthChanged() {
  // If an admin logs out from this tab, data-requires-auth already sends
  // them home (see common.js logout()) — nothing extra to refresh here.
}

async function init() {
  await checkSession();
  handleAuthRedirectFlag();
  await loadCategories();
  await Promise.all([loadStats(), loadUsers(), loadFoods()]);
}

async function loadCategories() {
  try {
    const { categories } = await api('/categories');
    categoriesCache = categories;
    const filter = document.getElementById('foodCategoryFilter');
    const editSelect = document.getElementById('editFoodCategory');
    categories.forEach(c => {
      filter.insertAdjacentHTML('beforeend', `<option value="${c.key}">${c.emoji} ${c.label}</option>`);
      editSelect.insertAdjacentHTML('beforeend', `<option value="${c.key}">${c.emoji} ${c.label}</option>`);
    });
    filter.addEventListener('change', loadFoods);
  } catch (err) {
    showToast("โหลดหมวดหมู่ไม่สำเร็จ: " + err.message);
  }
}

/* ---------- STATS ---------- */
async function loadStats() {
  const grid = document.getElementById('statsGrid');
  try {
    const stats = await api('/admin/stats');
    const cards = [
      { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, emoji: '👥' },
      { label: 'เมนูทั้งหมด', value: stats.totalFoods, emoji: '🍽️' },
      { label: 'หมวดหมู่', value: stats.totalCategories, emoji: '📂' },
      { label: 'เมนูโปรดที่บันทึกไว้', value: stats.totalFavorites, emoji: '❤️' },
      { label: 'สมัครใหม่ (7 วัน)', value: stats.signupsLast7Days, emoji: '🆕' },
      { label: 'เข้าสู่ระบบ (24 ชม.)', value: stats.loginsLast24h, emoji: '🔐' },
    ];
    grid.innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-emoji">${c.emoji}</div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p class="loading-text">โหลดสถิติไม่สำเร็จ: ${err.message}</p>`;
  }
}

/* ---------- USERS ---------- */
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  try {
    const { users } = await api('/admin/users');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-text">ยังไม่มีผู้ใช้</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.username}${u.isAdmin ? ' <span class="admin-badge">ADMIN</span>' : ''}</td>
        <td>${u.email}</td>
        <td>${formatDate(u.created_at)}</td>
        <td>${u.last_login_at ? formatDate(u.last_login_at) : '—'}</td>
        <td>${u.favorite_count}</td>
        <td>${u.isAdmin ? '' : `<button class="danger-btn small-btn" data-user-id="${u.id}">ลบ</button>`}</td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button[data-user-id]').forEach(btn => {
      btn.onclick = () => deleteUser(btn.dataset.userId, btn);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-text">โหลดผู้ใช้ไม่สำเร็จ: ${err.message}</td></tr>`;
  }
}

async function deleteUser(id, btn) {
  if (!confirm('ลบบัญชีผู้ใช้นี้ถาวร? เมนูโปรดและประวัติการเข้าสู่ระบบของผู้ใช้จะถูกลบไปด้วย')) return;
  btn.disabled = true;
  try {
    await api('/admin/users/' + id, { method: 'DELETE' });
    showToast("ลบผู้ใช้แล้ว");
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
  }
}

/* ---------- FOODS ---------- */
let foodsCache = [];

async function loadFoods() {
  const tbody = document.getElementById('foodsTableBody');
  const catFilter = document.getElementById('foodCategoryFilter').value;
  try {
    const { foods } = await api('/admin/foods');
    foodsCache = foods;
    const visible = catFilter ? foods.filter(f => f.category_key === catFilter) : foods;

    if (visible.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-text">ไม่พบเมนู</td></tr>';
      return;
    }

    tbody.innerHTML = visible.map(f => `
      <tr>
        <td>${f.name}</td>
        <td>${f.category_emoji} ${f.category_label}</td>
        <td>${f.kcal}</td>
        <td>${f.protein}g</td>
        <td>${f.carbs}g</td>
        <td>${f.fat}g</td>
        <td>${renderTagBadgesAdmin(f.tags)}</td>
        <td>
          <button class="save-btn small-btn" data-edit-id="${f.id}">แก้ไข</button>
          <button class="danger-btn small-btn" data-delete-id="${f.id}">ลบ</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('button[data-edit-id]').forEach(btn => {
      btn.onclick = () => openEditFoodModal(Number(btn.dataset.editId));
    });
    tbody.querySelectorAll('button[data-delete-id]').forEach(btn => {
      btn.onclick = () => deleteFood(Number(btn.dataset.deleteId), btn);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-text">โหลดเมนูไม่สำเร็จ: ${err.message}</td></tr>`;
  }
}

function renderTagBadgesAdmin(tags) {
  if (!tags || tags.length === 0) return '—';
  return tags.map(t => `<span class="tag-badge">${t.emoji} ${t.label}</span>`).join(' ');
}

async function deleteFood(id, btn) {
  if (!confirm('ลบเมนูนี้ถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
  btn.disabled = true;
  try {
    await api('/admin/foods/' + id, { method: 'DELETE' });
    showToast("ลบเมนูแล้ว");
    loadFoods();
    loadStats();
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
  }
}

function openEditFoodModal(id) {
  const food = foodsCache.find(f => f.id === id);
  if (!food) return;
  editingFoodId = id;
  document.getElementById('editFoodName').value = food.name;
  document.getElementById('editFoodCategory').value = food.category_key;
  document.getElementById('editFoodKcal').value = food.kcal;
  document.getElementById('editFoodProtein').value = food.protein;
  document.getElementById('editFoodCarbs').value = food.carbs;
  document.getElementById('editFoodFat').value = food.fat;
  document.getElementById('editFoodBenefit').value = food.benefit;
  document.getElementById('editFoodImg').value = food.img || '';
  document.getElementById('editFoodError').textContent = '';
  document.getElementById('editFoodModal').classList.add('active');
}
function closeEditFoodModal() {
  document.getElementById('editFoodModal').classList.remove('active');
  editingFoodId = null;
}

async function handleSaveFoodEdit(e) {
  e.preventDefault();
  if (editingFoodId === null) return false;
  const errEl = document.getElementById('editFoodError');
  errEl.textContent = '';

  const payload = {
    name: document.getElementById('editFoodName').value.trim(),
    category_key: document.getElementById('editFoodCategory').value,
    kcal: Number(document.getElementById('editFoodKcal').value),
    protein: Number(document.getElementById('editFoodProtein').value),
    carbs: Number(document.getElementById('editFoodCarbs').value),
    fat: Number(document.getElementById('editFoodFat').value),
    benefit: document.getElementById('editFoodBenefit').value.trim(),
    img: document.getElementById('editFoodImg').value.trim(),
  };

  try {
    await api('/admin/foods/' + editingFoodId, { method: 'PUT', body: JSON.stringify(payload) });
    showToast("บันทึกเมนูแล้ว ✅");
    closeEditFoodModal();
    loadFoods();
  } catch (err) {
    errEl.textContent = err.message;
  }
  return false;
}

/* ---------- HELPERS ---------- */
function formatDate(isoLike) {
  return new Date(isoLike + 'Z').toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

document.getElementById('editFoodModal').addEventListener('click', function (e) {
  if (e.target === this) closeEditFoodModal();
});

init();
