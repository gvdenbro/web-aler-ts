import { test, expect, Page, TestInfo } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { createMarkdown } from './md-utils';
import { appendPriceAsString } from './prices-utils';
import { generateSvg } from './graph-utils';

const scrapesDirectory: string = './scrapes/spalat'

test.beforeAll(async ({ }, testInfo) => {
  if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
    removeFiles(scrapesDirectory, 'md');
    removeFiles(scrapesDirectory, 'png');
  }
});

test.afterAll(async ({ }) => {

  generateSvg(`${scrapesDirectory}/spalat.csv`, `${scrapesDirectory}/spalat.svg`, { 'identifier': 'string', 'timestamp': 'date:%Q', 'price': 'integer' }, (data) => {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'line',
      encoding: {
        x: { field: 'timestamp', type: 'temporal', title: 'Time' },
        y: { field: 'price', type: 'quantitative', title: 'Price' },
        color: {
          field: 'identifier', type: 'nominal', legend: {
            labelLimit: 320
          },
          sort: { field: "price", order: 'descending', op: 'median' }
        }
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

test("altex-LG-F2WR508SBW", async ({ page }, testInfo) => {

  await altex(page, testInfo, "https://altex.ro/masina-de-spalat-rufe-frontala-slim-lg-f2wr508sbw-steam-8-kg-1200rpm-clasa-a-alb/cpd/MSFF2WR508SBW/");
});

test("altex-LG-F2WR508SBM", async ({ page }, testInfo) => {

  await altex(page, testInfo, "https://altex.ro/masina-de-spalat-rufe-frontala-slim-lg-f2wr508sbm-steam-8-kg-1200rpm-clasa-a-negru/cpd/MSFF2WR508SBM/");
});

async function altex(page: Page, testInfo: TestInfo, url: string) {

  await page.goto(url);

  const price = (await page.locator(".items-start span.Price-int.leading-none").last().textContent()) || '';

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${price.match(/\d+/g)?.join('') || ''}</div><p><a href="${page.url()}">Source</a></p></div>`);

  appendPriceAsString(`${scrapesDirectory}/spalat.csv`, `${testInfo.title}`, price);
}

test("emag-LG-F2WR508SBM", async ({ page }, testInfo) => {

  await emag(page, testInfo, "https://www.emag.ro/masina-de-spalat-rufe-slim-lg-8-kg-1200-rpm-clasa-a-motor-direct-drive-smart-diagnosis-negru-f2wr508sbm/pd/DLY0B3YBM/");
});

test("emag-LG-F2WR508S0W", async ({ page }, testInfo) => {

  await emag(page, testInfo, "https://www.emag.ro/masina-de-spalat-rufe-slim-lg-8-kg-1200-rpm-clasa-a-motor-direct-drive-smart-diagnosis-alb-f2wr508s0w/pd/DXY0B3YBM/");
});

test("emag-LG-F2WR509SWW", async ({ page }, testInfo) => {

  await emag(page, testInfo, "https://www.emag.ro/masina-de-spalat-rufe-slim-lg-9-kg-1200-rpm-clasa-a-motor-direct-drive-smart-diagnosis-alb-f2wr509sww/pd/D1FDFMYBM/");
});

async function emag(page: Page, testInfo: TestInfo, url: string) {

  await page.goto(url);

  const price = (((await page.locator(".pricing-block .product-new-price").last().textContent()) || '').match(/\d+/g)?.join('') || '').slice(0, -2);

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${price}</div><p><a href="${page.url()}">Source</a></p></div>`);

  appendPriceAsString(`${scrapesDirectory}/spalat.csv`, `${testInfo.title}`, price);
}

