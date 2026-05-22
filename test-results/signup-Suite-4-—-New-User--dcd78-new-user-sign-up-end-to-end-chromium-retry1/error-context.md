# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup.spec.js >> Suite 4 — New User Happy Path >> TC-015: Complete new user sign-up end-to-end
- Location: tests/signup.spec.js:211:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('#fname') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e11]:
      - generic [ref=e14]:
        - link:
          - /url: /dtcundefined
        - generic [ref=e17]:
          - link [ref=e18] [cursor=pointer]:
            - /url: https://play.google.com/store/apps/details?id=com.almashines.vedanta
            - img [ref=e19]
          - link [ref=e20] [cursor=pointer]:
            - /url: https://apps.apple.com/us/app/vedanta-ambassadors/id6501978809
            - img [ref=e21]
        - link "Join / Login" [ref=e25] [cursor=pointer]:
          - /url: login?source=portfolio
      - generic [ref=e28]:
        - generic [ref=e30]:
          - link [ref=e31] [cursor=pointer]:
            - /url: /dtcundefined
            - img [ref=e32]
          - generic [ref=e33]:
            - link "News & Stories" [ref=e35] [cursor=pointer]:
              - /url: campusfeed
            - generic [ref=e37] [cursor=pointer]:
              - text: Events
              - generic [ref=e38]: 
              - text: 
            - generic [ref=e40] [cursor=pointer]:
              - text: Batchmates
              - generic [ref=e41]: 
              - text: 
            - generic [ref=e43] [cursor=pointer]:
              - text: Find Alumni
              - generic [ref=e44]: 
              - text: 
            - generic [ref=e46] [cursor=pointer]:
              - text: Careers
              - generic [ref=e47]: 
              - text: 
            - generic [ref=e49] [cursor=pointer]:
              - text: About
              - generic [ref=e50]: 
              - text: 
            - link "Alumni Mentorship" [ref=e52] [cursor=pointer]:
              - /url: flash-mentorship
        - text:           
    - main [ref=e55]:
      - generic [ref=e56] [cursor=pointer]:
        - separator [ref=e57]
        - generic [ref=e58]: "?"
        - generic [ref=e59]: Need Help?
      - heading "Signup / Login" [level=2] [ref=e62]
      - generic [ref=e65]:
        - generic [ref=e67]:
          - img [ref=e69]
          - generic [ref=e70]:
            - heading "Test Platform" [level=2] [ref=e72]
            - generic [ref=e73]: Sign up or log in to stay connected with your community
        - generic [ref=e77]:
          - heading "Choose any one of the following to Signup/Login" [level=2] [ref=e79]
          - generic [ref=e80]:
            - generic [ref=e81]:
              - button "Connect with Facebook" [ref=e82] [cursor=pointer]
              - button "Connect with Google" [ref=e83] [cursor=pointer]
              - button "Connect with LinkedIn" [ref=e84] [cursor=pointer]
              - generic [ref=e85]: OR
            - generic:
              - generic [ref=e86]:
                - textbox "Enter your Email..." [ref=e87]: sdet_1779435249978@wshu.net
                - generic: Enter your Email...
              - button "" [ref=e88] [cursor=pointer]:
                - generic [ref=e89]: 
      - generic:
        - button
      - generic [ref=e90]:
        - list [ref=e95]:
          - listitem [ref=e96]:
            - generic [ref=e97] [cursor=pointer]: Home
          - listitem [ref=e98]:
            - generic [ref=e99] [cursor=pointer]: About
          - listitem [ref=e100]:
            - generic [ref=e101] [cursor=pointer]: Contact
          - listitem [ref=e102]:
            - generic [ref=e103] [cursor=pointer]: sitemap
          - listitem [ref=e104]:
            - generic [ref=e105] [cursor=pointer]: Terms
          - listitem [ref=e106]:
            - generic [ref=e107] [cursor=pointer]: Privacy
        - generic [ref=e111]:
          - text: Powered by
          - link [ref=e112] [cursor=pointer]:
            - /url: https://www.almashines.io/
            - img [ref=e113]
  - generic:
    - button
  - generic:
    - dialog:
      - generic: Access Temporary Restricted
      - generic: Access temporarily restricted for user signup/login for next 24 hours, due to unusually high activities from your account or ip address.
      - generic:
        - generic:
          - button "OK" [active]
```

# Test source

```ts
  1   | /**
  2   |  * Page Object Model for the AlmaShines Sign Up page
  3   |  * URL: https://www.almashines.com/dtc/account
  4   |  *
  5   |  * All selectors verified against the live DOM.
  6   |  *
  7   |  * Flow:
  8   |  *   Step 1 — Email entry (#email → #emailBtn)
  9   |  *   Step 2 — New user: name + password (#fname, #lname, #password, #re-password → validationFirstStep)
  10  |  *          — Existing user: redirected / login prompt shown
  11  |  *   Step 3 — OTP verification (#otp_input → Verify button)
  12  |  *   Step 4 — Role + T&C + Join (select[name=role], #privacy-terms, #consent-form → #btn3_sgnup)
  13  |  */
  14  | 
  15  | class SignUpPage {
  16  |   /**
  17  |    * @param {import('@playwright/test').Page} page
  18  |    */
  19  |   constructor(page) {
  20  |     this.page = page;
  21  | 
  22  |     // ── Step 1: Email entry ──────────────────────────────────────────────────
  23  |     this.emailInput     = page.locator('#email');
  24  |     this.emailSubmitBtn = page.locator('#emailBtn');
  25  | 
  26  |     // ── Step 2: New user — name + password ───────────────────────────────────
  27  |     this.firstNameInput       = page.locator('#fname');
  28  |     this.lastNameInput        = page.locator('#lname');
  29  |     this.passwordInput        = page.locator('#password');
  30  |     this.confirmPasswordInput = page.locator('#re-password');
  31  |     this.signUpBtn            = page.locator('button[ng-click*="validationFirstStep"]');
  32  |     this.backBtn              = page.locator('button[ng-click*="hideDetailsForm"]').first();
  33  | 
  34  |     // ── Step 2b: Existing user ────────────────────────────────────────────────
  35  |     // The platform shows a login form / redirects when email already exists
  36  |     this.loginPrompt = page.locator('text=/already.*account|log.*in|sign.*in/i');
  37  | 
  38  |     // ── Step 3: OTP verification ──────────────────────────────────────────────
  39  |     this.otpInput      = page.locator('#otp_input');
  40  |     this.verifyBtn     = page.locator('button:has-text("Verify")');
  41  |     this.resendOtpLink = page.locator('a:has-text("Resend OTP")');
  42  |     this.otpErrorDialog = page.locator('.ng-binding:has-text("OTP verification failed"), .ng-binding:has-text("Invalid Code"), [class*="dialog"]:has-text("Invalid"), body:has-text("OTP verification failed")').first();
  43  |     this.dialogOkBtn   = page.locator('button:has-text("OK")');
  44  | 
  45  |     // ── Step 4: Role + T&C + Join ─────────────────────────────────────────────
  46  |     this.roleSelect       = page.locator('select[name="role"]');
  47  |     this.privacyCheckbox  = page.locator('#privacy-terms');
  48  |     this.consentCheckbox  = page.locator('#consent-form');
  49  |     this.joinBtn          = page.locator('#btn3_sgnup');
  50  | 
  51  |     // ── General ───────────────────────────────────────────────────────────────
  52  |     // AngularJS validation errors appear as ng-messages or inline spans
  53  |     this.errorText = page.locator('.error-class, [ng-message], .ng-invalid ~ .error, span.error').first();
  54  |   }
  55  | 
  56  |   // ── Navigation ──────────────────────────────────────────────────────────────
  57  | 
  58  |   async goto() {
  59  |     await this.page.goto('/dtc/account', { waitUntil: 'domcontentloaded' });
  60  |     await this.page.waitForLoadState('networkidle');
  61  |   }
  62  | 
  63  |   // ── Step 1 ──────────────────────────────────────────────────────────────────
  64  | 
  65  |   async enterEmail(email) {
  66  |     await this.emailInput.waitFor({ state: 'visible' });
  67  |     await this.emailInput.fill(email);
  68  |     await this.emailSubmitBtn.click();
  69  |   }
  70  | 
  71  |   // ── Step 2 ──────────────────────────────────────────────────────────────────
  72  | 
  73  |   /** Wait for the name/password form to appear after email check */
  74  |   async waitForStep2() {
> 75  |     await this.firstNameInput.waitFor({ state: 'visible', timeout: 15000 });
      |                               ^ TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
  76  |   }
  77  | 
  78  |   async fillNewUserDetails({ firstName = 'Test', lastName = 'User', password }) {
  79  |     await this.waitForStep2();
  80  |     await this.firstNameInput.fill(firstName);
  81  |     await this.lastNameInput.fill(lastName);
  82  |     await this.passwordInput.fill(password);
  83  |     await this.confirmPasswordInput.fill(password);
  84  |   }
  85  | 
  86  |   async submitSignUpForm() {
  87  |     await this.signUpBtn.click();
  88  |   }
  89  | 
  90  |   // ── Step 3 ──────────────────────────────────────────────────────────────────
  91  | 
  92  |   /** Wait for the OTP input to appear, handling rate-limit dialogs */
  93  |   async waitForStep3() {
  94  |     const deadline = Date.now() + 60000;
  95  |     while (Date.now() < deadline) {
  96  |       // Check if OTP input is already visible
  97  |       const otpVisible = await this.otpInput.isVisible().catch(() => false);
  98  |       if (otpVisible) return;
  99  | 
  100 |       // Check for any dialog (rate-limit or OTP error)
  101 |       const dialog = this.page.locator('[role="dialog"]');
  102 |       const dialogVisible = await dialog.isVisible().catch(() => false);
  103 |       if (dialogVisible) {
  104 |         const okBtn = this.page.locator('[role="dialog"] button:has-text("OK"), button:has-text("OK")').first();
  105 |         await okBtn.click().catch(() => {});
  106 |         await this.page.waitForTimeout(500);
  107 |       }
  108 | 
  109 |       await this.page.waitForTimeout(500);
  110 |     }
  111 |     throw new Error('OTP step (#otp_input) did not appear within 60s');
  112 |   }
  113 | 
  114 |   async enterOtp(otp) {
  115 |     await this.waitForStep3();
  116 |     await this.otpInput.fill(String(otp));
  117 |     await this.verifyBtn.click();
  118 |   }
  119 | 
  120 |   /** Returns true if the "OTP verification failed" dialog appeared */
  121 |   async isOtpErrorShown() {
  122 |     try {
  123 |       // The platform shows a dialog with role="dialog" containing "OTP verification failed"
  124 |       // or "Access temporarily restricted" when rate-limited
  125 |       await this.page.waitForSelector('[role="dialog"]', { timeout: 8000 });
  126 |       return true;
  127 |     } catch {
  128 |       return false;
  129 |     }
  130 |   }
  131 | 
  132 |   async dismissOtpErrorDialog() {
  133 |     const okBtn = this.page.locator('[role="dialog"] button:has-text("OK"), button:has-text("OK")').first();
  134 |     const visible = await okBtn.isVisible().catch(() => false);
  135 |     if (visible) await okBtn.click();
  136 |   }
  137 | 
  138 |   // ── Step 4 ──────────────────────────────────────────────────────────────────
  139 | 
  140 |   /** Wait for the role/join step to appear */
  141 |   async waitForStep4() {
  142 |     await this.roleSelect.waitFor({ state: 'visible', timeout: 15000 });
  143 |   }
  144 | 
  145 |   /**
  146 |    * Complete the join step
  147 |    * @param {string} role - 'Current Student' | 'Alumni (Past Student)' | 'Staff / Faculty'
  148 |    */
  149 |   async completeJoinStep(role = 'Alumni (Past Student)') {
  150 |     await this.waitForStep4();
  151 |     await this.roleSelect.selectOption({ label: role });
  152 |     await this.privacyCheckbox.check();
  153 |     await this.consentCheckbox.check();
  154 |     await this.joinBtn.click();
  155 |   }
  156 | 
  157 |   // ── Helpers ──────────────────────────────────────────────────────────────────
  158 | 
  159 |   /** Check if the email field has a native validation error */
  160 |   async isEmailInvalid() {
  161 |     return this.emailInput.evaluate(el => !el.validity.valid).catch(() => false);
  162 |   }
  163 | 
  164 |   /** Check if the password field has a native validation error */
  165 |   async isPasswordInvalid() {
  166 |     return this.passwordInput.evaluate(el => !el.validity.valid).catch(() => false);
  167 |   }
  168 | 
  169 |   /** Get visible error text on the page */
  170 |   async getErrorText() {
  171 |     const visible = await this.errorText.isVisible().catch(() => false);
  172 |     if (!visible) return null;
  173 |     return this.errorText.textContent();
  174 |   }
  175 | 
```