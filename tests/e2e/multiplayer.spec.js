import { test, expect } from '@playwright/test';

// End-to-end test that drives two independent browser contexts (host + client)
// through the online multiplayer lobby and into a shared 2-player game session.
// Requires the Geckos.io relay server (started via playwright.config.js webServer).

// Geckos relies on WebRTC data channels; only run this against Chromium where
// headless WebRTC over localhost UDP is reliable.

// start this test with
// SLOW_MO=2000 npx playwright test tests/e2e/multiplayer.spec.js --project=chromium --headed

test.describe('Online Multiplayer 2-Player Session', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'WebRTC multiplayer is tested on Chromium only');

  // WebRTC connection setup and lobby handshake can take a while headless.
  test.setTimeout(120_000);

  test('host and client build a session and enter 2-player mode together', async ({ browser }) => {
    // Two isolated contexts = two separate players/browsers.
    const hostContext = await browser.newContext();
    const clientContext = await browser.newContext();
    // Prevent the tutorial overlay from covering the canvas.
    await hostContext.addInitScript(() => { localStorage.setItem('app_tutorialDismissed', 'true'); localStorage.setItem('caveShuttle_language', 'en'); });
    await clientContext.addInitScript(() => { localStorage.setItem('app_tutorialDismissed', 'true'); localStorage.setItem('caveShuttle_language', 'en'); });
    const host = await hostContext.newPage();
    const client = await clientContext.newPage();

    // Surface page console output to the test output for easier debugging.
    host.on('console', (m) => console.log('[HOST_CONSOLE]', m.type(), m.text()));
    client.on('console', (m) => console.log('[CLIENT_CONSOLE]', m.type(), m.text()));
    host.on('pageerror', (e) => console.log('[HOST_PAGEERROR]', e.message));
    client.on('pageerror', (e) => console.log('[CLIENT_PAGEERROR]', e.message));

    // --- Host: open the app and create an online lobby -----------------------
    await host.goto('/');
    await host.getByRole('button', { name: 'Multiplayer' }).click();
    await host.getByRole('button', { name: 'Online Game' }).click();
    await host.getByRole('button', { name: 'Create Game' }).click();
    await host.getByRole('button', { name: 'Create Private Game' }).click();

    // Wait for the lobby room to appear and read the code from the heading.
    const lobbyHeading = host.locator('text=/Waiting Room/');
    await expect(lobbyHeading).toBeVisible({ timeout: 30_000 });
    const headingText = await lobbyHeading.textContent();
    const match = (headingText || '').match(/\b([A-Z0-9]{5})\b/);
    const code = match ? match[1] : '';
    console.log('[MP_TEST] host lobby code:', code);
    expect(code).toHaveLength(5);

    // --- Client: open the app and join the lobby by code ---------------------
    await client.goto('/');
    await client.getByRole('button', { name: 'Multiplayer' }).click();
    await client.getByRole('button', { name: 'Online Game' }).click();
    await client.getByRole('button', { name: 'Join Game' }).click();
    await client.getByPlaceholder('LOBBY-CODE').fill(code);
    await client.getByRole('button', { name: 'Join' }).click();

    // --- Both players should now be in the waiting room (LobbyRoom) ----------
    await expect(host.locator('text=/Waiting Room/')).toBeVisible({ timeout: 30_000 });
    await expect(client.locator('text=/Waiting Room/')).toBeVisible({ timeout: 30_000 });

    // Host should see that player 2 joined (the player list span, not a status line).
    await expect(host.locator('span', { hasText: /^Player 2/ })).toBeVisible();

    // --- Both mark ready -----------------------------------------------------
    await host.getByRole('button', { name: 'Ready', exact: true }).click();
    await client.getByRole('button', { name: 'Ready', exact: true }).click();

    // Host's "Spiel starten" becomes enabled once both are ready.
    const startBtn = host.getByRole('button', { name: 'Start Game' });
    await expect(startBtn).toBeEnabled({ timeout: 30_000 });
    await startBtn.click();

    // --- Both players enter the game (canvas rendered) -----------------------
    const gameCanvas = '#canvas-container canvas';
    await expect(host.locator(gameCanvas)).toBeVisible({ timeout: 30_000 });
    await expect(client.locator(gameCanvas)).toBeVisible({ timeout: 30_000 });

    // Give the game loop and network state sync a moment to run.
    await host.waitForTimeout(1500);

    // --- Play together: host flies (player 1), client controls turret (player 2)
    await host.locator(gameCanvas).click();
    await host.keyboard.down('ArrowUp');
    await host.waitForTimeout(400);
    await host.keyboard.up('ArrowUp');

    await client.locator(gameCanvas).click();
    // Player 2 uses WASD to rotate the turret and Shift to fire; the client
    // relays these inputs to the host over the network channel.
    await client.keyboard.down('d');
    await client.waitForTimeout(300);
    await client.keyboard.up('d');
    await client.keyboard.press('Shift');

    await host.waitForTimeout(1000);

    // The shared session must still be alive on both ends after interaction.
    await expect(host.locator(gameCanvas)).toBeVisible();
    await expect(client.locator(gameCanvas)).toBeVisible();

    await hostContext.close();
    await clientContext.close();
  });
});
