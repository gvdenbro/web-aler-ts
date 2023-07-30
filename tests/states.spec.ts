import { test, expect } from '@playwright/test';
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

    await page.goto('https://www.southwest.com/');

    await page.getByLabel('One-way').first().click();

    await page.getByText('Depart Date').click();

    await page.getByText('Depart Date').first().type('12/30', {delay: 300})

    await page.getByRole('combobox', { name: 'Depart' }).click();

    await page.getByRole('combobox', { name: 'Depart' }).type('SAN', {delay: 300})

    await page.getByRole('button', { name: 'San Diego, CA - SAN' }).click();

    await page.getByRole('combobox', { name: 'Arrive' }).click();

    await page.getByRole('combobox', { name: 'Arrive' }).type('PHX', {delay: 300})

    await page.getByRole('button', { name: 'Phoenix, AZ - PHX' }).click();

    await page.getByRole('button', { name: 'Search button. In the event of an error, focus will move to the error message.' }).click();

    await page.getByRole('checkbox', { name: 'Display only Nonstop flights.' }).click();

    await page.getByRole('combobox', { name: 'Filter by time of day' }).click();

    await page.getByRole('button', { name: 'Before noon' }).click();

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
});

test.skip('blahblaf-airlines', async ({ page }) => {
    await page.goto('https://www.turkishairlines.com/en-int/index.html');

    await page.getByRole('button', { name: 'I accept all cookies' }).click();

    await expect(page.locator('#originSelector .port-info')).toHaveText(/\S/, {timeout: 30000});
    await expect(page.locator('#portInputTo')).toBeFocused();

    await page.locator('#portInputTo').click();
    await page.locator('#portInputTo').clear();
    await expect(page.locator('#destinationSelector').getByText('See all destinations')).toBeVisible();
    await page.locator('#portInputTo').type('TPE', {delay: 300});
    await page.locator('#destinationSelector').getByText('(TPE)').first().click();
    
    await page.locator('label').filter({ hasText: 'Flexible dates' }).click();
    
    while (! await page.getByText('March 2024').isVisible()) {
        await page.getByTitle('Next').first().click();
    }
    
    await page.getByText('NextMarch 2024MoTuWeThFrSaSu 123456789101112131415161718192021222324252627282930').getByRole('link', { name: '28' }).click()
    
    await page.getByTitle('Next').first().click();
    await expect(page.getByText('April 2024')).toBeVisible();
    
    await page.getByText('NextApril 2024MoTuWeThFrSaSu123456789101112131415161718192021222324252627282930').getByRole('link', { name: '12' }).click();
    
    await page.getByRole('link', { name: 'OK', exact: true }).click();
    
    await page.locator('#portInputFrom').click();
    await page.locator('#portInputFrom').clear();
    
    await expect(page.locator('#originSelector').getByText('See all destinations')).toBeVisible();
    await page.locator('#portInputFrom').type('BRU', {delay: 300});
    await page.locator('#originSelector').getByText('(BRU)').first().click();

    await page.getByRole('button', { name: 'Search flights' }).click();

    const gridResultPage = page.locator('#availabilitybrandedinternational_container div table.table');

    await expect(gridResultPage).toBeVisible({ timeout: 30000 });

    await gridResultPage.screenshot({ path: `${scrapesDirectory}/turkish-airlines.png` });

    await page.evaluate(() => {
        document.querySelectorAll(".price-column-currency").forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/turkish-airlines.md`, `<table>${await gridResultPage.innerHTML()}</table><img src="turkish-airlines.png"></img>`, { handleTables: true });
});