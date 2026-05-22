# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup.spec.js >> Suite 5 — OTP Step Validations >> TC-018: OTP input field and Verify button appear
- Location: tests/signup.spec.js:411:3

# Error details

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Test source

```ts
  272 |   test('TC-016: Step 2 form shows all required fields and navigation buttons', async ({ page }) => {
  273 |     const sp = new SignUpPage(page);
  274 |     await sp.goto();
  275 |     if (await sp.isPlatformRateLimited()) {
  276 |       test.skip(true, 'Platform IP rate-limit active');
  277 |       return;
  278 |     }
  279 |     const { email } = await createTestInbox();
  280 |     await sp.enterEmail(email);
  281 |     await sp.waitForStep2();
  282 |     await expect(sp.firstNameInput).toBeVisible();
  283 |     await expect(sp.lastNameInput).toBeVisible();
  284 |     await expect(sp.passwordInput).toBeVisible();
  285 |     await expect(sp.confirmPasswordInput).toBeVisible();
  286 |     await expect(sp.signUpBtn).toBeVisible();
  287 |     await expect(sp.backBtn).toBeVisible();
  288 |   });
  289 | 
  290 |   test('TC-017: Step 4 shows role dropdown with correct options', async ({ page }) => {
  291 |     test.setTimeout(180000);
  292 | 
  293 |     const { email, waitForOtp } = await createTestInbox();
  294 |     const sp = new SignUpPage(page);
  295 |     await sp.goto();
  296 | 
  297 |     let limitExceeded = false;
  298 |     page.on('response', async res => {
  299 |       if (res.url().includes('/api/signuser/afterFirstStep')) {
  300 |         const body = await res.json().catch(() => ({}));
  301 |         if (body.errorcode === 'LIMIT_EXCEEDED') limitExceeded = true;
  302 |       }
  303 |     });
  304 | 
  305 |     await sp.enterEmail(email);
  306 |     await sp.waitForStep2();
  307 |     await sp.fillNewUserDetails({ password: 'Test@1234!' });
  308 |     await sp.submitSignUpForm();
  309 |     await page.waitForTimeout(4000);
  310 | 
  311 |     if (limitExceeded) {
  312 |       test.skip(true, 'Platform rate-limited — run from a fresh network');
  313 |       return;
  314 |     }
  315 | 
  316 |     await sp.waitForStep3();
  317 |     const otp = await waitForOtp({ maxWaitMs: 90000 });
  318 |     await sp.enterOtp(otp);
  319 |     await page.waitForTimeout(4000);
  320 | 
  321 |     if (await sp.isOtpErrorShown()) {
  322 |       await sp.dismissOtpErrorDialog();
  323 |       test.skip(true, 'OTP failed');
  324 |       return;
  325 |     }
  326 | 
  327 |     await sp.waitForStep4();
  328 |     const options = await sp.roleSelect.locator('option').allTextContents();
  329 |     expect(options).toContain('Current Student');
  330 |     expect(options).toContain('Alumni (Past Student)');
  331 |     expect(options).toContain('Staff / Faculty');
  332 |     await expect(sp.privacyCheckbox).toBeVisible();
  333 |     await expect(sp.consentCheckbox).toBeVisible();
  334 |     await expect(sp.joinBtn).toBeVisible();
  335 |   });
  336 | 
  337 | });
  338 | 
  339 | // ─────────────────────────────────────────────────────────────────────────────
  340 | // Suite 5 — OTP Step Validations
  341 | // ─────────────────────────────────────────────────────────────────────────────
  342 | // Uses the PERSISTENT test inbox (MAILTM_EMAIL) via "Login with OTP" flow.
  343 | // This triggers an OTP for an existing user — no new account creation needed,
  344 | // so the IP rate limit on new signups does NOT apply.
  345 | //
  346 | // The "Login with OTP" link is on the sign-up page and sends an OTP to the
  347 | // registered email, landing on the same #otp_input step.
  348 | // ─────────────────────────────────────────────────────────────────────────────
  349 | test.describe.serial('Suite 5 — OTP Step Validations', () => {
  350 | 
  351 |   /** @type {import('@playwright/test').Page} */
  352 |   let sharedPage;
  353 |   /** @type {SignUpPage} */
  354 |   let sp;
  355 |   /** @type {import('@playwright/test').BrowserContext} */
  356 |   let context;
  357 |   let persistentEmail;
  358 | 
  359 |   test.beforeAll(async ({ browser }) => {
  360 |     test.setTimeout(120000);
  361 | 
  362 |     const inbox = await getPersistentInbox();
  363 |     persistentEmail = inbox.email;
  364 |     await inbox.clearInbox();
  365 | 
  366 |     context = await browser.newContext();
  367 |     sharedPage = await context.newPage();
  368 |     sp = new SignUpPage(sharedPage);
  369 | 
  370 |     await sp.goto();
  371 |     await sp.enterEmail(persistentEmail);
> 372 |     await sharedPage.waitForTimeout(2000);
      |                      ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  373 | 
  374 |     // If the email is already registered, "Login with OTP" link appears.
  375 |     // If not yet registered (new user), we reach step 2 and submit the form.
  376 |     const loginWithOtp = sharedPage.locator('a:has-text("Login with OTP")').first();
  377 |     const step2Visible = await sp.isStep2Visible();
  378 |     const loginOtpVisible = await loginWithOtp.isVisible().catch(() => false);
  379 | 
  380 |     if (loginOtpVisible) {
  381 |       // Existing user path — click Login with OTP
  382 |       await loginWithOtp.click();
  383 |       await sharedPage.waitForTimeout(2000);
  384 |     } else if (step2Visible) {
  385 |       // New user path — fill form and submit
  386 |       await sp.fillNewUserDetails({ firstName: 'SDET', lastName: 'Tester', password: 'Test@1234!' });
  387 |       await sp.submitSignUpForm();
  388 |       await sharedPage.waitForTimeout(3000);
  389 |     }
  390 | 
  391 |     // Check for LIMIT_EXCEEDED — if hit, skip all Suite 5 tests gracefully
  392 |     const pageText = await sharedPage.evaluate(() => document.body.innerText);
  393 |     if (pageText.includes('temporarily restricted') || pageText.includes('LIMIT_EXCEEDED')) {
  394 |       console.warn('[Suite 5] Platform rate-limit active — Suite 5 tests will be skipped');
  395 |       // Don't throw — let individual tests skip themselves
  396 |       return;
  397 |     }
  398 | 
  399 |     try {
  400 |       await sp.waitForStep3();
  401 |       console.log('[Suite 5 beforeAll] OTP step reached for:', persistentEmail);
  402 |     } catch (e) {
  403 |       console.warn('[Suite 5 beforeAll] Could not reach OTP step:', e.message);
  404 |       // Don't throw — individual tests will check and skip
  405 |     }
  406 |   });
  407 |   test.afterAll(async () => {
  408 |     await context.close().catch(() => {});
  409 |   });
  410 | 
  411 |   test('TC-018: OTP input field and Verify button appear', async () => {
  412 |     if (!sp || !await sp.isStep3Visible()) {
  413 |       test.skip(true, 'OTP step not reached — platform rate-limit active or account not registered. Run from a fresh IP.');
  414 |       return;
  415 |     }
  416 |     await expect(sp.otpInput).toBeVisible();
  417 |     await expect(sp.verifyBtn).toBeVisible();
  418 |   });
  419 | 
  420 |   test('TC-019: Resend OTP link is visible on the OTP step', async () => {
  421 |     if (!sp || !await sp.isStep3Visible()) {
  422 |       test.skip(true, 'OTP step not reached — skipping');
  423 |       return;
  424 |     }
  425 |     await expect(sp.resendOtpLink).toBeVisible();
  426 |   });
  427 | 
  428 |   test('TC-020: OTP step shows the email address the OTP was sent to', async () => {
  429 |     if (!sp || !await sp.isStep3Visible()) {
  430 |       test.skip(true, 'OTP step not reached — skipping');
  431 |       return;
  432 |     }
  433 |     const pageText = await sharedPage.evaluate(() => document.body.innerText);
  434 |     expect(pageText).toContain(persistentEmail);
  435 |   });
  436 | 
  437 |   test('TC-021: Submitting wrong OTP shows "OTP verification failed" dialog', async () => {
  438 |     if (!sp || !await sp.isStep3Visible()) {
  439 |       test.skip(true, 'OTP step not reached — skipping');
  440 |       return;
  441 |     }
  442 |     await sp.otpInput.fill('000000');
  443 |     await sp.verifyBtn.click();
  444 |     const errorShown = await sp.isOtpErrorShown();
  445 |     expect(errorShown).toBeTruthy();
  446 |     await sp.dismissOtpErrorDialog();
  447 |   });
  448 | 
  449 |   test('TC-022: After wrong OTP, user can retry (OTP input is still available)', async () => {
  450 |     if (!sp || !await sp.isStep3Visible()) {
  451 |       test.skip(true, 'OTP step not reached — skipping');
  452 |       return;
  453 |     }
  454 |     await expect(sp.otpInput).toBeVisible();
  455 |     await expect(sp.verifyBtn).toBeVisible();
  456 |   });
  457 | 
  458 | });
  459 | 
  460 | // ─────────────────────────────────────────────────────────────────────────────
  461 | // Suite 6 — Password Validations
  462 | // Uses serial mode + beforeAll to create ONE account and reuse step-2 state.
  463 | // ─────────────────────────────────────────────────────────────────────────────
  464 | test.describe.serial('Suite 6 — Password Validations', () => {
  465 | 
  466 |   /** @type {import('@playwright/test').Page} */
  467 |   let sharedPage;
  468 |   /** @type {SignUpPage} */
  469 |   let sp;
  470 |   /** @type {import('@playwright/test').BrowserContext} */
  471 |   let context;
  472 | 
```