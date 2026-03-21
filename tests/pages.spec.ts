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
testPage("maximvengerov", "https://www.maximvengerov.com/events", page => page.locator('.sqs-events-collection-list'), scrapesDirectory, {yaml: true});
testPage("epso", "https://eu-careers.europa.eu/en/upcoming-selection-procedures", "#block-mainpagecontent", scrapesDirectory, {yaml: true});
testPage("piepers", "https://jnm.be/nl/activiteiten?group=Piepers&department=jnm-brussel", ".col-lg-8", scrapesDirectory);
testPage("bozar-live-magazine", "https://www.bozar.be/en/search?contentType=all&searchQuery=bozar%20live%20magazine", ".search-page__results-list", scrapesDirectory);
testPage("coolblue-yamaha-ns-f-51-black", "https://www.coolblue.be/en/product/644101/yamaha-ns-f-51-black-per-pair.html", 'form[class^="main-"]', scrapesDirectory, {cookie: {name: "cookie-preferences", value: "eyJ2ZXJzaW9uIjoiMjAyMzExMDciLCJmdW5jdGlvbmFsIjp0cnVlLCJhbmFseXRpY2FsIjpmYWxzZSwibWFya2V0aW5nIjpmYWxzZX0%3D"}, yaml: true});
testPage("bronks-atelier", "https://www.bronks.be/nl/ateliers/jaarwerking", "main", scrapesDirectory, {yaml: true})
