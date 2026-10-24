import {test,expect} from '@playwright/test';
for(const [width,height] of [[320,568],[390,844],[430,932]]) {
 test(`mobile readable typography, usable controls and no overlapping hero at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.goto('/');
  await expect(page.locator('.is-ready')).toBeAttached();
  await expect(page.locator('.event-world')).toHaveCount(2);
  const font=selector=>page.locator(selector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  expect(await font('.world-heading h1')).toBeGreaterThanOrEqual(29);
  expect(await font('.world-heading > p')).toBeGreaterThanOrEqual(11);
  const image=await page.locator('.stage-frame').boundingBox();
  const text=await page.locator('.world-heading').boundingBox();
  const controls=await page.locator('.hero-bottom').boundingBox();
  expect(text.y).toBeGreaterThan(image.y+image.height);
  expect(text.y+text.height).toBeLessThan(controls.y);
  for(const selector of ['.menu-button','.sound-toggle','.scroll-cue']) expect((await page.locator(selector).first().boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.locator('.event-world').first().scrollIntoViewIfNeeded();
  expect(await font('.event-world p')).toBeGreaterThanOrEqual(16);
  expect(await font('.event-world-copy > .mono')).toBeGreaterThanOrEqual(12);
  await expect(page.locator('.event-world-copy').first()).toHaveCSS('opacity','1');
  await expect(page.locator('.motion-word').last()).toHaveCSS('transform','none');
  await page.locator('#event-planner').scrollIntoViewIfNeeded();
  expect(await font('.planner-checks')).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'LET’S PLAN THIS'}).click();
  expect(await font('.dialog input')).toBeGreaterThanOrEqual(16);
  expect(await font('.dialog label')).toBeGreaterThanOrEqual(15);
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Open navigation menu'}).click();
  await page.getByRole('link',{name:'07 Build your brief'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({path:`/workspace/mobile-readable-${width}.png`});
 });
}

test('landscape phone keeps the image beside readable text and controls',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.goto('/');
 await expect(page.locator('.is-ready')).toBeAttached();
 const image=await page.locator('.stage-frame').boundingBox();
 const heading=await page.locator('.world-heading').boundingBox();
 const controls=await page.locator('.hero-bottom').boundingBox();
 expect(heading.x).toBeGreaterThan(image.x+image.width);
 expect(image.y+image.height).toBeLessThan(controls.y);
 expect(heading.y+heading.height).toBeLessThan(controls.y);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
