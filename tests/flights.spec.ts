import { test } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { simpleGraph } from './graph-utils';
import { matrixSavedSearch } from "./flights-utils";

const scrapesDirectory: string = './scrapes/flights'

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
        removeFiles(scrapesDirectory, 'md');
        removeFiles(scrapesDirectory, 'png');
    }
});

test.afterAll(async ({ }) => {
    simpleGraph(`${scrapesDirectory}/prices.csv`, `${scrapesDirectory}/prices.svg`);
});

test.beforeEach(async ({ context }) => {
    await context.route(/(.*forter.*)|(.*google.*)|(.*amplitude.*)|(.*powerreviews.*)|(.*cquotient.*)|(.*dynamicyield.*)|(.*yottaa.*)/, route => route.abort());
});

test.skip("cambodia-xmas", async ({ browser }, testInfo) => {

    const savedSearch = '[{"type":"round-trip","slices":[{"origin":["BRU"],"dest":["PNH"],"dates":{"searchDateType":"specific","departureDate":"2025-12-24","departureDateType":"depart","departureDateModifier":"1","departureDatePreferredTimes":[],"duration":"7","returnDate":"2026-01-04","returnDateType":"arrive","returnDateModifier":"10","returnDatePreferredTimes":[]}}],"options":{"cabin":"COACH","stops":"1","extraStops":"0","allowAirportChanges":"false","showOnlyAvailable":"true"},"pax":{"adults":"2","children":"1"}}]';

    await matrixSavedSearch(browser, testInfo, scrapesDirectory, savedSearch);
});

test.skip("japan-easter", async ({ browser }, testInfo) => {

    const savedSearch = '[{"type":"round-trip","slices":[{"origin":["BRU"],"dest":["TYO","OSA"],"routing":"","ext":"","routingRet":"","extRet":"","dates":{"searchDateType":"specific","departureDate":"2026-04-04","departureDateType":"depart","departureDateModifier":"1","departureDatePreferredTimes":[],"returnDate":"2026-04-19","returnDateType":"arrive","returnDateModifier":"10","returnDatePreferredTimes":[]}}],"options":{"cabin":"COACH","stops":"1","extraStops":"1","allowAirportChanges":"false","showOnlyAvailable":"true"},"pax":{"adults":"2","children":"1"}}]';

    await matrixSavedSearch(browser, testInfo, scrapesDirectory, savedSearch);
});
