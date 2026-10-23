import {test,expect} from '@playwright/test';
for(const width of [390,1440]){
 test('wedding concept gallery filters, loads and prepares enquiry at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.backstage-loader')).toHaveCount(0);
  const gallery=page.locator('#wedding-gallery');
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.locator('.wg-card')).toHaveCount(8);
  for(const card of await gallery.locator('.wg-card').all()){
   await card.scrollIntoViewIfNeeded();
   await expect.poll(()=>card.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  }
  await gallery.getByRole('button',{name:'Christian',exact:true}).click();
  await gallery.getByRole('button',{name:'Semi-premium',exact:true}).click();
  await expect(gallery.locator('.wg-card')).toHaveCount(2);
  await gallery.getByRole('button',{name:'Explore Grace in White'}).click();
  const dialog=page.getByRole('dialog',{name:'Wedding design preview'});
  await expect(dialog).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText('Blush & Candlelight');
  await page.keyboard.press('Escape');
  await expect(gallery.getByRole('button',{name:'Explore Grace in White'})).toBeFocused();
  await gallery.getByRole('button',{name:'Explore Grace in White'}).click();
  await dialog.getByRole('button',{name:'Plan a stage like this'}).click();
  const inquiry=page.getByRole('dialog',{name:'Plan your event'});
  await expect(inquiry).toBeVisible();
  await expect(inquiry.locator('textarea')).toHaveValue(/Grace in White/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
