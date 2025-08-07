import { test } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { testPage } from './pages-utils';

const scrapesDirectory: string = './scrapes/pages'

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
        removeFiles(scrapesDirectory, 'md');
        removeFiles(scrapesDirectory, 'png');
    }
});

test.beforeEach(async ({ context }) => {
    await context.route(/(.*forter.*)|(.*google.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)/, route => route.abort());
});

testPage("canzonieregrecanicosalentino", "https://canzonieregrecanicosalentino.net/tour/", page => page.getByRole('article'), scrapesDirectory);
testPage("mariamazzotta", "https://www.mariamazzotta.com/tour-2/", page => page.getByRole('article'), scrapesDirectory);
testPage("maximvengerov", "https://www.maximvengerov.com/events", page => page.locator('.sqs-events-collection-list'), scrapesDirectory);
