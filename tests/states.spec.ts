import { test, expect, Page, TestInfo } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { createMarkdown } from './md-utils';
import { appendPriceAsString } from './prices-utils';
import { generateSvg } from './graph-utils';

const scrapesDirectory: string = './scrapes/states'

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
                point: true
            },
            encoding: {
                x: { field: 'timestamp', type: 'temporal', title: 'Time' },
                y: { field: 'price', type: 'quantitative', title: 'Price' },
                color: {
                    field: 'identifier', type: 'nominal', legend: {
                        labelLimit: 320
                    }
                },
                row: { field: "flightDate", type: "nominal" },
                column: { field: "company", type: "nominal" }
            },
            config: {
                font: "Liberation Mono"
            }
        }
    });
});

test.beforeEach(async ({ context }) => {
    // block cookie consent popup for emirates
    await context.route(/(.*appdynamics.*)|(.*google.*)|(.*one.trust.*)|(.*boxever.*)/, route => route.abort());
});

test('southwest-12-28-san-las', async ({ page }, testInfo) => {

    await southwest(page, testInfo, new Date(Date.UTC(2023, 11, 28)), 'Before noon', 'SAN', 'LAS');
});

test.skip('united-12-28-morning-san-las', async ({ page }, testInfo) => {

    await united(page, testInfo, new Date(Date.UTC(2023, 11, 28)), 'Morning', 'SAN', 'LAS');
});

test.skip('united-12-28-early-morning-san-las', async ({ page }, testInfo) => {

    await united(page, testInfo, new Date(Date.UTC(2023, 11, 28)), 'Early morning', 'SAN', 'LAS');
});

test('southwest-01-04-after6pm-las-lax', async ({ page }, testInfo) => {

    await southwest(page, testInfo, new Date(Date.UTC(2024, 0, 4)), 'After 6pm', 'LAS', 'LAX');
});

test('united-01-04-san-las', async ({ page }, testInfo) => {

    await united(page, testInfo, new Date(Date.UTC(2024, 0, 4)), 'Evening', 'LAS', 'LAX');
});

async function southwest(page: Page, testInfo: TestInfo, date: Date, when: 'Before noon' | 'After 6pm' | 'Noon - 6pm' | 'All day', depart: string, arrive: string) {

    await page.goto('https://www.southwest.com/');

    await page.getByLabel('One-way').first().click();

    await page.getByText('Depart Date').click();

    const month = date.getMonth() + 1;
    // '12/29', '1/04', '1/05'
    const day = date.getDate().toString().padStart(2, "0");

    await page.getByText('Depart Date').first().type(`${month}/${day}`, { delay: 300 })

    await page.getByRole('combobox', { name: 'Depart' }).click();

    await page.getByRole('combobox', { name: 'Depart' }).type(depart, { delay: 300 })

    await page.getByRole('button', { name: depart }).first().click();

    await page.getByRole('combobox', { name: 'Arrive' }).click();

    await page.getByRole('combobox', { name: 'Arrive' }).type(arrive, { delay: 300 })

    await page.getByRole('button', { name: arrive }).first().click();

    await page.getByRole('button', { name: 'Search button. In the event of an error, focus will move to the error message.' }).click();

    await page.getByRole('checkbox', { name: 'Display only Nonstop flights.' }).click();

    await page.getByRole('combobox', { name: 'Filter by time of day' }).click();

    await page.getByRole('button', { name: when }).click();

    // air-search-results-matrix-0
    const gridResultPage = page.locator('#air-search-results-matrix-0');

    await expect(gridResultPage).toBeVisible({ timeout: 30000 });

    // await gridResultPage.screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
    // <p><img src="${testInfo.title}.png"></img></p>

    await page.evaluate(() => {
        document.querySelectorAll('[data-test="fare-button--business-select"]').forEach(el => el.remove());
        document.querySelectorAll('[data-test="fare-button--anytime"]').forEach(el => el.remove());
        document.querySelectorAll('[data-test="fare-button--wanna-get-away-plus"]').forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div>${await gridResultPage.innerHTML()}</div>`);

    const locators = await gridResultPage.getByRole('listitem').all();

    for (const locator of locators) {

        const flightNumber = await locator.locator('.flight-numbers--flight-number').locator('.actionable--text').textContent();
        const fare = await locator.locator('.select-detail--fare').locator('.actionable--text').locator('.currency-box').locator('.swa-g-screen-reader-only').textContent();
        appendPriceAsString(`${scrapesDirectory}/prices.csv`, `${testInfo.title}-${flightNumber}`, fare, ["southwest", flightNumber, date.toISOString().substring(0, 10), depart, arrive]);
    }
}

async function united(page: Page, testInfo: TestInfo, date: Date, when: 'Evening' | 'Early morning' | 'Morning' | 'Anytime', depart: string, arrive: string) {

    await page.goto('https://www.united.com/en/us/book-flight/united-one-way');

    await page.getByLabel('Nonstop only').click();

    await page.getByRole('combobox', { name: 'departing' }).clear();

    await page.getByRole('combobox', { name: 'departing' }).type(depart, { delay: 300 })

    await page.getByRole('button', { name: depart }).first().click();

    await page.getByRole('combobox', { name: 'destination' }).clear();

    await page.getByRole('combobox', { name: 'destination' }).type(arrive, { delay: 300 })

    await page.getByRole('button', { name: arrive }).first().click();

    await page.getByRole('combobox', { name: 'Time of day' }).selectOption(when);

    await page.getByPlaceholder('Depart').clear();
    await page.getByPlaceholder('Depart').click();

    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    while (! await page.getByRole('button', { name: formattedDate }).isVisible()) {
        await page.getByRole('button', { name: 'Move forward to switch to the next month.' }).click();
    }

    await page.getByRole('button', { name: formattedDate }).click();


    await page.getByRole('button', { name: 'Find flights' }).click();

    await expect(page.locator('#flightResults-content')).toHaveText(/.*Displaying .*/, { timeout: 30000 });

    const gridResultPage = page.locator('#flightResults-content').getByRole('grid');

    // await gridResultPage.screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });
    // <p><img src="${testInfo.title}.png"></img></p>

    await page.evaluate(() => {
        document.querySelectorAll('[aria-describedby="ECO-BASIC"]').forEach(el => el.remove());
        document.querySelectorAll('[aria-describedby="ECONOMY-UNRESTRICTED"]').forEach(el => el.remove());
        document.querySelectorAll('[aria-describedby="ECONOMY-MERCH-EPLUS"]').forEach(el => el.remove());
        document.querySelectorAll('[aria-describedby="MIN-BUSINESS-OR-FIRST"]').forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div>${await gridResultPage.innerHTML()}</div>`);

    const locators = await gridResultPage.getByRole('row').filter({ hasText: "NONSTOP" }).filter({hasNotText: "Operated by JSX Air"}).all();

    for (const locator of locators) {

        const flightNumber = await locator.locator('css=[class^=app-components-Shopping-FlightBaseCard-styles__descriptionStyle]').locator('[aria-hidden="true"]').textContent();
        const fare = await locator.locator('css=[class^=app-components-Shopping-PriceCard-styles__priceValue]').first().textContent();

        appendPriceAsString(`${scrapesDirectory}/prices.csv`, `${testInfo.title}-${flightNumber}`, fare, ["united", flightNumber, date.toISOString().substring(0, 10), depart, arrive]);
    }
}