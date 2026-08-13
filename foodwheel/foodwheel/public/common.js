/* ========================================================
   API HELPER (shared by every page)
   ======================================================== */
// ฟังก์ชันสำหรับเรียก API (สำหรับระบบอาหาร/หมวดหมู่เดิม)
const AUTH_API_URL = 'https://script.google.com/macros/s/AKfycbx21Ye1liXKlavt46AgsW2WQ8QknrGIK6DEhFMRDDDPDYjuwdLo4ydIx0e1GdqXV-eK/exec';

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// จัดการการสมัครสมาชิก
async function handleSignup(event) {
  event.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช[cite: 1]
  
  const username = document.getElementById('signupUsername').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'signup',
        username: username,
        email: email,
        password: password
      })
    });

    const res = await response.json();
    if (res.status === 'success') {
      alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      switchAuthTab('login'); // กลับไปหน้า Login[cite: 1]
    } else {
      document.getElementById('signupError').innerText = res.message;
    }
  } catch (error) {
    document.getElementById('signupError').innerText = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
  }
}

// จัดการการเข้าสู่ระบบ
// REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbx21Ye1liXKlavt46AgsW2WQ8QknrGIK6DEhFMRDDDPDYjuwdLo4ydIx0e1GdqXV-eK/exec";

// --- HANDLER FOR SIGNUP FORM ---
async function handleSignup(event) {
  event.preventDefault();
  
  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errorEl = document.getElementById('signupError');

  errorEl.style.color = "#4f8eea";
  errorEl.textContent = "กำลังดำเนินการ...";

  try {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Avoids CORS preflight issue
      body: JSON.stringify({
        action: "signup",
        username: username,
        email: email,
        password: password
      })
    });

    const result = await response.json();

    if (result.success) {
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      errorEl.textContent = "";
      document.getElementById('signupForm').reset();
      if (typeof switchAuthTab === 'function') switchAuthTab('login');
    } else {
      errorEl.style.color = "red";
      errorEl.textContent = result.message;
    }
  } catch (error) {
    errorEl.style.color = "red";
    errorEl.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ";
    console.error("Signup error:", error);
  }
  return false;
}

// --- HANDLER FOR LOGIN FORM ---
async function handleLogin(event) {
  event.preventDefault();

  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  errorEl.style.color = "#4f8eea";
  errorEl.textContent = "กำลังเข้าสู่ระบบ...";

  try {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Avoids CORS preflight issue
      body: JSON.stringify({
        action: "login",
        identifier: identifier,
        password: password
      })
    });

    const result = await response.json();

    if (result.success) {
      // Store logged-in user in browser storage
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      
      errorEl.textContent = "";
      document.getElementById('loginForm').reset();
      
      if (typeof closeAuthModal === 'function') closeAuthModal();
      if (typeof updateAuthUI === 'function') updateAuthUI(); // Call your existing function to render logged in status
      if (typeof showToast === 'function') showToast("เข้าสู่ระบบเรียบร้อยแล้ว");
    } else {
      errorEl.style.color = "red";
      errorEl.textContent = result.message;
    }
  } catch (error) {
    errorEl.style.color = "red";
    errorEl.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ";
    console.error("Login error:", error);
  }
  return false;
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
  } else {
    wrap.innerHTML = `
      <button class="login-btn" id="openLoginBtn">Login</button>
      <button class="signup-btn" id="openSignupBtn">Sign up</button>
    `;
    document.getElementById('openLoginBtn').onclick = () => openAuthModal('login');
    document.getElementById('openSignupBtn').onclick = () => openAuthModal('signup');
    if (favLink) favLink.style.display = 'none';
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

  if (changed) {
    const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', clean);
  }
}

wireSharedModals();
