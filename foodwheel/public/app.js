/* ========================================================
   API HELPER
   ======================================================== */
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) {
    const message = (data && data.error) || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    throw new Error(message);
  }
  return data;
}

/* ========================================================
   STATE
   ======================================================== */
let currentUser = null;      // { id, username, email } | null
let categories = [];         // [{ key, label, emoji, img }]
let categoryLabels = {};     // key -> "Label emoji"
let activeCategory = null;
let currentList = [];        // foods for the active category, from the DB
let editFoodId = null;
let spinning = false;
let currentRotation = 0;

const colors = ["#3ddbb8", "#4f8eea", "#ffb648", "#f5618a"]; // repeating teal/blue/yellow/pink pattern

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

const FALLBACK_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fef0d6"/><text x="50%" y="52%" font-size="70" text-anchor="middle" dominant-baseline="middle">🍽️</text></svg>'
);
function pickImg(url) {
  return (url && url.trim() !== "") ? url : FALLBACK_IMAGE;
}

/* ========================================================
   INIT
   ======================================================== */
async function init() {
  renderFoodList(); // shows the "pick a category" placeholder immediately
  await Promise.all([loadCategories(), checkSession()]);
  renderMenuSection();
}

async function loadCategories() {
  try {
    const { categories: cats } = await api('/categories');
    categories = cats;
    categoryLabels = {};
    cats.forEach(c => { categoryLabels[c.key] = `${c.label} ${c.emoji}`.trim(); });
    renderCategoryButtons();
    renderMenuSection();
  } catch (err) {
    document.getElementById('catButtons').innerHTML = `<p class="loading-text">โหลดหมวดหมู่ไม่สำเร็จ: ${err.message}</p>`;
  }
}

async function checkSession() {
  try {
    const { user } = await api('/auth/me');
    currentUser = user;
  } catch (_) {
    currentUser = null;
  }
  renderAuthButtons();
}

/* ========================================================
   CATEGORY BUTTONS (dynamic — driven by the database)
   ======================================================== */
function renderCategoryButtons() {
  const wrap = document.getElementById('catButtons');
  wrap.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.id = 'cat-' + cat.key;
    btn.textContent = `${cat.emoji} ${cat.label}`.trim();
    btn.onclick = () => selectCategory(cat.key);
    wrap.appendChild(btn);
  });
}

async function selectCategory(catKey) {
  activeCategory = catKey;

  document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById('cat-' + catKey);
  if (btn) btn.classList.add('active');

  document.getElementById('spinBtn').disabled = true; // re-enabled once foods load
  document.getElementById('wheelWrap').classList.remove('disabled');
  document.getElementById('foodListTitle').textContent = "รายการอาหาร — " + (categoryLabels[catKey] || catKey);
  document.getElementById('resultBanner').textContent = "";
  document.getElementById('editHint').textContent = currentUser
    ? "กดเพื่อแก้ไข ✏️  |  กดปุ่ม ✕ เพื่อลบ"
    : "เข้าสู่ระบบเพื่อแก้ไขหรือเพิ่มรายการอาหาร";

  currentRotation = 0;
  canvas.style.transition = "none";
  canvas.style.transform = "rotate(0deg)";
  requestAnimationFrame(() => { canvas.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"; });

  currentList = [{ name: "กำลังโหลด...", kcal: 0, protein: 0, carbs: 0, fat: 0, benefit: "", img: "" }];
  drawWheel();
  document.getElementById('foodList').innerHTML = '<li style="cursor:default;">กำลังโหลดเมนู...</li>';

  try {
    const { foods } = await api('/foods/' + catKey);
    currentList = foods;
    document.getElementById('spinBtn').disabled = currentList.length === 0;
    renderFoodList();
  } catch (err) {
    document.getElementById('foodList').innerHTML = `<li style="cursor:default;">โหลดเมนูไม่สำเร็จ: ${err.message}</li>`;
  }
}

/* ---------- DRAW WHEEL ---------- */
function drawWheel() {
  const radius = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentList.length === 0) {
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#e8e0d0";
    ctx.fill();
    ctx.fillStyle = "#999";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("เลือกหมวดหมู่ก่อน", radius, radius);
    return;
  }

  const n = currentList.length;
  const sliceAngle = (2 * Math.PI) / n;
  const fontSize = n > 14 ? 13 : (n > 9 ? 16 : 22);

  for (let i = 0; i < n; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 10, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#1a1a1a";
    ctx.font = `bold ${fontSize}px 'Segoe UI', Tahoma, sans-serif`;
    let label = currentList[i].name.split('(')[0].trim();
    if (label.length > 16) label = label.slice(0, 15) + "…";
    ctx.fillText(label, radius - 38, fontSize / 3);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(radius, radius, 28, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

/* ---------- EDITABLE FOOD LIST (backed by the database) ---------- */
function renderFoodList() {
  const list = document.getElementById('foodList');
  list.innerHTML = "";
  if (!activeCategory) {
    list.innerHTML = '<li style="cursor:default;">โปรดเลือกหมวดหมู่ด้านบนก่อน</li>';
    drawWheel();
    return;
  }
  currentList.forEach((item) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = item.name;
    span.style.flex = "1";
    span.onclick = () => openEditModal(item.id);

    const delBtn = document.createElement('button');
    delBtn.className = "del-btn";
    delBtn.textContent = "✕";
    delBtn.onclick = (e) => { e.stopPropagation(); removeFood(item.id); };

    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
  drawWheel();
}

async function addFood() {
  if (!activeCategory) { showToast("กรุณาเลือกหมวดหมู่ก่อน"); return; }
  if (!currentUser) { showToast("กรุณาเข้าสู่ระบบก่อนเพิ่มเมนู"); openAuthModal('login'); return; }

  const input = document.getElementById('newFoodInput');
  const val = input.value.trim();
  if (val === "") return;

  try {
    const { food } = await api('/foods', {
      method: 'POST',
      body: JSON.stringify({ category_key: activeCategory, name: val }),
    });
    currentList.push(food);
    input.value = "";
    document.getElementById('spinBtn').disabled = false;
    renderFoodList();
    showToast("เพิ่มเมนูแล้ว ✅");
  } catch (err) {
    showToast(err.message);
  }
}

async function removeFood(id) {
  if (!currentUser) { showToast("กรุณาเข้าสู่ระบบก่อนลบเมนู"); openAuthModal('login'); return; }
  if (currentList.length <= 2) {
    showToast("ต้องมีรายการอาหารอย่างน้อย 2 รายการ");
    return;
  }
  try {
    await api('/foods/' + id, { method: 'DELETE' });
    currentList = currentList.filter(f => f.id !== id);
    renderFoodList();
  } catch (err) {
    showToast(err.message);
  }
}

function openEditModal(id) {
  if (!currentUser) { showToast("กรุณาเข้าสู่ระบบก่อนแก้ไขเมนู"); openAuthModal('login'); return; }
  const item = currentList.find(f => f.id === id);
  if (!item) return;
  editFoodId = id;
  document.getElementById('editInput').value = item.name;
  document.getElementById('editModal').classList.add('active');
}
function closeModal() {
  document.getElementById('editModal').classList.remove('active');
  editFoodId = null;
}
async function saveEdit() {
  const val = document.getElementById('editInput').value.trim();
  if (val !== "" && editFoodId !== null) {
    try {
      const { food } = await api('/foods/' + editFoodId, {
        method: 'PUT',
        body: JSON.stringify({ name: val }),
      });
      const idx = currentList.findIndex(f => f.id === editFoodId);
      if (idx !== -1) currentList[idx] = food;
      renderFoodList();
    } catch (err) {
      showToast(err.message);
    }
  }
  closeModal();
}

/* ---------- SPIN LOGIC ---------- */
function spinWheel() {
  if (spinning) return;
  if (!activeCategory || currentList.length === 0) {
    showToast("กรุณาเลือกหมวดหมู่ก่อนหมุนวงล้อ");
    return;
  }
  spinning = true;
  document.getElementById('spinBtn').disabled = true;
  document.getElementById('resultBanner').textContent = "";

  const n = currentList.length;
  const sliceAngle = 360 / n;
  const winnerIndex = Math.floor(Math.random() * n);

  const extraSpins = 5 + Math.floor(Math.random() * 3);
  const winnerCenterAngle = winnerIndex * sliceAngle + sliceAngle / 2;
  let targetMod = (270 - winnerCenterAngle + 360) % 360;
  const totalRotation = currentRotation + extraSpins * 360 + targetMod - (currentRotation % 360);

  canvas.style.transform = `rotate(${totalRotation}deg)`;
  currentRotation = totalRotation;

  setTimeout(() => {
    spinning = false;
    document.getElementById('spinBtn').disabled = false;
    const winner = currentList[winnerIndex];
    document.getElementById('resultBanner').textContent = "🎉 ได้เมนู: " + winner.name + " 🎉";
    showResultModal(winner, activeCategory);
  }, 4100);
}

/* ---------- RESULT / NUTRITION MODAL ---------- */
function showResultModal(item, catKey) {
  const box = document.getElementById('resultModalBox');
  box.innerHTML = `
    <img src="${pickImg(item.img)}" alt="${item.name}" onerror="this.src='${FALLBACK_IMAGE}'">
    <span class="result-cat-tag">${categoryLabels[catKey] || catKey}</span>
    <h2>🎉 ${item.name}</h2>
    <p style="color:#777;margin-top:0;">นี่คือเมนูที่วงล้อสุ่มให้คุณ!</p>
    <div class="nutrition-grid">
      <div class="nutrition-item"><div class="label">พลังงาน</div><div class="value">${item.kcal} kcal</div></div>
      <div class="nutrition-item"><div class="label">โปรตีน</div><div class="value">${item.protein} g</div></div>
      <div class="nutrition-item"><div class="label">คาร์โบไฮเดรต</div><div class="value">${item.carbs} g</div></div>
      <div class="nutrition-item"><div class="label">ไขมัน</div><div class="value">${item.fat} g</div></div>
    </div>
    <div class="benefit-box"><b>ประโยชน์:</b> ${item.benefit}</div>
    <button class="close-modal-btn" onclick="closeResultModal()">ปิด</button>
  `;
  document.getElementById('resultModal').classList.add('active');
}
function closeResultModal() {
  document.getElementById('resultModal').classList.remove('active');
}

/* ---------- OUR MENU SECTION (category boxes -> full menu modal) ---------- */
function renderMenuSection() {
  const grid = document.getElementById('categoryBoxGrid');
  if (categories.length === 0) {
    grid.innerHTML = '<p class="loading-text">กำลังโหลดหมวดหมู่...</p>';
    return;
  }
  grid.innerHTML = "";
  categories.forEach(cat => {
    const box = document.createElement('button');
    box.type = 'button';
    box.className = "category-box";
    box.onclick = () => openFullMenuModal(cat.key);
    box.innerHTML = `
      <img src="${pickImg(cat.img)}" alt="${cat.label}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
      <div class="cat-box-overlay">
        <h3>${cat.emoji} ${cat.label}</h3>
        <span>ดูเมนูทั้งหมด →</span>
      </div>
    `;
    grid.appendChild(box);
  });
}

const fullMenuCache = {}; // catKey -> foods[], so re-opening a category doesn't refetch

async function openFullMenuModal(catKey) {
  const box = document.getElementById('fullMenuModalBox');
  box.innerHTML = `
    <div class="modal-top-bar">
      <h2>${categoryLabels[catKey] || catKey} — เมนูทั้งหมด</h2>
      <button class="modal-close-x" onclick="closeFullMenuModal()">&times;</button>
    </div>
    <p>กำลังโหลดเมนู...</p>
  `;
  document.getElementById('fullMenuModal').classList.add('active');

  try {
    const foods = fullMenuCache[catKey] || (await api('/foods/' + catKey)).foods;
    fullMenuCache[catKey] = foods;

    let cardsHtml = "";
    foods.forEach((item, idx) => {
      cardsHtml += `
        <button type="button" class="menu-card" onclick="showResultModalFromCatalog('${catKey}', ${item.id})">
          <div class="num">[${idx + 1}]</div>
          <h4>${item.name}</h4>
          <img src="${pickImg(item.img)}" alt="${item.name}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
          <div class="kcal-badge">${item.kcal} kcal</div>
        </button>
      `;
    });
    box.innerHTML = `
      <div class="modal-top-bar">
        <h2>${categoryLabels[catKey] || catKey} — เมนูทั้งหมด (${foods.length} รายการ)</h2>
        <button class="modal-close-x" onclick="closeFullMenuModal()">&times;</button>
      </div>
      <div class="menu-grid">${cardsHtml}</div>
    `;
  } catch (err) {
    box.innerHTML = `
      <div class="modal-top-bar">
        <h2>เกิดข้อผิดพลาด</h2>
        <button class="modal-close-x" onclick="closeFullMenuModal()">&times;</button>
      </div>
      <p>โหลดเมนูไม่สำเร็จ: ${err.message}</p>
    `;
  }
}
function closeFullMenuModal() {
  document.getElementById('fullMenuModal').classList.remove('active');
}

function showResultModalFromCatalog(catKey, foodId) {
  const foods = fullMenuCache[catKey] || [];
  const item = foods.find(f => f.id === foodId);
  if (item) showResultModal(item, catKey);
}

/* ========================================================
   "MORE BELOW" — now an interactive button, not decoration.
   Click/keyboard: smooth-scrolls to Our Menu and gives a
   little playful nudge so it reads as alive, not static text.
   ======================================================== */
const MORE_BELOW_TIPS = [
  "เลื่อนลงไปดูเมนูทั้งหมดในแต่ละหมวดได้เลย 👇",
  "คลิกที่กล่องหมวดหมู่เพื่อดูรายละเอียดโภชนาการของทุกเมนู",
  "อยากได้เมนูใหม่ไหม? เข้าสู่ระบบแล้วเพิ่มเองได้เลย!",
];
let moreBelowTipIndex = 0;
function handleMoreBelowClick() {
  const ourMenu = document.querySelector('.our-menu');
  if (ourMenu) ourMenu.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const btn = document.getElementById('moreBelowBtn');
  btn.classList.remove('pulsing');
  void btn.offsetWidth; // restart animation
  btn.classList.add('pulsing');

  showToast(MORE_BELOW_TIPS[moreBelowTipIndex % MORE_BELOW_TIPS.length]);
  moreBelowTipIndex++;
}
document.getElementById('moreBelowBtn').addEventListener('click', handleMoreBelowClick);

/* ========================================================
   AUTH — sign up / log in / log out, all backed by the API
   ======================================================== */
function renderAuthButtons() {
  const wrap = document.getElementById('authButtons');
  if (currentUser) {
    const initial = currentUser.username.trim().charAt(0).toUpperCase();
    wrap.innerHTML = `
      <div class="user-pill">
        <div class="avatar">${initial}</div>
        <span class="uname">${currentUser.username}</span>
        <button class="logout-btn" id="logoutBtn">ออกจากระบบ</button>
      </div>
    `;
    document.getElementById('logoutBtn').onclick = logout;
  } else {
    wrap.innerHTML = `
      <button class="login-btn" id="openLoginBtn">Login</button>
      <button class="signup-btn" id="openSignupBtn">Sign up</button>
    `;
    document.getElementById('openLoginBtn').onclick = () => openAuthModal('login');
    document.getElementById('openSignupBtn').onclick = () => openAuthModal('signup');
  }
  // Keep the food-list edit hint in sync with login state
  if (activeCategory) {
    document.getElementById('editHint').textContent = currentUser
      ? "กดเพื่อแก้ไข ✏️  |  กดปุ่ม ✕ เพื่อลบ"
      : "เข้าสู่ระบบเพื่อแก้ไขหรือเพิ่มรายการอาหาร";
  }
}

function openAuthModal(tab) {
  switchAuthTab(tab || 'login');
  document.getElementById('loginError').textContent = "";
  document.getElementById('signupError').textContent = "";
  document.getElementById('authModal').classList.add('active');
}
function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLoginBtn').classList.toggle('active', isLogin);
  document.getElementById('tabSignupBtn').classList.toggle('active', !isLogin);
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('signupForm').classList.toggle('hidden', isLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = "";
  try {
    const { user } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    currentUser = user;
    renderAuthButtons();
    closeAuthModal();
    document.getElementById('loginForm').reset();
    showToast(`ยินดีต้อนรับกลับมา, ${user.username}! 👋`);
  } catch (err) {
    errEl.textContent = err.message;
  }
  return false;
}

async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errEl = document.getElementById('signupError');
  errEl.textContent = "";
  try {
    const { user } = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    currentUser = user;
    renderAuthButtons();
    closeAuthModal();
    document.getElementById('signupForm').reset();
    showToast(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ, ${user.username}! 🎉`);
  } catch (err) {
    errEl.textContent = err.message;
  }
  return false;
}

async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (_) { /* ignore */ }
  currentUser = null;
  renderAuthButtons();
  showToast("ออกจากระบบแล้ว");
}

/* ========================================================
   NAVIGATION
   ======================================================== */
function goHome(e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goAbout(e) {
  e.preventDefault();
  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
}
function openContact(e) {
  if (e) e.preventDefault();
  document.getElementById('contactModal').classList.add('active');
}
function closeContact() {
  document.getElementById('contactModal').classList.remove('active');
}
function openFaq(e) {
  if (e) e.preventDefault();
  document.getElementById('faqModal').classList.add('active');
}
function closeFaq() {
  document.getElementById('faqModal').classList.remove('active');
}

/* ---------- TOAST ---------- */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toastEl');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
}

/* ---------- WIRE UP STATIC CONTROLS ---------- */
document.getElementById('spinBtn').addEventListener('click', spinWheel);

document.getElementById('editModal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});
document.getElementById('resultModal').addEventListener('click', function (e) {
  if (e.target === this) closeResultModal();
});
document.getElementById('fullMenuModal').addEventListener('click', function (e) {
  if (e.target === this) closeFullMenuModal();
});
document.getElementById('authModal').addEventListener('click', function (e) {
  if (e.target === this) closeAuthModal();
});
document.getElementById('contactModal').addEventListener('click', function (e) {
  if (e.target === this) closeContact();
});
document.getElementById('faqModal').addEventListener('click', function (e) {
  if (e.target === this) closeFaq();
});

document.getElementById('newFoodInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') addFood();
});
document.getElementById('editInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') saveEdit();
});

/* ---------- INIT ---------- */
init();
