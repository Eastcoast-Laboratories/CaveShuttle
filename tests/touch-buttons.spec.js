import { test, expect } from '@playwright/test';

test('Touch buttons are rendered', async ({ page }) => {
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  await page.goto('http://localhost:5174');
  await page.waitForLoadState('networkidle');

  // Check if touch buttons are logged
  const touchButtonLogs = consoleLogs.filter(log => log.includes('[TOUCH_BUTTONS]'));
  console.log('Touch button logs:', touchButtonLogs);

  expect(touchButtonLogs.length).toBeGreaterThan(0);
  expect(touchButtonLogs[0]).toContain('Rendering');
});
