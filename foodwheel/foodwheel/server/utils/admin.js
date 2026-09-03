// Admin status is intentionally NOT a column in the database — it's derived
// from the ADMIN_EMAILS environment variable every time it's checked. That
// keeps one source of truth (whoever set the env var on the host) instead of
// a DB flag that could drift out of sync with it.
function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

module.exports = { isAdminEmail, getAdminEmails };
