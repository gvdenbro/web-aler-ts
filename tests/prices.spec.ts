import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/prices'

test.beforeAll(async ({ }, testInfo) => {
  if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
    removeDirectory(scrapesDirectory);
  }
});

test.beforeEach(async ({ context }) => {
  await context.route(/(.*forter.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)/, route => route.abort());
});

test("hurricane-xlt-2", async ({ page, context }, testInfo) => {

  await scrapeTevaURL(context, page, testInfo, "https://www.teva-eu.com/nl/be/men-sandals/hurricane-xlt-2/1019234.html");
});

test("zymic", async ({ page, context }, testInfo) => {

  await scrapeTevaURL(context, page, testInfo, "https://www.teva-eu.com/nl/be/men-sandals/zymic/1124049.html");
});

test("terra-fi-5-universal", async ({ page, context }, testInfo) => {

  await scrapeTevaURL(context, page, testInfo, "https://www.teva-eu.com/nl/be/men-sandals/terra-fi-5-universal/1102456.html");
});

async function scrapeTevaURL(context, page, testInfo, tevaUrl: string) {
  
  // getting rid of locale selection popup
  context.addCookies([{ name: "locale_pref", value: "nl_BE", domain: "www.teva-eu.com", path: "/" }]);

  await page.goto(tevaUrl);

  await expect(page.locator('.d-none > .prices > .price')).toBeVisible({ timeout: 30000 });

  const htmlContent = await page.locator('.d-none > .prices > .price').innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('.product-option-box').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
}
