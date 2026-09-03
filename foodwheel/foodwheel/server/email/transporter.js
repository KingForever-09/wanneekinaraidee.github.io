const nodemailer = require('nodemailer');

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

let transporter = null;
if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465, // true for port 465, false (STARTTLS) for 587/25
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

/**
 * Sends an email if SMTP is configured; otherwise just logs what would have
 * been sent. Never throws — callers fire this without awaiting so a slow or
 * failing mail server never delays or breaks a signup/login response.
 */
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`✉️  [email not configured — set EMAIL_HOST/EMAIL_USER/EMAIL_PASS] Would send "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await transporter.sendMail({ from: EMAIL_FROM || EMAIL_USER, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error('✉️  Email send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendEmail };
