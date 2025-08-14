import { test, expect, Page, Locator } from '@playwright/test';
import { createMarkdown } from './md-utils';
import { appendPriceAsString } from './prices-utils';

export function testPage(title: string, url: string, locator: string | ((page: Page) => Locator), outputDirectory: string): void {

    test(title, async ({ page }, testInfo) => {

        await page.goto(url);

        const container = typeof locator === 'string' ? page.locator(locator) : locator(page);

        expect(container).toBeVisible();

        createMarkdown(`${outputDirectory}/${testInfo.title}.md`, `<div><p>${await container.innerHTML()}</p><p><a href="${page.url()}">Source</a></p></div>`);
    });
}

export function testPricePage(title: string, url: string, locator: string | ((page: Page) => Locator), outputDirectory: string): void {

    test(title, async ({ page }, testInfo) => {

        await page.goto(url);

        const container = typeof locator === 'string' ? page.locator(locator) : locator(page);

        expect(container).toBeVisible();

        const price = await container.innerHTML();

        createMarkdown(`${outputDirectory}/${testInfo.title}.md`, `<div><p>${price}</p><p><a href="${page.url()}">Source</a></p></div>`);
        appendPriceAsString(`${outputDirectory}/prices.csv`, `${testInfo.title}`, price);
    });
}
