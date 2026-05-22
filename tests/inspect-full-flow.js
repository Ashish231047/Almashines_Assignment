/**
 * Full flow inspection using Guerrilla Mail for OTP
 */
const { chromium } = require('@playwright/test');
const { createTestInbox } = require('./helpers/mailinator');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();

  // Create a real inbox
  const { email, waitForOtp } = await createTestInbox();
  console.log('Using email:', email);

  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  // Step 1: email
  await page.fill('#email', email);
  await page.click('#emailBtn');
  await page.waitForTimeout(3000);

  // Step 2: name + password
  await page.fill('#fname', 'Test');
  await page.fill('#lname', 'User');
  await page.fill('#password', 'Test@1234!');
  await page.fill('#re-password', 'Test@1234!');
  await page.click('button[ng-click*="validationFirstStep"]');
  await page.waitForTimeout(4000);

  console.log('Waiting for OTP email...');
  let otp;
  try {
    otp = await waitForOtp({ maxWaitMs: 90000, pollIntervalMs: 5000 });
    console.log('Got OTP:', otp);
  } catch (e) {
    console.error('OTP failed:', e.message);
    await browser.close();
    return;
  }

  // Step 3: enter OTP
  await page.fill('#otp_input', otp);
  await page.click('button:has-text("Verify")');
  await page.waitForTimeout(5000);

  // Dismiss error dialog if any
  const okBtn = page.locator('button:has-text("OK")');
  if (await okBtn.isVisible().catch(() => false)) {
    const pageText = await page.textContent('body');
    console.log('Dialog text:', pageText.substring(0, 200));
    await okBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('\n=== URL after OTP ===', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT ===');
  console.log(bodyText.substring(0, 3000));

  // Dump all visible elements for step 4
  const elements = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('input, button, select, textarea, label, h2, h3').forEach(el => {
      if (el.offsetParent !== null) {
        result.push({
          tag: el.tagName, type: el.type || '', id: el.id || '', name: el.name || '',
          ngModel: el.getAttribute('ng-model') || '',
          ngOptions: el.getAttribute('ng-options') || '',
          placeholder: el.placeholder || '',
          text: (el.textContent || '').trim().substring(0, 100),
        });
      }
    });
    return result;
  });
  console.log('\n=== STEP 4 ELEMENTS ===');
  elements.forEach(e => console.log(JSON.stringify(e)));

  await page.screenshot({ path: 'test-results/step4.png', fullPage: true });
  await browser.close();
})();
