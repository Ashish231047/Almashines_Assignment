/**
 * Page Object Model for the AlmaShines Sign Up page
 * URL: https://www.almashines.com/dtc/account
 *
 * All selectors verified against the live DOM.
 *
 * Flow:
 *   Step 1 — Email entry (#email → #emailBtn)
 *   Step 2 — New user: name + password (#fname, #lname, #password, #re-password → validationFirstStep)
 *          — Existing user: redirected / login prompt shown
 *   Step 3 — OTP verification (#otp_input → Verify button)
 *   Step 4 — Role + T&C + Join (select[name=role], #privacy-terms, #consent-form → #btn3_sgnup)
 */

class SignUpPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Step 1: Email entry ──────────────────────────────────────────────────
    this.emailInput     = page.locator('#email');
    this.emailSubmitBtn = page.locator('#emailBtn');

    // ── Step 2: New user — name + password ───────────────────────────────────
    this.firstNameInput       = page.locator('#fname');
    this.lastNameInput        = page.locator('#lname');
    this.passwordInput        = page.locator('#password');
    this.confirmPasswordInput = page.locator('#re-password');
    this.signUpBtn            = page.locator('button[ng-click*="validationFirstStep"]');
    this.backBtn              = page.locator('button[ng-click*="hideDetailsForm"]').first();

    // ── Step 2b: Existing user ────────────────────────────────────────────────
    // The platform shows a login form / redirects when email already exists
    this.loginPrompt = page.locator('text=/already.*account|log.*in|sign.*in/i');

    // ── Step 3: OTP verification ──────────────────────────────────────────────
    this.otpInput      = page.locator('#otp_input');
    this.verifyBtn     = page.locator('button:has-text("Verify")');
    this.resendOtpLink = page.locator('a:has-text("Resend OTP")');
    this.otpErrorDialog = page.locator('.ng-binding:has-text("OTP verification failed"), .ng-binding:has-text("Invalid Code"), [class*="dialog"]:has-text("Invalid"), body:has-text("OTP verification failed")').first();
    this.dialogOkBtn   = page.locator('button:has-text("OK")');

    // ── Step 4: Role + T&C + Join ─────────────────────────────────────────────
    this.roleSelect       = page.locator('select[name="role"]');
    this.privacyCheckbox  = page.locator('#privacy-terms');
    this.consentCheckbox  = page.locator('#consent-form');
    this.joinBtn          = page.locator('#btn3_sgnup');

    // ── General ───────────────────────────────────────────────────────────────
    // AngularJS validation errors appear as ng-messages or inline spans
    this.errorText = page.locator('.error-class, [ng-message], .ng-invalid ~ .error, span.error').first();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto('/dtc/account', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle');
  }

  // ── Step 1 ──────────────────────────────────────────────────────────────────

  async enterEmail(email) {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.emailSubmitBtn.click();
  }

  // ── Step 2 ──────────────────────────────────────────────────────────────────

  /** Wait for the name/password form to appear after email check */
  async waitForStep2() {
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  async fillNewUserDetails({ firstName = 'Test', lastName = 'User', password }) {
    await this.waitForStep2();
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async submitSignUpForm() {
    await this.signUpBtn.click();
  }

  // ── Step 3 ──────────────────────────────────────────────────────────────────

  /** Wait for the OTP input to appear, handling rate-limit dialogs */
  async waitForStep3() {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      // Check if OTP input is already visible
      const otpVisible = await this.otpInput.isVisible().catch(() => false);
      if (otpVisible) return;

      // Check for any dialog (rate-limit or OTP error)
      const dialog = this.page.locator('[role="dialog"]');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      if (dialogVisible) {
        const okBtn = this.page.locator('[role="dialog"] button:has-text("OK"), button:has-text("OK")').first();
        await okBtn.click().catch(() => {});
        await this.page.waitForTimeout(500);
      }

      await this.page.waitForTimeout(500);
    }
    throw new Error('OTP step (#otp_input) did not appear within 60s');
  }

  async enterOtp(otp) {
    await this.waitForStep3();
    await this.otpInput.fill(String(otp));
    await this.verifyBtn.click();
  }

  /** Returns true if the "OTP verification failed" dialog appeared */
  async isOtpErrorShown() {
    try {
      // The platform shows a dialog with role="dialog" containing "OTP verification failed"
      // or "Access temporarily restricted" when rate-limited
      await this.page.waitForSelector('[role="dialog"]', { timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }

  async dismissOtpErrorDialog() {
    const okBtn = this.page.locator('[role="dialog"] button:has-text("OK"), button:has-text("OK")').first();
    const visible = await okBtn.isVisible().catch(() => false);
    if (visible) await okBtn.click();
  }

  // ── Step 4 ──────────────────────────────────────────────────────────────────

  /** Wait for the role/join step to appear */
  async waitForStep4() {
    await this.roleSelect.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Complete the join step
   * @param {string} role - 'Current Student' | 'Alumni (Past Student)' | 'Staff / Faculty'
   */
  async completeJoinStep(role = 'Alumni (Past Student)') {
    await this.waitForStep4();
    await this.roleSelect.selectOption({ label: role });
    await this.privacyCheckbox.check();
    await this.consentCheckbox.check();
    await this.joinBtn.click();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Check if the email field has a native validation error */
  async isEmailInvalid() {
    return this.emailInput.evaluate(el => !el.validity.valid).catch(() => false);
  }

  /** Check if the password field has a native validation error */
  async isPasswordInvalid() {
    return this.passwordInput.evaluate(el => !el.validity.valid).catch(() => false);
  }

  /** Get visible error text on the page */
  async getErrorText() {
    const visible = await this.errorText.isVisible().catch(() => false);
    if (!visible) return null;
    return this.errorText.textContent();
  }

  /** Check if the new-user form (step 2) is currently visible */
  async isStep2Visible() {
    return this.firstNameInput.isVisible().catch(() => false);
  }

  /** Check if the OTP step (step 3) is currently visible */
  async isStep3Visible() {
    return this.otpInput.isVisible().catch(() => false);
  }

  /** Check if the join step (step 4) is currently visible */
  async isStep4Visible() {
    return this.roleSelect.isVisible().catch(() => false);
  }

  /** Intercept the emailValidate API response to check newUser flag */
  async interceptEmailValidate(email) {
    let newUser = null;
    const handler = async (response) => {
      if (response.url().includes('/api/signuser/emailValidate')) {
        const body = await response.json().catch(() => null);
        if (body !== null) newUser = body.newUser;
      }
    };
    this.page.on('response', handler);
    await this.enterEmail(email);
    await this.page.waitForTimeout(3000);
    this.page.off('response', handler);
    return newUser;
  }

  /** Returns true if the platform is currently rate-limiting this IP */
  async isPlatformRateLimited() {
    try {
      const res = await this.page.evaluate(async () => {
        const r = await fetch('/api/signuser/emailValidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'probe@example.com' }),
        });
        return r.json();
      });
      return res?.restricted === true || res?.errorcode === 'LIMIT_EXCEEDED';
    } catch {
      return false;
    }
  }
}

module.exports = { SignUpPage };
