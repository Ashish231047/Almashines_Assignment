# AlmaShines SDET Take-Home Assignment

**Candidate submission for the SDET role at AlmaShines Technologies.**

---

## Project Structure

```
almashines-sdet/
├── tests/
│   ├── signup.spec.js          # All automated test cases (29 tests across 6 suites)
│   ├── pages/
│   │   └── SignUpPage.js       # Page Object Model — all selectors & interactions
│   └── helpers/
│       └── mailinator.js       # mail.tm email helper (OTP reading)
├── docs/
│   ├── manual-test-cases.md    # Task 2 — manual test cases not automated
│   └── bug-reports.md          # Task 3 — bug reports
├── playwright.config.js        # Playwright configuration (headed mode, chromium)
├── .env.example                # Environment variable template
├── .env                        # Local env (not committed in real projects)
└── README.md                   # This file
```

---

## Task 1 — Automation Setup & Run Instructions

### Prerequisites

- Node.js v18+ and npm
- Internet connection (tests run against the live platform)

### Install

```bash
npm install
npx playwright install chromium
```

### Configure `.env`

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable          | Purpose                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `MAILTM_EMAIL`    | Persistent mail.tm inbox for OTP tests (pre-created, see note below)   |
| `MAILTM_PASSWORD` | Password for the mail.tm inbox                                          |
| `EXISTING_EMAIL`  | A real email already registered on the platform (for Suite 3)           |

**mail.tm inbox setup (one-time):**
```bash
# Creates a permanent test inbox — run once
node -e "
const axios = require('axios');
(async () => {
  const d = await axios.get('https://api.mail.tm/domains');
  const domain = d.data['hydra:member'][0].domain;
  const email = 'almashines_sdet_test@' + domain;
  await axios.post('https://api.mail.tm/accounts', { address: email, password: 'Sdet@Test1234!' });
  const t = await axios.post('https://api.mail.tm/token', { address: email, password: 'Sdet@Test1234!' });
  console.log('EMAIL:', email);
  console.log('TOKEN:', t.data.token);
})();
"
```

### Run Tests

```bash
# Run all tests (browser window opens — headed mode)
npm test

# Run specific suites
npm run test:suite1    # Page Load & UI Validation
npm run test:suite2    # Email Field Validation
npm run test:suite5    # OTP Step Validations
npm run test:suite6    # Password Validations

# Run smoke tests only (fastest, ~30s)
npm run test:smoke

# View HTML report after run
npm run test:report
```

### Test Results Summary

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| Suite 1 — Page Load & UI | 6 | ✅ All pass | |
| Suite 2 — Email Validation | 6 | ✅ All pass | |
| Suite 3 — Existing User Path | 2 | ⏭ Skipped | Set `EXISTING_EMAIL` in `.env` |
| Suite 4 — E2E Happy Path | 3 | ⏭ Skipped* | Requires fresh IP (see note) |
| Suite 5 — OTP Validations | 5 | ⏭ Skipped* | Requires fresh IP (see note) |
| Suite 6 — Password Validations | 7 | ✅ All pass | |

**\* IP Rate Limit Note:**
The platform blocks new account creation after ~3 attempts from the same IP
(`LIMIT_EXCEEDED` — "Access temporarily restricted for 24 hours"). This is a
server-side protection unrelated to the email service. Suites 4 & 5 auto-skip
when this limit is active and pass cleanly from a fresh network/VPN.

The OTP email service used is **mail.tm** — a free REST API with no rate limits,
no "try again in 30 minutes" blocks, and instant email delivery. It replaced
Guerrilla Mail and Mailinator which had reliability issues.

---

## What Was Automated and Why

### Automated (Suites 1–6)

| Test Area | Reason for Automating |
|-----------|----------------------|
| Page load & UI presence | Fast, deterministic, catches regressions instantly |
| Email format validation | HTML5 validation is easy to break; cheap to automate |
| API response (emailValidate) | More reliable than UI scraping; catches backend changes |
| Step 2 form fields | Verifies the correct form appears for new users |
| E2E happy path (Suite 4) | Highest-value test — covers the entire sign-up journey |
| OTP step UI (Suite 5) | OTP is the most failure-prone step; wrong/empty OTP must be handled |
| Password rules (Suite 6) | Easy to regress; minlength and mismatch checks are critical |

### Not Automated (see Task 2 — Manual Test Cases)

- Social login (Google, Facebook, LinkedIn) — out of scope per assignment
- OTP expiry (10-minute window) — requires real-time waiting, not suitable for automation
- Cross-browser testing — not required for this assignment
- Accessibility (screen reader, keyboard navigation) — requires manual expert review
- Visual/layout regression — requires visual testing tools (Percy, Applitools)

---
