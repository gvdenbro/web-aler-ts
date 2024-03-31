import { test, expect, Page, TestInfo } from '@playwright/test';
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
      mark: 'line',
      encoding: {
        x: { field: 'timestamp', type: 'temporal', title: 'Time' },
        y: {
          field: 'price', type: 'quantitative', title: 'Price',
          axis: {// we store the price in cents, so on the axis we divide by 100 for a prettier display
            labelExpr: "format(datum.value / 100, '.0f')"
          }
        },
        color: {
          field: 'item', type: 'nominal', legend: {
            labelLimit: 320
          },
          sort: { field: "price", order: 'descending', op: 'median' }
        },
        row: { field: "group", type: "nominal" },
      },
      resolve: { scale: { color: 'independent', y: 'independent', x: 'independent' } },// make sure each facet has its own legend
      config: {
        font: "Liberation Mono"
      }
    }
  });
});


test.beforeEach(async ({ context }) => {
  await context.route(/(.*forter.*)|(.*google.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)/, route => route.abort());
});

test.skip("hurricane-xlt-2", async ({ page, context }, testInfo) => {

  await scrapeTevaURL(context, page, testInfo, "https://www.teva-eu.com/nl/be/men-sandals/hurricane-xlt-2/1019234.html");
});

test.skip("zymic", async ({ page, context }, testInfo) => {

  await scrapeTevaURL(context, page, testInfo, "https://www.teva-eu.com/nl/be/men-sandals/zymic/1124049.html");
});

test.skip("terra-fi-5-universal", async ({ page, context }, testInfo) => {

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

  const match = container.filter({ hasText: /merrell|poncho/i }).first();

  if (await match.isVisible()) {

    const htmlContent = await match.innerHTML();
    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

    await match.screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
  }
});


test("cheleatandc", async ({ page, context }, testInfo) => {

  await page.goto("https://florinchelea.be/fr/terms");

  const container = page.locator('.terms').first();

  expect(container).toBeVisible();

  const htmlContent = await container.innerHTML();
  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

});

test.skip("zalando-teva-42", async ({ page }, testInfo) => {

  await zalando(page, testInfo, "https://fr.zalando.be/homme/teva__taille-42/?sold_by_zalando=true", /teva/i);
});

test.skip("zalando-poncho", async ({ page }, testInfo) => {

  await zalando(page, testInfo, "https://fr.zalando.be/homme/?q=poncho+imperm%C3%A9able&sold_by_zalando=true", /poncho/i);
});

async function zalando(page: Page, testInfo: TestInfo, url: string, filter: RegExp) {

  await page.goto(url);

  const articles = page.locator('article header').filter({ hasText: filter });

  expect(articles.nth(0)).toBeVisible();

  const elements = await articles.all();

  for (const locator of elements) {

    const title = (await locator.locator('h3').nth(1).textContent())?.trim().replace(/\s|\//g, "_");
    const price = (await locator.locator('section > p').first().textContent()) || '';

    createMarkdown(`${scrapesDirectory}/${testInfo.title}-${title}.md`, `<div><div>${price.match(/\d+/g)?.join('') || ''}</div><p><a href="${page.url()}">Source</a></p></div>`);

    appendPriceAsString(`${scrapesDirectory}/prices.csv`, `${testInfo.title}-${title}`, price, [testInfo.title, title]);
  }
}
