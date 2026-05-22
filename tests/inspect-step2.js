/**
 * Inspect DOM after entering a new email (step 2 of sign-up)
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  // Enter a fresh email and click the email submit button
  const ts = Date.now();
  const email = `sdet_inspect_${ts}@testinator.com`;
  await page.fill('#email', email);
  await page.click('#emailBtn');

  // Wait for the next step to load
  await page.waitForTimeout(4000);

  console.log('=== URL after email submit ===');
  console.log(page.url());

  // Dump all inputs, buttons, selects
  const elements = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('input, button, select, textarea, [ng-model], label').forEach(el => {
      const text = (el.textContent || '').trim().substring(0, 100);
      const ngModel = el.getAttribute('ng-model') || '';
      const ngClick = el.getAttribute('ng-click') || '';
      if (text || el.id || el.name || el.placeholder || ngModel) {
        result.push({
          tag: el.tagName,
          type: el.type || '',
          id: el.id || '',
          name: el.name || '',
          ngModel,
          ngClick,
          class: (el.className || '').substring(0, 80),
          placeholder: el.placeholder || '',
          text: text.substring(0, 80),
          visible: el.offsetParent !== null,
        });
      }
    });
    return result;
  });

  console.log('\n=== ELEMENTS AFTER EMAIL SUBMIT ===');
  elements.filter(e => e.visible).forEach(el => console.log(JSON.stringify(el)));

  // Also dump visible text on page
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT (first 1000 chars) ===');
  console.log(bodyText.substring(0, 1000));

  await browser.close();
})();
