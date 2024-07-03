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

test('emirates', async ({ page }) => {

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

    while (! await page.getByText('April2025').isVisible()) {
        await page.getByRole('button', { name: 'Next Month' }).click();
    }

    await page.getByRole('button', { name: 'Saturday, 05 April 2025' }).click();
    await page.getByRole('button', { name: 'Next Month' }).click();
    await page.getByRole('button', { name: 'Sunday, 20 April 2025' }).click();
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

    // await expect(page.locator('#fromPort')).toHaveText(/\S/, {timeout: 30000});
    // await expect(page.locator('#toPort')).toBeFocused();

    await page.locator('#toPort').click();
    await page.locator('#toPort').clear();
    // await expect(page.locator('#destinationSelector').getByText('See all destinations')).toBeVisible();
    await page.locator('#toPort').type('TPE', { delay: 300 });
    await page.getByText('(TPE)').first().click();

    await page.locator('#flexibleDates').click();

    while (! await page.getByText('April 2025').isVisible()) {
        // await page.getByTitle('Next').first().click();
        await page.getByRole('button', { name: '›' }).click()
    }

    await page.getByLabel('April 5, 2025').click();

    // await page.getByTitle('Next').first().click();
    // await expect(page.getByText('April 2024')).toBeVisible();
    await page.getByLabel('April 20, 2025').click();

    // await page.getByText('NextApril 2025MoTuWeThFrSaSu123456789101112131415161718192021222324252627282930').getByRole('link', { name: '20' }).click();

    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.locator('#fromPort').click();
    await page.locator('#fromPort').clear();

    // await expect(page.locator('#originSelector').getByText('See all destinations')).toBeVisible();
    await page.locator('#fromPort').type('BRU', { delay: 300 });
    await page.getByText('(BRU)').first().click();

    await page.getByRole('button', { name: 'Search flights' }).click();

    const gridResultPage = page.locator('table');

    await expect(gridResultPage).toBeVisible({ timeout: 30000 });

    await gridResultPage.screenshot({ path: `${scrapesDirectory}/turkish-airlines.png` });

    await page.evaluate(() => {
        document.querySelectorAll(".price-column-currency").forEach(el => el.remove());
    });

    createMarkdown(`${scrapesDirectory}/turkish-airlines.md`, `<table>${await gridResultPage.innerHTML()}</table><img src="turkish-airlines.png"></img>`, { handleTables: true });
});

test('singapore-airlines', async ({ page, context }) => {

    await page.setViewportSize({ width: 1920, height: 1080 });

    context.addCookies([
        { name: "ALLOW_TO_USE_COOKIES", value: "ALLOWED", domain: "www.singaporeair.com", path: "/" },
        { name: "AKAMAI_SAA_LOCALE_COOKIE", value: "en_UK", domain: "www.singaporeair.com", path: "/" },
        { name: "AKAMAI_SAA_COUNTRY_COOKIE", value: "BE", domain: "www.singaporeair.com", path: "/" }
    ]);

    await page.goto('https://www.singaporeair.com/en_UK/be/home#/book/bookflight');

    await page.getByLabel('From').click();
    await page.getByLabel('From').clear();
    await page.getByLabel('From').fill('BRU');
    await page.getByText('BRU', { exact: true }).click();

    await page.getByLabel('To').click();
    await page.getByLabel('To').clear();
    await page.getByLabel('To').fill('TPE');
    await page.getByText('TPE', { exact: true }).click();

    await page.getByLabel('Depart Date').click();

    while (! await page.getByText('april 2025').isVisible()) {
        await page.locator('.right').first().click();
    }

    await page.getByText('5No flights operating', { exact: true }).nth(1).click();
    await page.getByText('20No flights operating').nth(1).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await page.getByRole('button', { name: 'Search' }).click();

    await page.locator('.select-flight__flight-block').first();
});