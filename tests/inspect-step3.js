/**
 * Inspect DOM after submitting name+password (OTP step)
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  const ts = Date.now();
  const email = `sdet_step3_${ts}@testinator.com`;

  // Step 1: enter email
  await page.fill('#email', email);
  await page.click('#emailBtn');
  await page.waitForTimeout(3000);

  // Step 2: fill name + password
  await page.fill('#fname', 'Test');
  await page.fill('#lname', 'User');
  await page.fill('#password', 'Test@1234!');
  await page.fill('#re-password', 'Test@1234!');

  // Click Sign Up button
  await page.click('button[ng-click*="validationFirstStep"]');
  await page.waitForTimeout(5000);

  console.log('=== URL after sign-up submit ===');
  console.log(page.url());

  const elements = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('input, button, select, textarea, label, h1, h2, h3, p, span[ng-bind], div[ng-show]').forEach(el => {
      const text = (el.textContent || '').trim().substring(0, 120);
      const ngModel = el.getAttribute('ng-model') || '';
      const ngShow = el.getAttribute('ng-show') || '';
      if ((text || el.id || el.name || el.placeholder || ngModel) && el.offsetParent !== null) {
        result.push({
          tag: el.tagName,
          type: el.type || '',
          id: el.id || '',
          name: el.name || '',
          ngModel,
          ngShow,
          placeholder: el.placeholder || '',
          text: text.substring(0, 100),
        });
      }
    });
    return result;
  });

  console.log('\n=== VISIBLE ELEMENTS AFTER SIGNUP SUBMIT ===');
  elements.forEach(el => console.log(JSON.stringify(el)));

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT ===');
  console.log(bodyText.substring(0, 1500));

  await browser.close();
})();
