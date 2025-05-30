import { test, expect, chromium } from '@playwright/test';

test.describe('CDP Connection Tests', () => {
  test('connect to existing Chrome via CDP - has title', async () => {
    // Connect to existing Chrome instance
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // Get existing context or create new one
    const contexts = browser.contexts();
    const context = contexts[0] || await browser.newContext();
    
    const pages = await context.pages();
    const page = pages[0] || await context.newPage();
    
    await page.goto('https://playwright.dev/');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
    
    // Don't close browser - just disconnect
    await browser.close();
  });

  test('connect to existing Chrome via CDP - get started link', async () => {
    // Connect to existing Chrome instance
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // Get existing context or create new one
    const contexts = browser.contexts();
    const context = contexts[0] || await browser.newContext();
    
    const page = await context.newPage();
    
    await page.goto('https://playwright.dev/');
    
    // Click the get started link.
    await page.getByRole('link', { name: 'Get started' }).click();
    
    // Expects page to have a heading with the name of Installation.
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
    
    // Don't close browser - just disconnect
    await browser.close();
  });
});
