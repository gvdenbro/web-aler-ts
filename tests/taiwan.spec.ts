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

/*
test("flights to taiwan april 2024", async ({ page }) => {

    await page.goto("https://matrix.itasoftware.com/flights?search=eyJ0eXBlIjoicm91bmQtdHJpcCIsInNsaWNlcyI6W3sib3JpZ2luIjpbIkJSVSJdLCJkZXN0IjpbIlRQRSJdLCJkYXRlcyI6eyJzZWFyY2hEYXRlVHlwZSI6InNwZWNpZmljIiwiZGVwYXJ0dXJlRGF0ZSI6IjIwMjQtMDMtMzAiLCJkZXBhcnR1cmVEYXRlVHlwZSI6ImRlcGFydCIsImRlcGFydHVyZURhdGVNb2RpZmllciI6IjAiLCJkZXBhcnR1cmVEYXRlUHJlZmVycmVkVGltZXMiOltdLCJyZXR1cm5EYXRlIjoiMjAyNC0wNC0xNCIsInJldHVybkRhdGVUeXBlIjoiYXJyaXZlIiwicmV0dXJuRGF0ZU1vZGlmaWVyIjoiMCIsInJldHVybkRhdGVQcmVmZXJyZWRUaW1lcyI6W119fV0sIm9wdGlvbnMiOnsiY2FiaW4iOiJDT0FDSCIsInN0b3BzIjoiMSIsImV4dHJhU3RvcHMiOiIwIiwiYWxsb3dBaXJwb3J0Q2hhbmdlcyI6ImZhbHNlIiwic2hvd09ubHlBdmFpbGFibGUiOiJ0cnVlIn0sInBheCI6eyJhZHVsdHMiOiIyIiwiY2hpbGRyZW4iOiIxIn0sInNvbHV0aW9uIjp7InNlc3Npb25JZCI6InM4STBkcEFIcmg2akw0bnpCRFVBcDQ1WUoiLCJBZCI6dHJ1ZSwibmgiOiIwZkltemU3Z204SzdTUk9EcGJmS0lFVSIsIkdpIjpudWxsfX0%3D");

    await expect(page.getByRole('columnheader', { name: 'Price Filter' })).toBeVisible({ timeout: 60_000 });

    await page.screenshot({ path: `${scrapesDirectory}/screenshot.png` });
});
*/

test('emirates', async ({ page }) => {

    await page.goto('https://www.emirates.com/be/english/');

    await page.getByRole('tabpanel', { name: 'Search flights' }).locator('button[name="clear Departure airport"]').click();
    // make sure the autocomplete list appears for departure
    await expect(page.getByRole('tabpanel', { name: 'Search flights' }).getByText('ABJ').first()).toBeVisible();

    await page.getByRole('textbox', { name: 'Departure airport' }).type('BRU', { delay: 100 });
    await page.getByRole('tabpanel', { name: 'Search flights' }).getByRole('list').getByText('BRU', { exact: true }).click();

    // make sure the autocomplete list appears for arrival
    await expect(page.getByRole('tabpanel', { name: 'Search flights' }).getByRole('list').getByText('ABJ')).toBeVisible();

    await page.getByRole('textbox', { name: 'Arrival airport' }).type('TPE', { delay: 100 });
    await page.getByText('TPE').click();
    await page.getByLabel('My dates are flexible (-/+ 3 days)').check();

    while (! await page.getByText('March2024').isVisible()) {
        await page.getByRole('link', { name: 'Next Month' }).click();
    }

    await page.getByRole('cell', { name: '30 Mar 24' }).getByText('30').click();
    await page.getByRole('link', { name: 'Next Month' }).click();
    await page.getByRole('cell', { name: '14 Apr 24' }).getByText('14').click();
    await page.getByRole('button', { name: 'Search flights' }).click();

    const gridResultPage = page.getByText('Your trip, Brussels - Taipei (Return) Outbound BRU - TPE Economy Outbound Brusse');

    await expect(gridResultPage).toBeVisible({ timeout: 30000 });

    await page.evaluate(() => {
        document.querySelectorAll(".visually-hidden").forEach(el => el.remove());
        document.querySelectorAll(".carrier-imposed-span").forEach(el => el.remove());
    });
    
    createMarkdown(`${scrapesDirectory}/emirates.md`, `<table>${await gridResultPage.locator("table").innerHTML()}</table><img src="emirates.png"></img>`, {handleTables: true});
    await gridResultPage.screenshot({ path: `${scrapesDirectory}/emirates.png` });
});