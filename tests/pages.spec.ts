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
    await context.route(/(.*forter.*)|(.*google.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)|(.*cookie.*)/, route => route.abort());
});

testPage("canzonieregrecanicosalentino", "https://canzonieregrecanicosalentino.net/tour/", page => page.getByRole('article'), scrapesDirectory);
testPage("mariamazzotta", "https://www.mariamazzotta.com/tour-2/", page => page.getByRole('article'), scrapesDirectory);
testPage("maximvengerov", "https://www.maximvengerov.com/events", page => page.locator('.sqs-events-collection-list'), scrapesDirectory);

testPage("action-yoga-mat", "https://www.action.com/fr-be/p/2567007/tapis-de-yoga-kaytan/", page => page.getByRole('region', { name: 'Description de l\'article' }), scrapesDirectory);
testPage("lidl-yoga-mat", "https://www.lidl.be/p/fr-BE/schildkrot-fitness-tapis-de-fitness/p100290653", page => page.locator('article.detail-one > div > div').nth(1), scrapesDirectory);
testPage("lidl-porte-velo", "https://www.lidl.be/p/fr-BE/pied-d-atelier-pour-velo-crivit/p100386064", page => page.locator('article.detail-one > div > div').nth(1), scrapesDirectory);
