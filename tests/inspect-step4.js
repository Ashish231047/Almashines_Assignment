/**
 * Inspect the join/role step DOM — we need to know what it looks like
 * We'll use a real OTP from testinator.com inbox via Mailinator public UI
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  const ts = Date.now();
  const inbox = `sdet_step4_${ts}`;
  const email = `${inbox}@testinator.com`;

  // Step 1
  await page.fill('#email', email);
  await page.click('#emailBtn');
  await page.waitForTimeout(3000);

  // Step 2
  await page.fill('#fname', 'Test');
  await page.fill('#lname', 'User');
  await page.fill('#password', 'Test@1234!');
  await page.fill('#re-password', 'Test@1234!');
  await page.click('button[ng-click*="validationFirstStep"]');
  await page.waitForTimeout(4000);

  // Step 3 — open mailinator to get OTP
  console.log(`\nOpen mailinator: https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`);
  console.log('Waiting 30s for OTP email...');

  const mailPage = await browser.newPage();
  await mailPage.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`, { waitUntil: 'domcontentloaded' });

  let otp = null;
  for (let i = 0; i < 10; i++) {
    await mailPage.waitForTimeout(3000);
    await mailPage.reload({ waitUntil: 'domcontentloaded' });
    const rows = await mailPage.locator('table tbody tr').count();
    if (rows > 0) {
      await mailPage.locator('table tbody tr').first().click();
      await mailPage.waitForTimeout(2000);
      // Try iframe
      const frames = mailPage.frames();
      let bodyText = '';
      for (const frame of frames) {
        const t = await frame.textContent('body').catch(() => '');
        if (t.length > bodyText.length) bodyText = t;
      }
      bodyText += await mailPage.textContent('body').catch(() => '');
      const match = bodyText.match(/\b(\d{6})\b/) || bodyText.match(/\b(\d{4})\b/);
      if (match) { otp = match[1]; break; }
    }
    console.log(`Attempt ${i+1}: no email yet...`);
  }

  await mailPage.close();

  if (!otp) {
    console.log('Could not get OTP — dumping current page state');
    console.log(await page.textContent('body'));
    await browser.close();
    return;
  }

  console.log(`Got OTP: ${otp}`);

  // Enter OTP
  await page.fill('#otp_input', otp);
  await page.click('button:has-text("Verify")');
  await page.waitForTimeout(5000);

  console.log('\n=== URL after OTP verify ===');
  console.log(page.url());

  // Dump step 4 elements
  const elements = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('input, button, select, textarea, label, h1, h2, h3').forEach(el => {
      const text = (el.textContent || '').trim().substring(0, 120);
      const ngModel = el.getAttribute('ng-model') || '';
      if ((text || el.id || el.name || el.placeholder || ngModel) && el.offsetParent !== null) {
        result.push({ tag: el.tagName, type: el.type || '', id: el.id || '', name: el.name || '', ngModel, placeholder: el.placeholder || '', text });
      }
    });
    return result;
  });

  console.log('\n=== STEP 4 ELEMENTS ===');
  elements.forEach(el => console.log(JSON.stringify(el)));

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT ===');
  console.log(bodyText.substring(0, 2000));

  await browser.close();
})();
