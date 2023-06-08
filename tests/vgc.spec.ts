import { test, expect } from '@playwright/test';
import { removeDirectory } from './fs-utils';
import { createMarkdown } from './md-utils';

const age: number = ~~((Date.now().valueOf() - new Date('2017-07-20').valueOf()) / 31557600000);
const vgcScrapesDirectory: string = './scrapes/vgc'

interface Dienst {
  naam: string;
  id: number;
}

const diensten: Array<Dienst> = [
  { naam: 'essegem', id: 109 },
  { naam: 'demarkten', id: 244 },
  { naam: 'nekkersdal', id: 241 },
  { naam: 'dezeyp', id: 276 },
  { naam: 'deplatoo', id: 286 },
  { naam: 'derinck', id: 281 },
]

test.beforeAll(async ({ }, testInfo) => {
  if (!testInfo.retry) { // on failure workers can be restarted and then beforeAll called again which might mess up the directory cleaning
    removeDirectory(vgcScrapesDirectory);
  }
});

for (const dienst of diensten) {

  test(`vgc tickets [${dienst.naam}]`, async ({ page }) => {

    await page.goto(`https://tickets.vgc.be/activity/index?&vrijeplaatsen=1&Age%5B%5D=${age - 1}%2C${age + 1}&entity=${dienst.id}`);

    const results = page.locator('#wall');

    await expect(results).toBeVisible();

    const links = results.getByRole('link');

    const activities = await links.all();

    for (const activity of activities) {

      await activity.click();

      const mainContent = await page.locator('#main-content');

      await expect(mainContent).toBeVisible();

      const ogUrl = await page.locator("meta[property='og:url']").getAttribute("content");

      expect(ogUrl).toBeDefined();

      await page.evaluate(() => {
        document.querySelectorAll(".badge").forEach(el => el.remove());
      });

      const htmlContent = await mainContent.innerHTML();

      createMarkdown(`${vgcScrapesDirectory}/${dienst.naam}/${ogUrl}.md`, `<div><div>${htmlContent}</div><p><a href="${page.url()}">Source</a></p></div>`);

      page.context().clearCookies(); // clear cookies because otherwise we end up in an error because of some bug on the website
      await page.goBack();
    }

  });
}