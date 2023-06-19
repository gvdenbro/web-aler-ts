import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/epso'

interface QueryParameters {
    gradeId: number;
    domainId: number;
    contractTypeId: number;
}

type Queries = {
    [name: string]: QueryParameters;
}

const fg4 = 1303;
const ad5 = 1279;
const ad6 = 1280;
const ad7 = 1281;
const ad8 = 1282;
const ad9 = 1283;

const queries: Queries = {
    "it/fg4": { gradeId: fg4, domainId: 490 /*it*/, contractTypeId: 769 /*contract agent*/ },
    "science-research/fg4": { gradeId: fg4, domainId: 493  /*science & research*/, contractTypeId: 769 /*contract agent*/ },
    "it/ad5": { gradeId: ad5, domainId: 490 /*it*/, contractTypeId: 770 /*temp agent*/ },
    "science-research/ad5": { gradeId: ad5, domainId: 490 /*science & research*/, contractTypeId: 770 /*temp agent*/ },
    "it/ad6": { gradeId: ad6, domainId: 490 /*it*/, contractTypeId: 770 /*temp agent*/ },
    "science-research/ad6": { gradeId: ad6, domainId: 490 /*science & research*/, contractTypeId: 770 /*temp agent*/ },
    "it/ad7": { gradeId: ad7, domainId: 490 /*it*/, contractTypeId: 770 /*temp agent*/ },
    "science-research/ad7": { gradeId: ad7, domainId: 490 /*science & research*/, contractTypeId: 770 /*temp agent*/ },
    "it/ad8": { gradeId: ad8, domainId: 490 /*it*/, contractTypeId: 770 /*temp agent*/ },
    "science-research/ad8": { gradeId: ad8, domainId: 490 /*science & research*/, contractTypeId: 770 /*temp agent*/ },
    "it/ad9": { gradeId: ad9, domainId: 490 /*it*/, contractTypeId: 770 /*temp agent*/ },
    "science-research/ad9": { gradeId: ad9, domainId: 490 /*science & research*/, contractTypeId: 770 /*temp agent*/ },
};

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) {
        removeDirectory(scrapesDirectory);
    }
});

for (let name in queries) {

    test(`${name}`, async ({ page }, testInfo) => {

        const query = queries[name];

        await page.goto(`https://epso.europa.eu/en/job-opportunities/open-for-application?field_epso_domain=${query.domainId}&field_epso_location_target_id_1=1149&institution=All&field_epso_grade_target_id=${query.gradeId}&field_epso_type_of_contract_target_id=${query.contractTypeId}`);

        const results = page.locator('.ecl-row');

        await expect(results).toBeVisible();

        const links = results.getByRole('table').getByRole('link');

        const jobs = await links.all();

        for (const job of jobs) {

            await job.click();

            const mainContent = page.locator('.ecl-row');

            await expect(mainContent).toBeVisible();

            const idLocator = page.locator(".field--name-field-epso-ref-temp-number > .field__item");

            await expect(idLocator).toHaveText(/\S+/);

            const htmlContent = await mainContent.innerHTML();
            const id = await idLocator.textContent();

            createMarkdown(`${scrapesDirectory}/${testInfo.title}/${id?.trim()}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

            await page.goBack();
        }

    });
}
