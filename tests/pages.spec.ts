import { test } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { testPage } from './pages-utils';
import { scrapeArtifacts } from './scrape-artifact';

const scrapesDirectory: string = './scrapes/pages'
const artifacts = scrapeArtifacts(scrapesDirectory);

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
        removeFiles(scrapesDirectory, 'md');
        removeFiles(scrapesDirectory, 'png');
    }
});
//https://shared.mediahuis.be/cxense/cxense.nostalgie.min.js
test.beforeEach(async ({ context }) => {
    await context.route(/(.*shared\.mediahuis\.be.*)|(.*forter.*)|(.*google.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)|(.*cookie.*)/, route => route.abort());
});

// testPage(artifacts, "canzonieregrecanicosalentino", "https://canzonieregrecanicosalentino.net/tour/", page => page.getByRole('article'));
testPage(artifacts, "mariamazzotta", "https://www.mariamazzotta.com/tour-2/", page => page.getByRole('article'));
testPage(artifacts, "maximvengerov", "https://www.maximvengerov.com/events", page => page.locator('.sqs-events-collection-list'), {format: 'aria'});
testPage(artifacts, "epso", "https://eu-careers.europa.eu/en/upcoming-selection-procedures", "#block-mainpagecontent", {format: 'aria'});
testPage(artifacts, "piepers", "https://jnm.be/nl/activiteiten?group=Piepers&department=jnm-brussel", ".col-lg-8");
//testPage(artifacts, "bozar-live-magazine", "https://www.bozar.be/en/search?contentType=all&searchQuery=bozar%20live%20magazine", ".search-page__results-list");
// testPage(artifacts, "coolblue-yamaha-ns-f-51-black", "https://www.coolblue.be/en/product/644101/yamaha-ns-f-51-black-per-pair.html", 'form[class^="main-"]', {cookie: {name: "cookie-preferences", value: "eyJ2ZXJzaW9uIjoiMjAyMzExMDciLCJmdW5jdGlvbmFsIjp0cnVlLCJhbmFseXRpY2FsIjpmYWxzZSwibWFya2V0aW5nIjpmYWxzZX0%3D"}, format: 'aria'});
// testPage(artifacts, "bronks-atelier", "https://www.bronks.be/nl/ateliers/jaarwerking", "main", {format: 'aria'})
// testPage(artifacts, "nostalgie-halloween", "https://www.nostalgie.be/parcourshalloween", "main", {format: 'aria'})
testPage(artifacts, "mat", "https://kurma-yoga.com/nl/product/core-black-yogamat/?attribute_pa_size=200-cm-x-80-cm-6-5-mm-ca-4-kg-nl","form.cart .woocommerce-variation-price", {format: 'aria'});
