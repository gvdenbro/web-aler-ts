import { test, expect, Page, TestInfo } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/states'

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
        removeDirectory(scrapesDirectory);
    }
});

test.beforeEach(async ({ context }) => {
    // block cookie consent popup for emirates
    await context.route(/(.*appdynamics.*)|(.*google.*)|(.*one.trust.*)|(.*boxever.*)/, route => route.abort());
});

test('southwest-12-29', async ({ page }, testInfo) => {

    await southwest(page, testInfo, '12/29', 'Before noon', 'SAN', 'PHX');
});

test('southwest-01-04', async ({ page }, testInfo) => {

    await southwest(page, testInfo, '1/04', 'After 6pm', 'PHX', 'LAX');
});

test('southwest-01-05', async ({ page }, testInfo) => {

    await southwest(page, testInfo, '1/05', 'Before noon', 'PHX', 'LAX');
});

test('united-01-04', async ({ page }, testInfo) => {

    await united(page, testInfo, 'Thursday, January 4, 2024', 'Evening', 'PHX', 'LAX');
});

test('united-01-05', async ({ page }, testInfo) => {

    await united(page, testInfo, 'Friday, January 5, 2024', 'Early morning', 'PHX', 'LAX');
});

async function southwest(page: Page, testInfo: TestInfo, date: string, when: 'Before noon' | 'After 6pm' | 'Noon - 6pm' | 'All day', depart: string, arrive: string) {

    await page.goto('https://www.southwest.com/');

    await page.getByLabel('One-way').first().click();

    await page.getByText('Depart Date').click();

    await page.getByText('Depart Date').first().type(date, { delay: 300 })

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

    await gridResultPage.screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });

    await page.evaluate(() => {
        document.querySelectorAll('[data-test="fare-button--business-select"]').forEach(el => el.remove());
        document.querySelectorAll('[data-test="fare-button--anytime"]').forEach(el => el.remove());
        document.querySelectorAll('[data-test="fare-button--wanna-get-away-plus"]').forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div>${await gridResultPage.innerHTML()}<p><img src="${testInfo.title}.png"></img></p></div>`);
}

async function united(page: Page, testInfo: TestInfo, date: string, when: 'Evening' | 'Early morning' | 'Morning' | 'Anytime', depart: string, arrive: string) {

    await page.goto('https://www.united.com/en/be/book-flight/united-one-way');

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

    while (! await page.getByRole('button', { name: date }).isVisible()) {
        await page.getByRole('button', { name: 'Move forward to switch to the next month.' }).click();
    }

    await page.getByRole('button', { name: date }).click();


    await page.getByRole('button', { name: 'Find flights' }).click();

    await expect(page.locator('#flightResults-content')).toHaveText(/.*Displaying .*/, { timeout: 30000 });
    
    const gridResultPage = page.locator('#flightResults-content').getByRole('grid');

    await gridResultPage.screenshot({ path: `${scrapesDirectory}/${testInfo.title}.png` });

    await page.evaluate(() => {
        document.querySelectorAll('[aria-describedby="ECO-BASIC"]').forEach(el => el.remove());
        document.querySelectorAll('[aria-describedby="ECONOMY-UNRESTRICTED"]').forEach(el => el.remove());
        document.querySelectorAll('[aria-describedby="MIN-BUSINESS-OR-FIRST"]').forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div>${await gridResultPage.innerHTML()}<p><img src="${testInfo.title}.png"></img></p></div>`);
}