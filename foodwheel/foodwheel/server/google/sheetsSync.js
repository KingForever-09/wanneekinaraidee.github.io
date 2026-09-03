const { google } = require('googleapis');

const {
  GOOGLE_SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
} = process.env;

let sheetsClient = null;

function isConfigured() {
  return !!(GOOGLE_SHEET_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Most hosts store multi-line env vars with literal "\n" escapes —
    // this turns them back into real newlines for the PEM key to parse.
    key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Appends one row per signup: Username | Email | Password Hash | Signed Up At.
 * The database (not the sheet) is always what login actually checks — this
 * is a one-way mirror for visibility, never read back by the app. Never
 * throws — callers fire this without awaiting so a slow or unreachable
 * Google API never delays or breaks a signup response.
 */
async function appendUserRow({ username, email, passwordHash, createdAt }) {
  if (!isConfigured()) {
    console.log(
      `📄 [Google Sheets not configured — set GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY] Would log signup: ${username} <${email}>`
    );
    return { synced: false, reason: 'not_configured' };
  }
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[username, email, passwordHash, createdAt]] },
    });
    return { synced: true };
  } catch (err) {
    console.error('📄 Google Sheets sync failed:', err.message);
    return { synced: false, reason: err.message };
  }
}

module.exports = { appendUserRow, isConfigured };
