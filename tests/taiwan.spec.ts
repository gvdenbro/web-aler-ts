import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/taiwan'

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
        removeDirectory(scrapesDirectory);
    }
});

test.beforeEach(async ({ context }) => {
    // block cookie consent popup for emirates
    await context.route(/(.*appdynamics.*)|(.*google.*)|(.*one.trust.*)|(.*boxever.*)/, route => route.abort());
});

test.skip('emirates', async ({ page }) => {

    await page.goto('https://www.emirates.com/be/english/');

    await page.getByRole('tabpanel', { name: 'Search flights' }).locator('button[name="clear Departure airport"]').click();
    // make sure the autocomplete list appears for departure
    await expect(page.getByRole('tabpanel', { name: 'Search flights' }).getByText('ABJ').first()).toBeVisible();

    await page.getByRole('textbox', { name: 'Departure airport' }).type('(BRU)', { delay: 100 });// adding parenthesis cause sometimes start typing too early
    await page.getByRole('listbox', { name: 'All locations' }).getByText('BRU', { exact: true }).click();

    // make sure the autocomplete list appears for arrival
    await expect(page.getByRole('listbox', { name: 'All locations' }).getByText('ABJ')).toBeVisible();

    await page.getByRole('textbox', { name: 'Arrival airport' }).type('TPE', { delay: 100 });
    await page.getByText('TPE').click();
    await page.getByLabel('My dates are flexible (-/+ 3 days)').check();

    while (! await page.getByText('March2024').isVisible()) {
        await page.getByRole('button', { name: 'Next Month' }).click();
    }

    await page.getByRole('button', { name: 'Thursday, 28 March 2024' }).click();
    await page.getByRole('button', { name: 'Next Month' }).click();
    await page.getByRole('button', { name: 'Friday, 12 April 2024' }).click();
    await page.getByRole('button', { name: 'Search flights' }).click();

    const gridResultPage = page.getByText('Your trip, Brussels - Taipei (Return) Outbound BRU - TPE Economy Outbound Brusse');

    await expect(gridResultPage).toBeVisible({ timeout: 30000 });

    await gridResultPage.screenshot({ path: `${scrapesDirectory}/emirates.png` });

    await page.evaluate(() => {
        document.querySelectorAll(".visually-hidden").forEach(el => el.remove());
        document.querySelectorAll(".carrier-imposed-span").forEach(el => el.remove());
        document.querySelectorAll("table img").forEach(el => el.remove());
        document.querySelectorAll(".from-txt").forEach(el => el.remove());
        document.querySelectorAll(".masthead-converted-type").forEach(el => el.remove());
        document.querySelectorAll(".lowest-price").forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/emirates.md`, `<table>${await gridResultPage.locator("table").innerHTML()}</table><img src="emirates.png"></img>`, { handleTables: true });
});

test.skip('turkish-airlines', async ({ page }) => {
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