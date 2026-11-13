import { test, expect, Page, Locator } from '@playwright/test';
import { ArtifactFormat, ScrapeArtifacts } from './scrape-artifact';

export function testPage(
    artifacts: ScrapeArtifacts,
    title: string,
    url: string,
    locator: string | ((page: Page) => Locator),
    options?: { cookie?: { name: string; value: string; url?: string; }; format?: Extract<ArtifactFormat, 'html' | 'aria'> }
): void {

    test(title, async ({ page, context }, testInfo) => {

        if (options && options.cookie) {
            const cookie = options.cookie;
            await context.addCookies([{ ...cookie, url: cookie.url ?? url }]);
        }

        await page.goto(url);

        const container = typeof locator === 'string' ? page.locator(locator) : locator(page);

        expect(container).toBeAttached();
        await container.scrollIntoViewIfNeeded();
        expect(container).toBeVisible();

        const format = options?.format ?? 'html';

        await artifacts.record({
            name: testInfo.title,
            title,
            url: page.url(),
            content: format === 'aria' ? await container.ariaSnapshot() : await container.innerHTML(),
            format,
        });
    });
}
