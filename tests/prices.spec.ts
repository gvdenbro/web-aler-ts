import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/prices'

test.beforeAll(async ({}, testInfo) => {
  if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
    removeDirectory(scrapesDirectory);
  }
});

test.beforeEach(async ({ context }) => {
  // block cookie consent popup
  await context.route(/https:\/\/cdn\.cookielaw\.org/, route => route.abort());
});

test("hurricane-xlt-2", async ({ page, context }, testInfo) => {

  await page.goto("https://www.teva-eu.com/nl/be/men-sandals/hurricane-xlt-2/1019234.html");

  await expect(page.locator('.d-none > .prices > .price')).toBeVisible();

  const htmlContent = await page.locator('.d-none > .prices > .price').innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('.product-option-box').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});