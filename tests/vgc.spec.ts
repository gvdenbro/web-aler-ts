import { test, expect, ElementHandle } from '@playwright/test';

const age: number = ~~((Date.now().valueOf() - new Date('2017-07-20').valueOf()) / 31557600000);

interface Dienst {
  naam: string;
  id: number;
}

const diensten: Array<Dienst> = [
  { naam: 'essegem', id: 109 },
  { naam: 'demarkten', id: 244 },
  { naam: 'nekkersdal', id: 241 },
  { naam: 'dezeyp', id: 276 },
  { naam: 'deplatoo', id: 286 }
]

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

      const htmlContent = await mainContent.innerHTML();

      console.info(htmlContent);

      page.context().clearCookies(); // clear cookies because otherwise we end up in an error because of some bug on the website
      await page.goBack();
    }

  });
}