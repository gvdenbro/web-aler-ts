import { test, expect } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { createMarkdown } from './md-utils';
import { appendPriceAsString } from './prices-utils';
import { generateSvg } from './graph-utils';

const scrapesDirectory: string = './scrapes/prices'

test.beforeAll(async ({ }, testInfo) => {
  if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
    removeFiles(scrapesDirectory, 'md');
    removeFiles(scrapesDirectory, 'png');
  }
});

test.afterAll(async ({ }) => {

  generateSvg(`${scrapesDirectory}/prices.csv`, `${scrapesDirectory}/prices.svg`, { 'identifier': 'string', 'timestamp': 'date:%Q', 'price': 'integer' }, (data) => {
      return {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          data: { values: data },
          mark: {
              type: 'line',
              point: {
                  filled: false,
                  fill: 'white'
              }
          },
          encoding: {
              x: { field: 'timestamp', type: 'temporal', title: 'Time' },
              y: { field: 'price', type: 'quantitative', title: 'Price' },
              color: { field: 'identifier', type: 'nominal', legend: {
                  labelLimit: 320
              } },
              //row: { field: "identifier", type: "nominal", title: "Flight" }
          }
      }
  });
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

test("briare-mosaicshop", async ({ page, context }, testInfo) => {

  await page.goto("https://mosaicshop.be/en/products/briare-harmonie-25mm-prunelle-2772?variant=39543751245953");

  const htmlContent = await page.locator('.inventory-qty-amount').innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('.grid.product-single').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});

test("briare-cotemosaique", async ({ page, context }, testInfo) => {

  context.addCookies([{ name: "__lglaw", value: "0", domain: "www.cotemosaique.com", path: "/" }]);

  await page.goto("https://www.cotemosaique.com/emaux-de-briare-harmonie-en-vrac/32-mosaique-emaux-briare-prunelle-ag11-noir-3760286710884.html");

  const htmlContent = await page.locator('.trcquant').innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('#center_column .primary_block.row').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});

test("zalando-lounge", async ({ page, context }, testInfo) => {

  await page.goto("https://www.zalando-lounge.be/blog/merken");

  const container = page.locator('#react-container');

  expect(container).toBeVisible();

  const match = container.filter({ hasText: /teva|merrell/i }).first();

  if (await match.isVisible()) {

    const htmlContent = await match.innerHTML();
    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

    await match.screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
  }
});

test("bol-bosch-zamo", async ({ page, context }, testInfo) => {

  context.addCookies([{ name: "bolConsentChoices", value: "source#OFC|version#6|int-tran#false|ext-tran#false|int-beh#false|ext-beh#false", domain: ".www.bol.com", path: "/" }]);
  context.addCookies([{ name: "locale", value: "BE", domain: ".www.bol.com", path: "/" }]);

  await page.goto("https://www.bol.com/be/fr/p/bosch-zamo-telemetre-portee-jusqu-a-20-metres/9200000095919159/");

  const price = page.locator('[data-test="priceBlockPrice"]');

  expect(price).toBeVisible();

  const htmlContent = await price.innerHTML();
  
  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);
  
  await page.locator('[data-test="product-page-columns"]').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
  
  const textContent = await price.innerText();
  
  appendPriceAsString(`${scrapesDirectory}/prices.csv`, testInfo.title, textContent);
});