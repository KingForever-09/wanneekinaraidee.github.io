/* ========================================================
   API HELPER (shared by every page)
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

const FALLBACK_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fef0d6"/><text x="50%" y="52%" font-size="70" text-anchor="middle" dominant-baseline="middle">🍽️</text></svg>'
);
function pickImg(url) {
  return (url && url.trim() !== "") ? url : FALLBACK_IMAGE;
}

/* ---------- TOAST ---------- */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toastEl');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
}

/* ========================================================
   AUTH STATE — shared across every page
   ======================================================== */
let currentUser = null;   // { id, username, email } | null
let favoriteIds = new Set(); // populated once logged in — lets any page show heart state instantly

async function checkSession() {
  try {
    const { user } = await api('/auth/me');
    currentUser = user;
  } catch (_) {
    currentUser = null;
  }
  if (currentUser) {
    try {
      const { ids } = await api('/favorites/ids');
      favoriteIds = new Set(ids);
    } catch (_) { favoriteIds = new Set(); }
  } else {
    favoriteIds = new Set();
  }
  renderAuthButtons();
  return currentUser;
}

function renderAuthButtons() {
  const wrap = document.getElementById('authButtons');
  const favLink = document.getElementById('favNavLink');
  const adminLink = document.getElementById('adminNavLink');
  if (!wrap) return;

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
    if (favLink) favLink.style.display = '';
    if (adminLink) adminLink.style.display = currentUser.isAdmin ? '' : 'none';
  } else {
    wrap.innerHTML = `
      <button class="login-btn" id="openLoginBtn">Login</button>
      <button class="signup-btn" id="openSignupBtn">Sign up</button>
    `;
    document.getElementById('openLoginBtn').onclick = () => openAuthModal('login');
    document.getElementById('openSignupBtn').onclick = () => openAuthModal('signup');
    if (favLink) favLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

// Any page can call this before letting someone favorite/view-a-recipe/etc.
// Returns true if already logged in; otherwise pops the login modal and returns false.
function requireLogin(message) {
  if (currentUser) return true;
  showToast(message || "กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้");
  openAuthModal('login');
  return false;
}

/* ---------- AUTH MODAL ---------- */
function openAuthModal(tab) {
  switchAuthTab(tab || 'login');
  const le = document.getElementById('loginError');
  const se = document.getElementById('signupError');
  if (le) le.textContent = "";
  if (se) se.textContent = "";
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
    const favData = await api('/favorites/ids').catch(() => ({ ids: [] }));
    favoriteIds = new Set(favData.ids);
    renderAuthButtons();
    closeAuthModal();
    document.getElementById('loginForm').reset();
    showToast(`ยินดีต้อนรับกลับมา, ${user.username}! 👋`);
    if (typeof onAuthChanged === 'function') onAuthChanged();
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
    favoriteIds = new Set();
    renderAuthButtons();
    closeAuthModal();
    document.getElementById('signupForm').reset();
    showToast(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ, ${user.username}! 🎉`);
    if (typeof onAuthChanged === 'function') onAuthChanged();
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
  favoriteIds = new Set();
  renderAuthButtons();
  showToast("ออกจากระบบแล้ว");
  if (typeof onAuthChanged === 'function') onAuthChanged();
  // Pages that only exist for logged-in users send you home when you log out from them
  if (document.body.dataset.requiresAuth === 'true') {
    window.location.href = '/';
  }
}

/* ---------- FAVORITE TOGGLE (shared) ---------- */
async function toggleFavorite(foodId, btnEl) {
  if (!requireLogin("เข้าสู่ระบบเพื่อบันทึกเมนูโปรด")) return;
  const isFav = favoriteIds.has(foodId);
  try {
    if (isFav) {
      await api('/favorites/' + foodId, { method: 'DELETE' });
      favoriteIds.delete(foodId);
    } else {
      await api('/favorites/' + foodId, { method: 'POST' });
      favoriteIds.add(foodId);
    }
    if (btnEl) {
      btnEl.classList.toggle('is-favorited', !isFav);
      btnEl.textContent = !isFav ? '♥ บันทึกแล้ว' : '♡ บันทึกเป็นเมนูโปรด';
    }
    if (typeof onFavoriteToggled === 'function') onFavoriteToggled(foodId, !isFav);
  } catch (err) {
    showToast(err.message);
  }
}

/* ========================================================
   NAVIGATION (shared header)
   ======================================================== */
function goHome(e) {
  if (e) e.preventDefault();
  if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.location.href = '/';
  }
}
function goAbout(e) {
  if (e) e.preventDefault();
  if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = '/#about';
  }
}
function goSearch(e) {
  if (e) e.preventDefault();
  if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
    document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
    const input = document.getElementById('searchInput');
    if (input) input.focus();
  } else {
    window.location.href = '/#search';
  }
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
function goFavorites(e) {
  if (e) e.preventDefault();
  if (!requireLogin("เข้าสู่ระบบเพื่อดูเมนูโปรดของคุณ")) return;
  window.location.href = '/favorites.html';
}

/* ---------- WIRE UP MODALS THAT EXIST ON EVERY PAGE ---------- */
function wireSharedModals() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.addEventListener('click', function (e) { if (e.target === this) closeAuthModal(); });

  const contactModal = document.getElementById('contactModal');
  if (contactModal) contactModal.addEventListener('click', function (e) { if (e.target === this) closeContact(); });

  const faqModal = document.getElementById('faqModal');
  if (faqModal) faqModal.addEventListener('click', function (e) { if (e.target === this) closeFaq(); });
}

// If the server bounced someone here because a page needed login, or a page
// wants to nudge a guest to log in, both use the same ?auth=required flag.
// ?accountDeleted=1 is set after a successful self-service account deletion.
function handleAuthRedirectFlag() {
  const params = new URLSearchParams(window.location.search);
  let changed = false;

  if (params.get('auth') === 'required') {
    showToast("กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้");
    openAuthModal('login');
    params.delete('auth');
    changed = true;
  }
  if (params.get('accountDeleted') === '1') {
    showToast("บัญชีของคุณถูกลบเรียบร้อยแล้ว ขอบคุณที่ใช้งาน 👋");
    params.delete('accountDeleted');
    changed = true;
  }
  if (params.get('adminRequired') === '1') {
    showToast("หน้านี้สำหรับผู้ดูแลระบบเท่านั้น");
    params.delete('adminRequired');
    changed = true;
  }

  if (changed) {
    const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', clean);
  }
}

wireSharedModals();
