import { test, expect } from './fixtures/cdp-fixtures';

test('CDP: has title', async ({ cdpPage }) => {
  await cdpPage.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(cdpPage).toHaveTitle(/Playwright/);
});

test('CDP: get started link', async ({ cdpPage }) => {
  await cdpPage.goto('https://playwright.dev/');

  // Click the get started link.
  await cdpPage.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(cdpPage.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
