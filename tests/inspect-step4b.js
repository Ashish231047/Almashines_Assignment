/**
 * Inspect step 4 (join/role) by getting OTP correctly from mailinator iframe
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();
  await page.goto('https://www.almashines.com/dtc/account', { waitUntil: 'networkidle' });

  const ts = Date.now();
  const inbox = `sdet_s4b_${ts}`;
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

  // Step 3 — get OTP from mailinator
  const mailPage = await browser.newPage();
  await mailPage.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`, { waitUntil: 'domcontentloaded' });

  let otp = null;
  for (let i = 0; i < 12; i++) {
    await mailPage.waitForTimeout(4000);
    await mailPage.reload({ waitUntil: 'domcontentloaded' });
    await mailPage.waitForTimeout(1000);

    const rows = await mailPage.locator('table tbody tr').count();
    console.log(`Attempt ${i+1}: ${rows} emails found`);

    if (rows > 0) {
      await mailPage.locator('table tbody tr').first().click();
      await mailPage.waitForTimeout(3000);

      // Try reading from the message preview iframe
      const msgFrame = mailPage.frameLocator('#msg_body');
      const frameBody = await msgFrame.locator('body').textContent().catch(() => '');
      console.log('Frame body:', frameBody.substring(0, 300));

      // Also try main page text
      const mainText = await mailPage.textContent('body').catch(() => '');
      console.log('Main text snippet:', mainText.substring(0, 500));

      const combined = frameBody + mainText;
      // Look for 4-6 digit OTP
      const patterns = [
        /otp[:\s]+(\d{4,6})/i,
        /code[:\s]+(\d{4,6})/i,
        /\b(\d{6})\b/,
        /\b(\d{4})\b/,
      ];
      for (const p of patterns) {
        const m = combined.match(p);
        if (m) { otp = m[1]; break; }
      }
      if (otp) break;
    }
  }

  await mailPage.close();

  if (!otp) {
    console.log('Could not get OTP');
    await browser.close();
    return;
  }

  console.log(`\nUsing OTP: ${otp}`);

  // Enter OTP on sign-up page
  await page.fill('#otp_input', otp);
  await page.click('button:has-text("Verify")');
  await page.waitForTimeout(5000);

  // Dismiss any dialog
  const okBtn = page.locator('button:has-text("OK")');
  if (await okBtn.isVisible().catch(() => false)) {
    console.log('Dialog appeared — clicking OK');
    await okBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('\n=== URL after OTP ===', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT ===');
  console.log(bodyText.substring(0, 2000));

  // Dump all visible elements
  const elements = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('input, button, select, textarea, label').forEach(el => {
      if (el.offsetParent !== null) {
        result.push({
          tag: el.tagName, type: el.type || '', id: el.id || '', name: el.name || '',
          ngModel: el.getAttribute('ng-model') || '',
          placeholder: el.placeholder || '',
          text: (el.textContent || '').trim().substring(0, 80),
        });
      }
    });
    return result;
  });
  console.log('\n=== VISIBLE ELEMENTS ===');
  elements.forEach(e => console.log(JSON.stringify(e)));

  await browser.close();
})();
