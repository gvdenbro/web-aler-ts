import { test, expect } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { createMarkdown } from './md-utils';

const scrapesDirectory: string = './scrapes/apis'

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
      removeFiles(scrapesDirectory, 'md');
      removeFiles(scrapesDirectory, 'png');
    }
  });

test('digi belgium available', async ({ request }, testInfo) => {

    const response = await request.put('https://api.digi-belgium.be/v1/address/infrastructure', {
      data: {
        cityId: 21010,
        countryId: 99,
        streetId: 63259,
        fttbAddressId: "E6C156B2-095A-EF11-A2CB-001DD8B7203E",
        postalCode: "1090",
        city: "Jette",
        street:"Esseghemstraat",
        number:"32",
        box:"",
        platform:"web",
        email:"blahblah@car.net",
        agree:false
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const jsonResponse = await response.text();

    expect(jsonResponse).toBeTruthy();

    createMarkdown(`${scrapesDirectory}/${testInfo.title}.md`, `<div><pre><code>${jsonResponse}</code></pre></div>`);
  });