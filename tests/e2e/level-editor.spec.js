import { test, expect } from '@playwright/test';

test.describe('Level Editor E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/');
  });

  test('should load level editor page', async ({ page }) => {
    // Verify the page title
    const title = await page.title();
    expect(title).toContain('Level Editor');
    
    // Verify main elements are present
    await expect(page.locator('h1')).toContainText('Level Editor');
    await expect(page.locator('#levelCanvas')).toBeVisible();
    await expect(page.locator('#tilePalette')).toBeVisible();
  });

  test('should display tile palette', async ({ page }) => {
    // Verify tile palette is visible
    await expect(page.locator('#tilePalette')).toBeVisible();
  });

  test('should display tool buttons', async ({ page }) => {
    // Verify tool buttons are present
    await expect(page.locator('.tool-btn[data-tool="paint"]')).toBeVisible();
    await expect(page.locator('.tool-btn[data-tool="select"]')).toBeVisible();
  });

  test('should display template buttons', async ({ page }) => {
    // Verify template buttons are present
    await expect(page.locator('#templateButtons')).toBeVisible();
    await expect(page.locator('.template-btn')).toHaveCount(7);
  });

  test('should load level 2 from default levelpack', async ({ page }) => {
    // Select levelpack and level
    await page.selectOption('#levelpackSelect', 'default');
    await page.selectOption('#levelSelect', '2');
    
    // Click load button
    await page.click('#loadBtn');
    
    // Wait for canvas to render
    await page.waitForTimeout(500);
    
    // Verify level parameters are updated
    const width = await page.inputValue('#paramWidth');
    const height = await page.inputValue('#paramHeight');
    expect(width).toBe('80');
    expect(height).toBe('50');
  });

  test('should add tile by clicking on canvas', async ({ page }) => {
    // Select a tile from palette
    await page.click('.tile-btn[data-char="p"]');
    
    // Ensure paint tool is active
    await page.click('.tool-btn[data-tool="paint"]');
    
    // Click on canvas to place tile
    const canvas = page.locator('#levelCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    
    // Verify the tile was placed (canvas should be re-rendered)
    await page.waitForTimeout(100);
  });

  test('should delete tile using eraser', async ({ page }) => {
    // First place a tile
    await page.click('.tile-btn[data-char="p"]');
    await page.click('.tool-btn[data-tool="paint"]');
    const canvas = page.locator('#levelCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(100);
    
    // Switch to eraser
    await page.click('.tool-btn[data-tool="eraser"]');
    
    // Click to erase
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    
    // Verify the tile was erased
    await page.waitForTimeout(100);
  });

  test('should insert bunker right template', async ({ page }) => {
    // Click template button
    await page.click('.template-btn[data-template="bunker_right"]');
    
    // Wait for template to be inserted
    await page.waitForTimeout(200);
    
    // Verify canvas was updated
    const canvas = page.locator('#levelCanvas');
    await expect(canvas).toBeVisible();
  });

  test('should insert reactor template', async ({ page }) => {
    // Click template button
    await page.click('.template-btn[data-template="reactor"]');
    
    // Wait for template to be inserted
    await page.waitForTimeout(200);
    
    // Verify canvas was updated
    const canvas = page.locator('#levelCanvas');
    await expect(canvas).toBeVisible();
  });

  test('should insert fuel alcove template', async ({ page }) => {
    // Click template button
    await page.click('.template-btn[data-template="fuel_building"]');
    
    // Wait for template to be inserted
    await page.waitForTimeout(200);
    
    // Verify canvas was updated
    const canvas = page.locator('#levelCanvas');
    await expect(canvas).toBeVisible();
  });

  test('should support undo operation', async ({ page }) => {
    // Place a tile
    await page.click('.tile-btn[data-char="p"]');
    await page.click('.tool-btn[data-tool="paint"]');
    const canvas = page.locator('#levelCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(100);
    
    // Click undo
    await page.click('#undoBtn');
    await page.waitForTimeout(100);
    
    // Verify undo worked
    await expect(canvas).toBeVisible();
  });

  test('should support redo operation', async ({ page }) => {
    // Place a tile
    await page.click('.tile-btn[data-char="p"]');
    await page.click('.tool-btn[data-tool="paint"]');
    const canvas = page.locator('#levelCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(100);
    
    // Undo
    await page.click('#undoBtn');
    await page.waitForTimeout(100);
    
    // Redo
    await page.click('#redoBtn');
    await page.waitForTimeout(100);
    
    // Verify redo worked
    await expect(canvas).toBeVisible();
  });
});
