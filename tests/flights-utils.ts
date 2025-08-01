import {Browser, BrowserContextOptions, TestInfo} from "@playwright/test";
import {createMarkdown} from "./md-utils";
import {appendPriceAsString} from "./prices-utils";

export async function matrixSavedSearch(browser: Browser, testInfo: TestInfo, scrapesDirectory: string, savedSearch: string) {
    const contextOptions: BrowserContextOptions = {
        storageState: {
            cookies: [],
            origins: [
                {
                    origin: 'https://matrix.itasoftware.com',
                    localStorage: [
                        {
                            name: 'matrix.v5.savedSearches',
                            value: savedSearch
                        }
                    ]
                }
            ]
        }
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    await page.goto("https://matrix.itasoftware.com/search");

    await page.locator('mat-chip-grid').locator('mat-chip-row').first().click();

    await page.getByRole('button', {name: 'Search'}).click();

    const cheapestPrice = await page.locator('matrix-carrier-stops-widget').locator('mat-row').locator('mat-cell.is-min').first().textContent();

    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div>${cheapestPrice}</div>`);
    appendPriceAsString(`${scrapesDirectory}/prices.csv`, `${testInfo.title}`, cheapestPrice);
}
