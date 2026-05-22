# Task 3 — Bug Reports

---

## Bug Report 1 — Aggressive IP Rate Limiting Blocks Legitimate Test Automation

**ID:** BUG-001
**Severity:** High
**Priority:** High
**Status:** Confirmed (observed during automated testing)
**Type:** Functional / Security

### Summary
The platform applies an aggressive IP-based rate limit on new account creation that triggers
after approximately 3 sign-up attempts from the same IP address. Once triggered, the block
lasts **24 hours** and prevents any new account creation — including legitimate test automation
and potentially real users on shared networks (corporate NAT, university Wi-Fi, VPN exit nodes).

### Environment
- URL: https://www.almashines.com/dtc/account
- Browser: Chromium (headless and headed)
- Observed via: API response from `POST /api/signuser/afterFirstStep`

### Steps to Reproduce
1. Navigate to https://www.almashines.com/dtc/account
2. Complete the sign-up form (email → name/password → submit) 3 times with different emails
3. Attempt a 4th sign-up

### Actual Result
The 4th attempt (and all subsequent attempts for 24 hours) returns:
```json
{
  "success": 0,
  "errorcode": "LIMIT_EXCEEDED",
  "error": "Access temporarily restricted for user signup/login for next 24 hours, due to unusually high activities from your account or ip address."
}
```
The UI shows the sign-up form but silently fails — the OTP step never appears. No clear error
message is shown to the user explaining why sign-up failed.

### Expected Result
1. The rate limit should be more lenient (e.g., 10–20 attempts per hour, not 3 per 24 hours)
2. When the limit is hit, the UI should show a clear, user-friendly message:
   *"Too many sign-up attempts from this device. Please try again in X hours."*
3. The block duration should be proportional — 24 hours is excessive for 3 attempts.
4. Legitimate users on shared IPs (offices, universities) should not be blocked.

### Impact
- Real users on shared networks (corporate NAT, university Wi-Fi) may be unable to sign up
- Automated testing is severely hampered — CI/CD pipelines cannot run E2E tests reliably
- No user-facing error message means users are confused about why sign-up "doesn't work"

### Evidence
API response captured during automated test run:
```
POST /api/signuser/afterFirstStep
Response: {"success":0,"errorcode":"LIMIT_EXCEEDED","error":"Access temporarily restricted for user signup/login for next 24 hours..."}
```

---

## Bug Report 2 — Email Submit Button Has No Accessible Label or Visible Text

**ID:** BUG-002
**Severity:** Medium
**Priority:** Medium
**Status:** Confirmed (observed in DOM inspection)
**Type:** Accessibility / UX

### Summary
The button that submits the email address on step 1 of the sign-up flow (`#emailBtn`) has no
visible text, no `aria-label`, and no `title` attribute. It renders as an icon-only button with
no accessible name, making it invisible to screen readers and difficult to identify in automation.

### Environment
- URL: https://www.almashines.com/dtc/account
- Browser: Chromium, Firefox (any browser)
- Observed via: DOM inspection and automated test selector research

### Steps to Reproduce
1. Navigate to https://www.almashines.com/dtc/account
2. Inspect the email submit button in DevTools
3. Check for accessible name: `aria-label`, `title`, or visible text content

### Actual Result
The button DOM:
```html
<button type="submit" id="emailBtn" class="mdl-button mdl-js-button submit-button-port">
  <!-- icon only, no text, no aria-label, no title -->
</button>
```
- No visible text
- No `aria-label`
- No `title` attribute
- Screen readers announce it as an unnamed button

### Expected Result
The button should have an accessible name:
```html
<button type="submit" id="emailBtn" aria-label="Continue with email" ...>
```
Or include visible text: "Continue" / "Next" / "Submit"

### Impact
- **Accessibility (WCAG 2.1 — 4.1.2 Name, Role, Value):** Screen reader users cannot identify
  the button's purpose. This is a WCAG Level A failure.
- **Automation:** Cannot use `getByRole('button', { name: '...' })` — must rely on fragile `#emailBtn` ID selector.
- **UX:** First-time users may not realise the button is clickable (no label, no affordance).

### Suggested Fix
Add `aria-label="Continue"` to the button, or replace the icon with visible text.

---

## Bug Report 3 — OTP Verification Error Dialog Does Not Auto-Dismiss or Offer Retry Guidance

**ID:** BUG-003
**Severity:** Low
**Priority:** Low
**Status:** Confirmed (observed during manual and automated testing)
**Type:** UX / Functional
**Note:** This is based on observed behaviour — classified as a UX issue rather than a hard bug.

### Summary
When an incorrect OTP is entered, the platform shows a modal dialog with "OTP verification failed"
and "Invalid Code". The dialog requires manual dismissal (clicking OK) but provides no guidance
on what to do next — no "Resend OTP" button in the dialog, no indication of remaining attempts,
and no auto-focus back to the OTP input after dismissal.

### Environment
- URL: https://www.almashines.com/dtc/account (OTP step)
- Browser: Chromium
- Observed via: Automated test TC-021 and manual testing

### Steps to Reproduce
1. Complete sign-up steps 1 and 2
2. On the OTP step, enter an incorrect OTP (e.g., `000000`)
3. Click "Verify"
4. Observe the error dialog

### Actual Result
- A modal dialog appears: "OTP verification failed / Invalid Code"
- User must click "OK" to dismiss
- After dismissal, focus is NOT returned to the OTP input field
- No indication of how many attempts remain before the OTP is invalidated
- No "Resend OTP" shortcut in the dialog

### Expected Result
1. After dismissal, focus should automatically return to the OTP input field
2. The dialog should include a "Resend OTP" option for convenience
3. If there's an attempt limit, it should be communicated: "2 attempts remaining"
4. Alternatively, an inline error below the input (no modal) would be less disruptive

### Impact
- Users who mistype their OTP must manually click OK, then manually click back into the input
- On mobile, this is particularly disruptive (keyboard dismisses, must re-tap)
- No attempt counter means users don't know when to request a new OTP

### Evidence
Observed dialog text (captured via Playwright):
```
dialog[role="dialog"]:
  "OTP verification failed"
  "Invalid Code"
  [OK button]
```
After clicking OK: OTP input is visible but not focused.
