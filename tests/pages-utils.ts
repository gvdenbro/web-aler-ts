import { test, expect, Page, Locator } from '@playwright/test';
import { createMarkdown } from './md-utils';
import { appendPriceAsNumber, appendPriceAsString, parseLocalizedNumber } from './prices-utils';

export function testPage(title: string, url: string, locator: string | ((page: Page) => Locator), outputDirectory: string, options?: {cookie?: {name: string; value: string; url?: string;}, yaml?: boolean}): void {

    test(title, async ({ page, context }, testInfo) => {

        if (options && options.cookie) {
            const cookie = options.cookie;
            if (!cookie.url) {
                cookie.url = url;
            }
            await context.addCookies([cookie]);
        }

        await page.goto(url);

        const container = typeof locator === 'string' ? page.locator(locator) : locator(page);

        expect(container).toBeVisible();

        if (options && options.yaml) {
            const ariaSnapshot = await container.ariaSnapshot();
            const yaml = `- title: ${title}\n- url: ${page.url()}\n${ariaSnapshot}`;
            createMarkdown(`${outputDirectory}/${testInfo.title}.md`, ``, {frontmatter: yaml});
        } 
        else {
            createMarkdown(`${outputDirectory}/${testInfo.title}.md`, `<div><p>${await container.innerHTML()}</p><p><a href="${page.url()}">Source</a></p></div>`);
        }
    });
}

export function testPageWithInteraction(title: string, url: string, locator: ((page: Page) => Promise<Locator>), outputDirectory: string): void {

    test(title, async ({ page }, testInfo) => {

        await page.goto(url);

        const container = await locator(page);

        expect(container).toBeVisible();

        createMarkdown(`${outputDirectory}/${testInfo.title}.md`, `<div><p>${await container.innerHTML()}</p><p><a href="${page.url()}">Source</a></p></div>`);
    });
}

export function testPricePage(title: string, url: string, locator: string | ((page: Page) => Locator), outputDirectory: string, priceParser: (text: string) => number = parseLocalizedNumber): void {

    test(title, async ({ page }, testInfo) => {

        await page.goto(url);

        const container = typeof locator === 'string' ? page.locator(locator) : locator(page);

        expect(container).toBeVisible();

        const price = await container.innerHTML();

        createMarkdown(`${outputDirectory}/${testInfo.title}.md`, `<div><p>${price}</p><p><a href="${page.url()}">Source</a></p></div>`);
        appendPriceAsNumber(`${outputDirectory}/prices.csv`, `${testInfo.title}`, priceParser(price));
    });
}
