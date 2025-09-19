import { test, expect } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { simpleGraph } from './graph-utils';
import { testPageWithInteraction, testPricePage } from './pages-utils';
import { parseLocalizedNumber } from './prices-utils';

const scrapesDirectory: string = './scrapes/bikes'

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
        removeFiles(scrapesDirectory, 'md');
        removeFiles(scrapesDirectory, 'png');
    }
});

test.afterAll(async ({ }) => {
    simpleGraph(`${scrapesDirectory}/prices.csv`, `${scrapesDirectory}/prices.svg`);
});

test.beforeEach(async ({ context }) => {
    await context.route(/(.*forter.*)|(.*google.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)/, route => route.abort());
});

function parseMeridaPrice(priceAsString: string): number {
    const cleanedStr = priceAsString.replace(/[^\d,]/g, '');
    const parts = cleanedStr.split(',');
    const integerPart = parts[0];
    return parseInt(integerPart, 10);
}

test('merida price parsing', async () => {
    const result = parseMeridaPrice("1 599,00 €");
    expect(result).toBe(1599);
});

testPricePage("escape-city-disc-1-2024", "https://www.giant-bicycles.com/fr-be/escape-city-disc-1-2024", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("roam-disc-2-2024", "https://www.giant-bicycles.com/be/roam-disc-2-2024", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("roam-2", "https://www.giant-bicycles.com/fr-be/roam-2", ".price-and-colorcount > .price", scrapesDirectory);
testPricePage("fastroad-sl-3-2022", "https://www.giant-bicycles.com/fr-be/fastroad-sl-3-2022", ".price-and-colorcount > .price", scrapesDirectory);
testPricePage("fastroad-ar-2", "https://www.giant-bicycles.com/fr-be/fastroad-ar-2", ".price-and-colorcount > .price", scrapesDirectory);
testPricePage("sdrbike-escape-1-city-disc", "https://www.sdrbike.be/GEMBLOUX/index.php/hikashop-menu-for-categories-listing/product/31240-giant-escape-1-city-disc-s-sea-sparkle", (page) => page.locator('#sp-component').getByText(/€/).first(), scrapesDirectory);
testPricePage("thrive-2", "https://www.liv-cycling.com/fr-be/thrive-2", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("rove-2", "https://www.liv-cycling.com/fr-be/rove-2", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("allure-rs-1-2023", "https://www.liv-cycling.com/fr-be/allure-rs-1-2023", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("allure-rs-2-2022", "https://www.liv-cycling.com/fr-be/allure-rs-2-2022", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("allure-rs-2-2023", "https://www.liv-cycling.com/fr-be/allure-rs-2-2023", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("allure-rs-2-2024", "https://www.liv-cycling.com/fr-be/allure-rs-2-2024", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("devote-1-2024", "https://www.liv-cycling.com/fr-be/devote-1-2024", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("devote-1-2022", "https://www.liv-cycling.com/fr-be/devote-1-2022", ".price-and-colorcount .price", scrapesDirectory);
testPricePage("silex-400-oak-bork-2026", "https://fr.merida.be/velo+de+gravel/silex-400-oak-bork/2026", "#history__sub .container .lg\\:shrink .font-bold", scrapesDirectory, parseMeridaPrice);
testPricePage("silex-400-warm-slate-grey-2026", "https://fr.merida.be/velo+de+gravel/silex-400-warm-slate-grey/2026", "#history__sub .container .lg\\:shrink .font-bold", scrapesDirectory, parseMeridaPrice);

// testPageWithInteraction("riverside-120-green", "https://www.decathlon.be/fr/p/velo-tout-chemin-riverside-120-enjambement-bas-vert-pastel/_/R-p-323601", async (page) => {
//     await page.getByRole('button', { name: 'Tout refuser' }).click();
//     await page.getByRole('combobox', { name: 'Select your size' }).click();
//     await page.getByRole('option', { name: 'Size S' }).click();
//     return page.locator('.stock-info');
// }, scrapesDirectory);
// testPageWithInteraction("riverside-120-gray", "https://www.decathlon.be/fr/p/velo-tout-chemin-riverside-120-gris-metal/_/R-p-300806", async (page) => {
//     await page.getByRole('button', { name: 'Tout refuser' }).click();
//     await page.getByRole('combobox', { name: 'Select your size' }).click();
//     await page.getByRole('option', { name: 'Size S' }).click();
//     return page.locator('.stock-info');
// }, scrapesDirectory);
