import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/epso'

interface QueryParameters {
    domainId: number;
    contractTypeId: number;
}

type Queries = {
    [name: string]: QueryParameters;
}

const queries: Queries = {
    "it/contract": { domainId: 490 /*it*/, contractTypeId: 769 /*contract agent*/ },
    "science-research/contract": { domainId: 493  /*science & research*/, contractTypeId: 769 /*contract agent*/ },
    "it/temp": { domainId: 490 /*it*/, contractTypeId: 770 /*temp agent*/ },
    "science-research/temp": { domainId: 490 /*science & research*/, contractTypeId: 770 /*temp agent*/ },
};

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) {
        removeDirectory(scrapesDirectory);
    }
});

for (let name in queries) {

    test(`${name}`, async ({ page }, testInfo) => {

        const query = queries[name];

        await page.goto(`https://eu-careers.europa.eu/en/job-opportunities/open-for-application?field_epso_location_target_id_1=1149&field_epso_domain_target_id_1=${query.domainId}&institution=All&field_epso_type_of_contract_target_id=${query.contractTypeId}`);

        const results = page.locator('.ecl-row');

        await expect(results).toBeVisible();

        const links = results.getByRole('table').getByRole('row').filter({hasText: /FG IV|AD/i}).getByRole('link');

        const jobs = await links.all();

        for (const job of jobs) {

            await job.click();

            const mainContent = page.locator('.ecl-row');

            await expect(mainContent).toBeVisible();

            const idLocator = page.locator(".refs > .field__item, .field--name-field-epso-ref-temp-number > .field__item");

            await expect(idLocator).toHaveText(/\S+/);

            const htmlContent = await mainContent.innerHTML();
            const id = await idLocator.textContent();

            createMarkdown(`${scrapesDirectory}/${testInfo.title}/${id?.trim()}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

            await page.goBack();
        }

    });
}
