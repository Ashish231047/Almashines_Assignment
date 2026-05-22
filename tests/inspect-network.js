/**
 * Intercept network calls during sign-up to understand the API
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture all API calls
  const apiCalls = [];
  page.on('request', req => {
    if (req.url().includes('api') || req.url().includes('account') || req.url().includes('otp') || req.url().includes('signup') || req.url().includes('register')) {
      apiCalls.push({ method: req.method(), url: req.url(), postData: req.postData() });
    }
  });
  page.on('response', async res => {
    if (res.url().includes('api') || res.url().includes('account') || res.url().includes('otp') || res.url().includes('signup') || res.url().includes('register')) {
      const body = await res.text().catch(() => '');
      if (body && body.length < 2000) {
        console.log(`RESPONSE ${res.status()} ${res.url()}`);
        console.log(body.substring(0, 500));
        console.log('---');
      }
    }
  });

  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  const ts = Date.now();
  const inbox = `sdet_net_${ts}`;
  const email = `${inbox}@testinator.com`;

  await page.fill('#email', email);
  await page.click('#emailBtn');
  await page.waitForTimeout(3000);

  await page.fill('#fname', 'Test');
  await page.fill('#lname', 'User');
  await page.fill('#password', 'Test@1234!');
  await page.fill('#re-password', 'Test@1234!');
  await page.click('button[ng-click*="validationFirstStep"]');
  await page.waitForTimeout(5000);

  console.log('\n=== API CALLS MADE ===');
  apiCalls.forEach(c => console.log(JSON.stringify(c)));

  await browser.close();
})();
