import { test, expect } from '@playwright/test';
import { removeFiles } from './fs-utils';
import { scrapeArtifacts } from './scrape-artifact';

const scrapesDirectory: string = './scrapes/apis'
const artifacts = scrapeArtifacts(scrapesDirectory);
const digiInfrastructureUrl = 'https://api.digi-belgium.be/v1/address/infrastructure';

test.beforeAll(async ({ }, testInfo) => {
    if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
      removeFiles(scrapesDirectory, 'md');
      removeFiles(scrapesDirectory, 'png');
    }
  });

test('digi belgium available', async ({ request }, testInfo) => {

    const response = await request.put(digiInfrastructureUrl, {
      data: {
        cityId: 21010,
        countryId: 99,
        streetId: 63259,
        fttbAddressId: "E6C156B2-095A-EF11-A2CB-001DD8B7203E",
        postalCode: "1090",
        city: "Jette",
        street:"Esseghemstraat",
        number:"30",
        box:"",
        platform:"web",
        email:"blahblah@car.net",
        agree:false
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    const jsonResponse = await response.json();

    expect(jsonResponse).toBeTruthy();
    
    const replacer = (key, value) => {
      if (key === 'appLocalTimestamp' || key === 'appLocalDatetime') {
        return undefined; // Exclude these properties
      }
      return value; // Include all other properties
    };

    await artifacts.record({
      name: testInfo.title,
      url: digiInfrastructureUrl,
      content: `<pre><code>${JSON.stringify(jsonResponse, replacer, 2)}</code></pre>`,
    });
  });
