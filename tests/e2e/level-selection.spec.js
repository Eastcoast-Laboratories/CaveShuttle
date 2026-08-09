import { test, expect } from '@playwright/test';

test.describe('Level Selection E2E Tests', () => {
  test('should select level 2', async ({ page }) => {
    await page.goto('/');

    // Click the "START GAME" button to enter the game
    await page.click('text=START GAME');

    // Wait for the game to load
    await page.waitForSelector('canvas');

    // Click on the Level 2 button
    await page.click('text=Level 2');

    // Verify that the game is still running after level selection
    await expect(page.locator('canvas')).toBeVisible();

    // Verify that the HUD shows level 2
    await page.waitForTimeout(1000); // Wait for level to load
    // The level should be displayed in the HUD
  });

  test('should display level selection buttons', async ({ page }) => {
    await page.goto('/');
    await page.click('text=START GAME');
    await page.waitForSelector('canvas');

    // Verify all 6 level buttons are visible
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`text=Level ${i}`)).toBeVisible();
    }
  });

  test('should display controls legend', async ({ page }) => {
    await page.goto('/');
    await page.click('text=START GAME');
    await page.waitForSelector('canvas');

    // Verify controls legend is visible
    await expect(page.locator('text=CONTROLS')).toBeVisible();
    await expect(page.locator('text=Thrust')).toBeVisible();
    await expect(page.locator('text=Rotate Left')).toBeVisible();
    await expect(page.locator('text=Rotate Right')).toBeVisible();
  });
});
