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

test('southwest-12-30', async ({ page }, testInfo) => {

    await southwest(page, testInfo, '12/30', 'Before noon', 'SAN', 'PHX');
});

test('southwest-01-04', async ({ page }, testInfo) => {
    
    await southwest(page, testInfo, '1/04', 'After 6pm', 'LAS', 'LAX');
});

test('southwest-01-05', async ({ page }, testInfo) => {
    
    await southwest(page, testInfo, '1/05', 'Before noon', 'LAS', 'LAX');
});

async function southwest(page: Page, testInfo: TestInfo, date: string, when: 'Before noon' | 'After 6pm' | 'Noon - 6pm' | 'All day', depart: string, arrive: string) {

    await page.goto('https://www.southwest.com/');

    await page.getByLabel('One-way').first().click();

    await page.getByText('Depart Date').click();

    await page.getByText('Depart Date').first().type(date, {delay: 300})

    await page.getByRole('combobox', { name: 'Depart' }).click();

    await page.getByRole('combobox', { name: 'Depart' }).type(depart, {delay: 300})

    await page.getByRole('button', { name: depart }).first().click();

    await page.getByRole('combobox', { name: 'Arrive' }).click();

    await page.getByRole('combobox', { name: 'Arrive' }).type(arrive, {delay: 300})

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