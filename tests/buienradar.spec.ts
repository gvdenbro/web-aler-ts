import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';

const brScrapesDirectory: string = './scrapes/buienradar'

test("buienradar jette 3 uur", async ({ page, context }) => {
  
  await context.route("**/*", (request) => { // block cookie consent popup
    request.request().url().startsWith("https://cdn.cookielaw.org")
      ? request.abort()
      : request.continue();
    return;
  });

  await page.goto("https://www.buienradar.be/weer/jette/be/2794914/buienradar/3uurs");

  const popup = page.getByText('Nu niet, misschien later');

  await expect(popup).toBeVisible();
  // get rid of popup
  await popup.click();

  const noRainLabel = page.locator('.categoryLabel', { hasText: 'Geen neerslag verwacht' });

  if (await noRainLabel.isVisible()) {
    removeDirectory(brScrapesDirectory);
    return;
  }

  const rainBox = page.locator('#graphHolderOverview');

  await expect(rainBox).toBeVisible();
  await rainBox.screenshot({ path: `${brScrapesDirectory}/screenshot.png` });
});