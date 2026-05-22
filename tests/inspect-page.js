/**
 * Helper script to inspect the actual DOM of the sign-up page
 * Run: node tests/inspect-page.js
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  // Get all interactive elements
  const elements = await page.evaluate(() => {
    const result = [];
    const selectors = ['input', 'button', 'a', 'select', '[role="button"]', 'form'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        result.push({
          tag: el.tagName,
          type: el.type || '',
          id: el.id || '',
          name: el.name || '',
          class: el.className || '',
          placeholder: el.placeholder || '',
          text: (el.textContent || '').trim().substring(0, 80),
          href: el.href || '',
          ariaLabel: el.getAttribute('aria-label') || '',
        });
      });
    });
    return result;
  });

  console.log('=== PAGE ELEMENTS ===');
  elements.forEach(el => {
    if (el.text || el.placeholder || el.id || el.name) {
      console.log(JSON.stringify(el));
    }
  });

  // Also get page title and URL
  console.log('\n=== PAGE INFO ===');
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  await browser.close();
})();
