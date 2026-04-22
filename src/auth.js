const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { pool } = require("./db");

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function createUser(email, passwordHash) {
  const result = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [email.toLowerCase(), passwordHash]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function saveOtp(userId, code) {
  await pool.query(
    "UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE",
    [userId]
  );
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    "INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
    [userId, code, expiresAt]
  );
}

async function verifyOtp(userId, code) {
  const result = await pool.query(
    `SELECT id FROM otp_codes
     WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()`,
    [userId, code]
  );
  if (result.rows.length === 0) return false;
  await pool.query("UPDATE otp_codes SET used = TRUE WHERE id = $1", [result.rows[0].id]);
  return true;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendOtpEmail(to, code) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Your verification code — School Academic",
    text: `Your 2FA code is: ${code}\n\nThis code expires in 10 minutes. Do not share it.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:40px auto;padding:32px;border:1px solid #dce8ff;border-radius:16px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#1960d2,#63a0ff);display:grid;place-items:center;color:#fff;font-weight:800;font-size:1rem">SA</div>
          <span style="font-weight:700;color:#1960d2">School Academic</span>
        </div>
        <h2 style="margin:0 0 12px;color:#12305f">Verification Code</h2>
        <p style="color:#5473a5;margin:0 0 24px">Use the code below to complete your sign-in.</p>
        <div style="font-size:2.2rem;font-weight:800;letter-spacing:0.25em;color:#1960d2;padding:20px;background:#dcebff;border-radius:12px;text-align:center">${code}</div>
        <p style="color:#5473a5;font-size:0.88rem;margin:20px 0 0">Expires in 10 minutes. Never share this code with anyone.</p>
      </div>
    `
  });
}

function requireAuth(req, res, next) {
  if (req.session && req.session.userId && req.session.authenticated) {
    return next();
  }
  res.redirect("/login");
}

module.exports = {
  hashPassword,
  verifyPassword,
  createUser,
  findUserByEmail,
  generateOtp,
  saveOtp,
  verifyOtp,
  sendOtpEmail,
  requireAuth
};
