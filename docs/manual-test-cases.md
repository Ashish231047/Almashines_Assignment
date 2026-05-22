# Task 2 — Manual Test Cases (Not Automated)

These are test cases identified during manual exploration of the sign-up flow
that were deliberately left out of automation, with reasons.

---

## MT-001: OTP Expiry

**Description:** Verify that an OTP expires after 10 minutes and cannot be used after expiry.

**Steps:**
1. Start sign-up with a new email
2. Reach the OTP step
3. Wait 10+ minutes without entering the OTP
4. Enter the OTP received earlier

**Expected Result:** Platform shows "OTP expired" or "Invalid Code" error. User is prompted to resend.

**Why Not Automated:** Requires a real 10-minute wait. Automation timeouts would make this test
extremely slow and fragile. Better tested manually or with a mocked time service.

---

## MT-002: OTP Resend Functionality

**Description:** Verify that clicking "Resend OTP" sends a new OTP and the old one is invalidated.

**Steps:**
1. Reach the OTP step
2. Note the first OTP received
3. Click "Resend OTP"
4. Try entering the old OTP → should fail
5. Enter the new OTP → should succeed

**Expected Result:** Old OTP is invalidated after resend. New OTP works correctly.

**Why Not Automated:** Requires two separate email reads and timing coordination. Feasible but
adds significant complexity for marginal gain in this context.

---

## MT-003: Social Login Buttons (Out of Scope)

**Description:** Verify Google, Facebook, and LinkedIn login buttons redirect to the correct OAuth flows.

**Steps:**
1. Click "Connect with Google"
2. Verify redirect to Google OAuth
3. Repeat for Facebook and LinkedIn

**Expected Result:** Each button redirects to the correct OAuth provider.

**Why Not Automated:** Explicitly out of scope per assignment. Also requires OAuth credentials
and third-party account management.

---

## MT-004: Already-Registered Email — Login Prompt

**Description:** Verify that entering an already-registered email shows a login prompt instead of the sign-up form.

**Steps:**
1. Enter an email that is already registered on the platform
2. Click the submit button

**Expected Result:** Platform shows a message like "This email is already registered. Please log in."
The sign-up form (name/password fields) should NOT appear.

**Why Not Automated:** Requires a known registered email. TC-013 and TC-014 in Suite 3 cover this
via API interception but are skipped without `EXISTING_EMAIL` configured.

**Observed Behavior (Manual):** The platform returns `{"newUser": false}` from the emailValidate API
when the email is registered. The UI behaviour (what message is shown) needs manual verification.

---

## MT-005: Password Visibility Toggle

**Description:** Verify that if a "show password" toggle exists, it correctly reveals/hides the password.

**Steps:**
1. Reach step 2 (name + password form)
2. Type a password
3. Click the eye/toggle icon (if present)

**Expected Result:** Password becomes visible as plain text. Clicking again hides it.

**Why Not Automated:** The toggle was not observed in the DOM during exploration. If it exists,
it's a minor UX feature. Automating absent features adds noise.

---

## MT-006: Special Characters in Name Fields

**Description:** Verify that the First Name and Last Name fields handle special characters correctly.

**Steps:**
1. Enter `O'Brien` in First Name (apostrophe)
2. Enter `García` in Last Name (accented character)
3. Enter `<script>alert(1)</script>` in First Name (XSS attempt)
4. Submit the form

**Expected Result:**
- Apostrophes and accented characters are accepted and stored correctly
- Script tags are sanitized/rejected — no XSS execution

**Why Not Automated:** XSS testing requires verifying server-side storage and rendering, which
goes beyond UI automation. Apostrophe/accent handling is a quick manual check.

---

## MT-007: Role Selection — All Options Work

**Description:** Verify that each role option (Current Student, Alumni, Staff/Faculty) can be selected
and the form submits successfully with each.

**Steps:**
1. Complete sign-up up to step 4
2. Select "Current Student" → join → verify success
3. Repeat with "Alumni (Past Student)"
4. Repeat with "Staff / Faculty"

**Expected Result:** All three roles allow successful sign-up completion.

**Why Not Automated:** Requires 3 separate full E2E runs (each needing a unique email + OTP).
The role dropdown options are verified in TC-017. Full submission with each role is a manual check.

---

## MT-008: Terms & Conditions — Join Blocked Without Acceptance

**Description:** Verify that the "Join Alumni Network" button is disabled or shows an error if
the Terms & Conditions checkbox is not checked.

**Steps:**
1. Reach step 4 (role + T&C)
2. Select a role but do NOT check the T&C checkbox
3. Click "Join Alumni Network"

**Expected Result:** Form does not submit. Error message or disabled button indicates T&C must be accepted.

**Why Not Automated:** Requires reaching step 4 which needs a real OTP. The IP rate limit makes
this expensive to automate in the current environment. Straightforward manual check.

---

## MT-009: Back Navigation Across All Steps

**Description:** Verify that the Back button works correctly at each step and preserves entered data.

**Steps:**
1. Enter email → click Back → verify email field is cleared/preserved
2. Fill name + password → click Back → verify email step reappears
3. Enter OTP → click Back → verify name/password step reappears (or email step)

**Expected Result:** Back navigation works at each step. No data corruption or unexpected redirects.

**Why Not Automated:** TC-029 covers Back on step 2. Steps 3 and 4 Back navigation requires
reaching those steps (OTP dependency). Manual verification is faster.

---

## MT-010: Concurrent Sign-Up Attempts (Same Email)

**Description:** Verify that two simultaneous sign-up attempts with the same email are handled gracefully.

**Steps:**
1. Open two browser tabs
2. Start sign-up with the same email in both tabs simultaneously
3. Complete step 2 in both tabs

**Expected Result:** One attempt succeeds; the other is rejected with an appropriate error.

**Why Not Automated:** Race condition testing requires precise timing coordination. Better suited
for load/stress testing tools (k6, JMeter) than Playwright.

---

## MT-011: Email with Uppercase Characters

**Description:** Verify that email addresses with uppercase letters are treated case-insensitively.

**Steps:**
1. Sign up with `Test@Example.COM`
2. Try to sign up again with `test@example.com`

**Expected Result:** Platform recognises both as the same email and shows "already registered" on second attempt.

**Why Not Automated:** Requires two sign-up attempts and a registered account. Manual check is faster.

---

## MT-012: Page Behaviour on Browser Back Button

**Description:** Verify that using the browser's native Back button during sign-up doesn't cause
data loss or broken state.

**Steps:**
1. Complete step 1 (email)
2. Press browser Back button
3. Press browser Forward button

**Expected Result:** Page handles navigation gracefully without errors or broken UI state.

**Why Not Automated:** Browser history navigation is tricky to automate reliably in AngularJS SPAs.
Manual check is more reliable.
