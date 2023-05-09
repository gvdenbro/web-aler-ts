import { test, expect, ElementHandle } from '@playwright/test';

// const age: number = ~~((Date.now().valueOf() - new Date('2017-07-20').valueOf()) / 31557600000);
const age: number = 6;

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

    const locator = page.getByRole('link', { name: 'Bekijk' });
    
    await expect.poll(async () => locator.count()).toBeGreaterThan(0);

    const activities = await locator.all();

    for (const activity of activities) {

      await activity.click();

      page.context().clearCookies(); // clear cookies because otherwise we end up in an error because of some bug on the website
      await page.goBack();
    }

  });
}