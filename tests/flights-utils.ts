import {Browser, BrowserContextOptions, TestInfo} from "@playwright/test";
import {appendPriceAsString} from "./prices-utils";
import {ScrapeArtifacts} from "./scrape-artifact";

export async function matrixSavedSearch(browser: Browser, testInfo: TestInfo, artifacts: ScrapeArtifacts, savedSearch: string) {
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

    const cheapestPrice = await page.locator('matrix-result-set-panel').locator('tbody').locator('tr td').first().textContent();

    await artifacts.record({
        name: testInfo.title,
        url: page.url(),
        content: cheapestPrice ?? '',
    });
    appendPriceAsString(`${artifacts.directory}/prices.csv`, `${testInfo.title}`, cheapestPrice);
}
