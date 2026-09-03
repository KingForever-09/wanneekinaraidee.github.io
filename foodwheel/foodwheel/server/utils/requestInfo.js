// No external dependency for user-agent parsing — this is a light heuristic,
// good enough to show "Chrome on Windows" in a login-alert email, not a
// full analytics-grade parser.
function parseUserAgent(uaString = '') {
  let browser = 'Unknown browser';
  if (/Edg\//.test(uaString)) browser = 'Microsoft Edge';
  else if (/OPR\//.test(uaString)) browser = 'Opera';
  else if (/Chrome\//.test(uaString) && !/Chromium/.test(uaString)) browser = 'Chrome';
  else if (/Firefox\//.test(uaString)) browser = 'Firefox';
  else if (/Safari\//.test(uaString) && !/Chrome/.test(uaString)) browser = 'Safari';

  let os = 'Unknown OS';
  if (/Windows/.test(uaString)) os = 'Windows';
  else if (/Mac OS X/.test(uaString)) os = 'macOS';
  else if (/Android/.test(uaString)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(uaString)) os = 'iOS';
  else if (/Linux/.test(uaString)) os = 'Linux';

  return `${browser} on ${os}`;
}

// req.ip already respects `app.set('trust proxy', 1)` in server.js, which is
// what makes this correct behind Render's proxy instead of always returning
// the proxy's own address.
function getClientIp(req) {
  const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isPrivateIp(ip) {
  return !ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.') ||
    ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

// Free, no-API-key IP geolocation lookup (ip-api.com — ~45 req/min on the
// free tier, fine for a small app). Never throws: worst case, returns a
// vague label instead of blocking a login.
async function lookupLocation(ip) {
  if (isPrivateIp(ip)) return 'เครือข่ายท้องถิ่น / เซิร์ฟเวอร์ทดสอบ';
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`);
    const data = await res.json();
    if (data.status === 'success') {
      return [data.city, data.regionName, data.country].filter(Boolean).join(', ') || 'ไม่ทราบตำแหน่ง';
    }
  } catch (_) { /* geolocation is best-effort */ }
  return 'ไม่ทราบตำแหน่ง';
}

module.exports = { parseUserAgent, getClientIp, lookupLocation };
