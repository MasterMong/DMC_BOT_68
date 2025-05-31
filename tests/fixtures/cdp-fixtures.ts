import { test as baseTest, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

type CDPFixtures = {
  cdpBrowser: Browser;
  cdpContext: BrowserContext;
  cdpPage: Page;
};

export const test = baseTest.extend<CDPFixtures>({
  cdpBrowser: async ({}, use) => {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    await use(browser);
    await browser.close();
  },

  cdpContext: async ({ cdpBrowser }, use) => {
    const contexts = cdpBrowser.contexts();
    const context = contexts[0] || await cdpBrowser.newContext();
    await use(context);
  },

  cdpPage: async ({ cdpContext }, use) => {
    const page = await cdpContext.newPage();
    await use(page);
    // await page.close();
  },
});

export { expect };
