/**
 * Debug mailinator email reading
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Use the inbox from the last test run that we know has an email
  const inbox = 'sdet_s4b_1779431027002';
  await page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Page title:', await page.title());

  // Click first email row
  const rows = await page.locator('table tbody tr').count();
  console.log('Email rows:', rows);

  if (rows > 0) {
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(3000);

    // Try to find the message iframe
    const allFrames = page.frames();
    console.log('Frames count:', allFrames.length);
    for (const f of allFrames) {
      console.log('Frame URL:', f.url());
      const t = await f.textContent('body').catch(() => '');
      if (t.trim()) console.log('Frame text:', t.substring(0, 500));
    }

    // Try frameLocator
    const msgFrame = page.frameLocator('#msg_body');
    const html = await msgFrame.locator('html').innerHTML().catch(e => `Error: ${e.message}`);
    console.log('\nmsg_body iframe HTML:', html.substring(0, 500));

    // Full page screenshot
    await page.screenshot({ path: 'test-results/mailinator-debug.png', fullPage: true });

    // Get all text on page
    const allText = await page.evaluate(() => document.documentElement.innerText);
    console.log('\nAll page text:', allText.substring(0, 1000));
  }

  await browser.close();
})();
