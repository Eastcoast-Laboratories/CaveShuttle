import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Reuse a locally installed Playwright chromium instead of downloading the
// newest revision. We point executablePath at the existing binary, which
// bypasses Playwright's bundled-revision version check.
const LOCAL_BROWSERS_DIR = path.resolve('.playwright-browsers');
function findLocalChromium() {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (!fs.existsSync(LOCAL_BROWSERS_DIR)) return undefined;
  const dirs = fs.readdirSync(LOCAL_BROWSERS_DIR)
    .filter((d) => d.startsWith('chromium-'))
    // Highest revision number = last installed version.
    .sort((a, b) => parseInt(b.split('-')[1], 10) - parseInt(a.split('-')[1], 10));
  for (const d of dirs) {
    const bin = path.join(LOCAL_BROWSERS_DIR, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(bin)) return bin;
  }
  return undefined;
}
const localChromium = findLocalChromium();

// Respect the Playwright --headed and --debug flags so a browser window is shown.
// The config is loaded again in the worker process where --headed is NOT in argv,
// so we propagate it via an environment variable.
const isHeaded = process.argv.includes('--headed') || process.argv.includes('--debug') || process.env.PW_HEADED === '1';
if (process.argv.includes('--headed') || process.argv.includes('--debug')) {
  process.env.PW_HEADED = '1';
}

// slowMo: Playwright's `playwright test` CLI does not support --slow-mo.
// Set SLOW_MO=500 in the env to slow down actions for visual debugging.
const slowMo = process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0;

// Detect dev certs to determine HTTPS for Geckos server health check
const useHttps = fs.existsSync(path.resolve('.dev-certs/localhost.pem')) &&
                 fs.existsSync(path.resolve('.dev-certs/localhost-key.pem'));

// Extra Chromium flags so headless WebRTC data channels (Geckos.io) work on
// localhost without downloading a newer browser. The --headless=new flag is only
// added in headless runs, otherwise the user would not see a window with --headed.
const chromiumBaseArgs = [
  '--disable-features=WebRtcHideLocalIpsWithMdns',
  '--disable-features=WebRTCPipeWireCapturer',
  '--force-webrtc-ip-handling-policy=default_public_and_private_interfaces',
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--allow-insecure-localhost',
  '--host-resolver-rules=MAP localhost 127.0.0.1',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--enable-logging',
  '--v=1',
];
const chromiumArgs = isHeaded ? chromiumBaseArgs : ['--headless=new', ...chromiumBaseArgs];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: localChromium
          ? { executablePath: localChromium, headless: !isHeaded, args: chromiumArgs, slowMo }
          : { headless: !isHeaded, args: chromiumArgs, slowMo },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // Geckos.io signaling/relay server required for online multiplayer tests.
      command: 'node index.js',
      cwd: 'server',
      url: useHttps ? 'https://localhost:9208/health' : 'http://localhost:9208/health',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
