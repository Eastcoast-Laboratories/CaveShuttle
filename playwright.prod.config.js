/**
 *  this config sets all data vor tests on the live system 
 */
import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const LOCAL_BROWSERS_DIR = path.resolve('.playwright-browsers');
function findLocalChromium() {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (!fs.existsSync(LOCAL_BROWSERS_DIR)) return undefined;
  const dirs = fs.readdirSync(LOCAL_BROWSERS_DIR)
    .filter((d) => d.startsWith('chromium-'))
    .sort((a, b) => parseInt(b.split('-')[1], 10) - parseInt(a.split('-')[1], 10));
  for (const d of dirs) {
    const bin = path.join(LOCAL_BROWSERS_DIR, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(bin)) return bin;
  }
  return undefined;
}
const localChromium = findLocalChromium();

const chromiumArgs = [
  '--headless=new',
  '--disable-features=WebRtcHideLocalIpsWithMdns',
  '--force-webrtc-ip-handling-policy=default_public_and_private_interfaces',
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--enable-logging',
  '--v=1',
];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://caveshuttle.z11.de',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: localChromium
          ? { executablePath: localChromium, headless: true, args: chromiumArgs }
          : { headless: true, args: chromiumArgs },
      },
    },
  ],
  // No webServer — we test against production directly
});
