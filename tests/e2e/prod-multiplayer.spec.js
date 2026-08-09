import { test, expect } from '@playwright/test';

// Test against the production server to debug WebRTC ICE failures.
// Run with: npx playwright test tests/e2e/prod-multiplayer.spec.js --config=playwright.prod.config.js --project=chromium

const PROD_URL = 'https://caveshuttle.z11.de';

test.describe('Production Multiplayer Debug', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebRTC only on Chromium');
  test.setTimeout(90_000);

  test('connect to production server and capture console logs', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const clientContext = await browser.newContext();
    await hostContext.addInitScript(() => {
      localStorage.setItem('app_tutorialDismissed', 'true');
      localStorage.setItem('caveShuttle_language', 'en');
      localStorage.setItem('app_playerMode', 'two');
    });
    await clientContext.addInitScript(() => {
      localStorage.setItem('app_tutorialDismissed', 'true');
      localStorage.setItem('caveShuttle_language', 'en');
      localStorage.setItem('app_playerMode', 'two');
    });
    const host = await hostContext.newPage();
    const client = await clientContext.newPage();

    const hostLogs = [];
    const clientLogs = [];
    host.on('console', (m) => { const l = `[HOST_CONSOLE] ${m.type()} ${m.text()}`; hostLogs.push(l); console.log(l); });
    client.on('console', (m) => { const l = `[CLIENT_CONSOLE] ${m.type()} ${m.text()}`; clientLogs.push(l); console.log(l); });
    host.on('pageerror', (e) => { const l = `[HOST_PAGEERROR] ${e.message}`; hostLogs.push(l); console.log(l); });
    client.on('pageerror', (e) => { const l = `[CLIENT_PAGEERROR] ${e.message}`; clientLogs.push(l); console.log(l); });

    // Capture network requests related to wrtc
    host.on('request', (req) => {
      if (req.url().includes('.wrtc') || req.url().includes('public-lobby')) {
        console.log(`[HOST_NET] ${req.method()} ${req.url()}`);
      }
    });
    client.on('request', (req) => {
      if (req.url().includes('.wrtc') || req.url().includes('public-lobby')) {
        console.log(`[CLIENT_NET] ${req.method()} ${req.url()}`);
      }
    });
    host.on('response', (res) => {
      if (res.url().includes('.wrtc') || res.url().includes('public-lobby')) {
        console.log(`[HOST_RESP] ${res.status()} ${res.url()}`);
      }
    });
    client.on('response', (res) => {
      if (res.url().includes('.wrtc') || res.url().includes('public-lobby')) {
        console.log(`[CLIENT_RESP] ${res.status()} ${res.url()}`);
      }
    });

    // --- Host ---
    await host.goto(PROD_URL, { waitUntil: 'networkidle' });
    await host.waitForTimeout(3000);
    await host.screenshot({ path: 'test-results/prod-host-01-initial.png' });

    // Click Multiplayer (text-based, works for EN and DE)
    await host.getByText('Multiplayer', { exact: false }).first().click();
    await host.waitForTimeout(1000);
    await host.getByText('Online', { exact: false }).first().click();
    await host.waitForTimeout(2000);
    await host.screenshot({ path: 'test-results/prod-host-02-online-lobby.png' });

    // Click create game button
    const createBtn = host.getByRole('button').filter({ hasText: /Create|Private|Spiel erstellen/i });
    await createBtn.first().click();
    await host.waitForTimeout(1000);

    // If "Create Private Game" appears, click it
    try {
      const privateBtn = host.getByText(/Create Private|Private Game/i);
      if (await privateBtn.count() > 0) {
        await privateBtn.first().click();
        await host.waitForTimeout(1000);
      }
    } catch {}

    await host.screenshot({ path: 'test-results/prod-host-03-creating.png' });
    await host.waitForTimeout(15000);
    await host.screenshot({ path: 'test-results/prod-host-04-after-wait.png' });

    const hostText = await host.locator('body').textContent();
    console.log('[HOST_PAGE_TEXT]', hostText?.substring(0, 800));

    // Try to get lobby code
    const lobbyHeading = host.locator('text=/Waiting Room|Warteraum/');
    let code = '';
    try {
      await expect(lobbyHeading).toBeVisible({ timeout: 15_000 });
      // The code appears in the body text, extract it from the full page text
      const bodyText = await host.locator('body').textContent();
      const match = (bodyText || '').match(/\b([A-Z0-9]{5})\b/);
      code = match ? match[1] : '';
      console.log('[MP_TEST] host lobby code:', code);
    } catch {
      console.log('[MP_TEST] Host failed to create lobby');
      console.log('[HOST_FULL_TEXT]', hostText?.substring(0, 1000));
    }

    if (code) {
      // --- Client ---
      await client.goto(PROD_URL, { waitUntil: 'networkidle' });
      await client.waitForTimeout(3000);
      await client.getByText('Multiplayer', { exact: false }).first().click();
      await client.waitForTimeout(500);
      await client.getByText('Online', { exact: false }).first().click();
      await client.waitForTimeout(1000);
      await client.screenshot({ path: 'test-results/prod-client-01-online.png' });

      await client.getByText(/Join|Beitreten/i).first().click();
      await client.waitForTimeout(500);
      await client.getByPlaceholder(/LOBBY|CODE/i).fill(code);
      await client.getByRole('button', { name: /Join|Beitreten/i }).click();

      await client.waitForTimeout(15000);
      await client.screenshot({ path: 'test-results/prod-client-02-after-join.png' });

      const clientText = await client.locator('body').textContent();
      console.log('[CLIENT_PAGE_TEXT]', clientText?.substring(0, 800));

      try {
        await expect(client.locator('text=/Waiting Room|Warteraum/')).toBeVisible({ timeout: 10_000 });
        console.log('[MP_TEST] SUCCESS: Client joined lobby!');
      } catch {
        console.log('[MP_TEST] FAILED: Client could not join lobby');
      }
    }

    await host.waitForTimeout(5000);
    await client.waitForTimeout(5000);

    console.log('\n=== ALL HOST LOGS ===');
    hostLogs.forEach(l => console.log(l));
    console.log('\n=== ALL CLIENT LOGS ===');
    clientLogs.forEach(l => console.log(l));

    await hostContext.close();
    await clientContext.close();
  });
});
