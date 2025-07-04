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

test("vandenborre-SMI4ECS28E", async ({ page, context }, testInfo) => {

  await page.goto("https://www.vandenborre.be/fr/lave-vaisselle-encastrable/bosch-smi4ecs28e-serie-4-extradry", {timeout: 120000});

  const htmlContent = await page.locator('.pdhe-extra-info').innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('.product-detail-header-expanded').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});

test("krefel-SMI4ECS28E", async ({ page, context }, testInfo) => {

  context.addCookies([{ name: "TC_PRIVACY", value: "1%40010%7C2%7C7368%40%4011%401719641717000%2C1719641717000%2C1719641717000%40", domain: ".krefel.be", path: "/" }]);

  await page.goto("https://www.krefel.be/fr/p/12007601-bosch-lave-vaisselle-encastrable-smi4ecs28e");

  await page.locator('data-testid="widget-button"').isVisible();

  const htmlContent = await page.locator(".lg\\:ml-20").innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('div.gap-4:nth-child(3)').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});

test("coolblue-SMI4ECS28E", async ({ page, context }, testInfo) => {

  context.addCookies([{ name: "cookie-preferences", value: "hsjahkdkjahjkdadskjdhakdjhksjdahkjsdhakdhsaskjdhkajsdhkjdsjdhkahj", domain: ".coolblue.be", path: "/" }]);

  await page.goto("https://www.coolblue.be/nl/product/959431/bosch-smi4ecs28e.html");

  const htmlContent = await page.locator("#main-content form").innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('#main-content form').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});

test.skip("briare-cotemosaique", async ({ page, context }, testInfo) => {

  context.addCookies([{ name: "__lglaw", value: "0", domain: "www.cotemosaique.com", path: "/" }]);

  await page.goto("https://www.cotemosaique.com/emaux-de-briare-harmonie-en-vrac/32-mosaique-emaux-briare-prunelle-ag11-noir-3760286710884.html");

  const htmlContent = await page.locator('.trcquant').innerHTML();

  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><img src="${testInfo.title}.png"></img></p><p><a href="${page.url()}">Source</a></p></div>`);

  await page.locator('#center_column .primary_block.row').screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
});

test.skip("zalando-lounge", async ({ page, context }, testInfo) => {

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

test.skip("immoweb", async ({ page, context }, testInfo) => {

  await page.goto("https://www.immoweb.be/fr/recherche/appartement/a-louer?countries=BE&postalCodes=BE-1020,BE-1080,BE-1083,BE-1090,BE-1081&minPrice=750&maxPrice=1500&page=1&orderBy=newest");

  try {
    const popup = page.getByTestId('uc-customize-button');
    await expect(popup).toBeVisible();
    await popup.click();
  
    const denyButton = page.getByTestId('uc-deny-all-button');
  
    await expect(denyButton).toBeVisible();
    await denyButton.click();

  } catch(err) {
    // ignore - sometimes we don't get the popup
  }

  const mainContent = page.locator('#main-content');

  expect(mainContent).toBeVisible();

  await page.evaluate(() => {
    document.querySelectorAll('.flag-list__text').forEach(el => el.remove());
  });

  const htmlContent = await mainContent.innerHTML();
  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

});

// https://immovlan.be/fr/immobilier?transactiontypes=a-louer,en-colocation&towns=1020-laeken,1080-molenbeek-saint-jean,1081-koekelberg,1083-ganshoren,1090-jette&propertytypes=appartement&minprice=750&maxprice=1150&noindex=1

let scroll = async (args) => {
  const {direction, speed} = args;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const scrollHeight = () => document.body.scrollHeight;
  const start = direction === "down" ? 0 : scrollHeight();
  const shouldStop = (position) => direction === "down" ? position > scrollHeight() : position < 0;
  const increment = direction === "down" ? 100 : -100;
  const delayTime = speed === "slow" ? 50 : 10;
  console.error(start, shouldStop(start), increment)
  for (let i = start; !shouldStop(i); i += increment) {
      window.scrollTo(0, i);
      await delay(delayTime);
  }
};

test.skip("immovlan", async ({ page, context }, testInfo) => {

  await page.goto("https://immovlan.be/fr/immobilier?transactiontypes=a-louer,en-colocation&towns=1020-laeken,1080-molenbeek-saint-jean,1081-koekelberg,1083-ganshoren,1090-jette&propertytypes=appartement&minprice=750&maxprice=1500&noindex=1");

  try {
    const popup = page.getByLabel('Accepter & Fermer: Accepter');
    await expect(popup).toBeVisible();
    await popup.click();
  } catch(err) {
    // ignore - sometimes we don't get the popup
  }

  const mainContent = page.locator("#search-results");

  expect(mainContent).toBeVisible();

  // load lazy images
  await page.evaluate(scroll, {direction: "down", speed: "slow"});

  const htmlContent = await mainContent.innerHTML();
  createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

});

// test("zimmo", async ({ page, context }, testInfo) => {

//   await page.goto("https://www.zimmo.be/fr/");

//   try {
//     const popup = page.getByLabel('Accepter & Fermer: Accepter');
//     await expect(popup).toBeVisible();
//     await popup.click();
//   } catch(err) {
//     // ignore - sometimes we don't get the popup
//   }

//   await page.getByRole('button', { name: 'À louer' }).click();
//   await page.getByPlaceholder('Commune ou code postal').click();
//   await page.getByPlaceholder('Commune ou code postal').fill('1090');
//   await page.getByText('Jette (1090)').click();
//   await page.getByRole('button', { name: 'Type' }).click();
//   await page.locator('label').filter({ hasText: 'Appartement' }).click();
//   await page.getByRole('button', { name: 'Prix' }).click();
//   await page.locator('li').filter({ hasText: 'Min.€--' }).getByPlaceholder('Entrez ou sélectionnez...').click();
//   await page.locator('li').filter({ hasText: 'Min.€--' }).getByPlaceholder('Entrez ou sélectionnez...').fill('750');
//   await page.locator('li').filter({ hasText: 'Max.€--' }).getByPlaceholder('Entrez ou sélectionnez...').click();
//   await page.locator('li').filter({ hasText: 'Max.€--' }).getByPlaceholder('Entrez ou sélectionnez...').fill('1150');
//   await page.getByRole('button', { name: 'Rechercher' }).click();

//   // await page.getByRole('button', { name: 'Modifier les critères de' }).click();
//   // await page.getByRole('button', { name: 'à vendre' }).click();
//   // await page.getByText('à louer', { exact: true }).click();
//   // await page.locator('app-query-price-selector').getByRole('button', { name: 'Faites votre choix' }).click();
//   // const minPrice = page.locator('li').filter({ hasText: 'Min.€--' }).getByPlaceholder('Entrez ou sélectionnez...');
//   // await minPrice.click();
//   // await minPrice.fill('750');
//   // const maxPrice = page.locator('li').filter({ hasText: 'Max.€--' }).getByPlaceholder('Entrez ou sélectionnez...');
//   // await maxPrice.click();
//   // await maxPrice.fill('1150');
//   // await page.locator('app-query-type-selector').getByRole('button', { name: 'Faites votre choix' }).click();
//   // await page.locator('label').filter({ hasText: 'Appartement' }).click();
//   // await page.getByPlaceholder('Commune ou code postal').click();
//   // await page.getByPlaceholder('Commune ou code postal').fill('1090');
//   // await page.getByText('Jette (1090)').click();
  
//   const mainContent = page.locator("#search-results");

//   expect(mainContent).toBeVisible();

//   // load lazy images
//   await page.evaluate(scroll, {direction: "down", speed: "slow"});

//   const htmlContent = await mainContent.innerHTML();
//   createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

// });
