/**
 * Email helper — powered by mail.tm (https://mail.tm)
 * =====================================================
 * mail.tm is a free disposable email service with a clean REST API.
 *   - No API key required
 *   - No rate limits on inbox reads
 *   - Emails arrive within seconds
 *   - Domains are real and accepted by most platforms
 *
 * Two modes:
 *
 *   1. createTestInbox()
 *      Creates a brand-new inbox each call. Use for tests that only need
 *      to trigger the emailValidate API or reach step 2 (no OTP needed).
 *
 *   2. getPersistentInbox()
 *      Returns the permanent test inbox from .env (MAILTM_EMAIL / MAILTM_PASSWORD).
 *      Use for OTP tests — this inbox is pre-created and always available.
 *      Call clearInbox() before triggering an OTP so old messages don't interfere.
 */

const axios = require('axios');
require('dotenv').config();

const BASE = 'https://api.mail.tm';
const ACCOUNT_PASSWORD = 'Sdet@Test1234!';

/** Cache domain per process */
let _domain = null;
async function getDomain() {
  if (_domain) return _domain;
  const res = await axios.get(`${BASE}/domains`);
  _domain = res.data['hydra:member'][0].domain;
  return _domain;
}

/** Get a JWT token for a mail.tm address */
async function getToken(address, password = ACCOUNT_PASSWORD) {
  const res = await axios.post(`${BASE}/token`, { address, password });
  return res.data.token;
}

// ── Fresh inbox (for non-OTP tests) ─────────────────────────────────────────

/**
 * Create a brand-new mail.tm inbox.
 * Returns { email, waitForOtp } — but waitForOtp is rarely needed here.
 */
async function createTestInbox() {
  const domain = await getDomain();
  const address = `sdet_${Date.now()}@${domain}`;
  await axios.post(`${BASE}/accounts`, { address, password: ACCOUNT_PASSWORD });
  const token = await getToken(address);
  return {
    email: address,
    waitForOtp: (opts) => pollForOtp(token, opts),
  };
}

// ── Persistent inbox (for OTP tests) ────────────────────────────────────────

/**
 * Return the permanent test inbox defined in .env.
 * The inbox must already exist (created once during setup).
 * Returns { email, token, waitForOtp, clearInbox }
 */
async function getPersistentInbox() {
  const email = process.env.MAILTM_EMAIL;
  const password = process.env.MAILTM_PASSWORD || ACCOUNT_PASSWORD;

  if (!email) throw new Error('MAILTM_EMAIL not set in .env');

  const token = await getToken(email, password);

  return {
    email,
    token,
    waitForOtp: (opts) => pollForOtp(token, opts),
    clearInbox: () => clearInbox(token),
  };
}

// ── Core polling ─────────────────────────────────────────────────────────────

/**
 * Delete all messages in the inbox so old OTPs don't interfere.
 */
async function clearInbox(token) {
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const res = await axios.get(`${BASE}/messages`, { headers });
    const messages = res.data['hydra:member'] || [];
    for (const msg of messages) {
      await axios.delete(`${BASE}/messages/${msg.id}`, { headers }).catch(() => {});
    }
    console.log(`[mail.tm] Cleared ${messages.length} old message(s)`);
  } catch (e) {
    console.warn('[mail.tm] clearInbox error:', e.message);
  }
}

/**
 * Poll the inbox until an OTP email arrives and extract the code.
 * @param {string} token - JWT from mail.tm
 * @param {{ maxWaitMs?: number, pollIntervalMs?: number }} opts
 * @returns {Promise<string>}
 */
async function pollForOtp(token, { maxWaitMs = 90000, pollIntervalMs = 4000 } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await _sleep(pollIntervalMs);
    try {
      const res = await axios.get(`${BASE}/messages`, { headers });
      const messages = res.data['hydra:member'] || [];

      for (const msg of messages) {
        const full = await axios.get(`${BASE}/messages/${msg.id}`, { headers });
        const subject = full.data.subject || '';
        const text = full.data.text || full.data.html || '';
        const combined = subject + ' ' + text;

        console.log(`[mail.tm] Email: "${subject}"`);
        const otp = extractOtp(combined);
        if (otp) {
          console.log(`[mail.tm] OTP extracted: ${otp}`);
          return otp;
        }
      }
    } catch (e) {
      console.warn('[mail.tm] Poll error:', e.message);
    }
  }

  throw new Error(`OTP not received within ${maxWaitMs / 1000}s`);
}

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Extract a 4–6 digit OTP from a string.
 */
function extractOtp(text) {
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  const patterns = [
    /\botp[:\s]+(\d{4,6})\b/i,
    /\bverification\s+code[:\s]+(\d{4,6})\b/i,
    /\bone.time\s+password[:\s]+(\d{4,6})\b/i,
    /\bcode[:\s]+(\d{4,6})\b/i,
    /\b(\d{6})\b/,
    /\b(\d{4})\b/,
  ];
  for (const p of patterns) {
    const m = plain.match(p);
    if (m) return m[1];
  }
  return null;
}

function _sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { createTestInbox, getPersistentInbox, pollForOtp, extractOtp, clearInbox };
