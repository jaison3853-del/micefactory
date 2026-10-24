import {test,expect} from '@playwright/test';
for(const width of [390,1440]){
 test('separate photo gallery loads, filters and supports fullscreen at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/gallery');
  await expect(page).toHaveTitle('Gallery — MICEFACTORY Events');
  await expect(page.locator('.journey')).toHaveCount(0);
  await expect(page.locator('.gp-card')).toHaveCount(62);
  await expect(page.locator('.gp-hero img')).toBeVisible();
  await page.getByRole('button',{name:'Stage & décor',exact:false}).click();
  await expect(page.locator('.gp-card')).toHaveCount(13);
  for(const card of await page.locator('.gp-card').all()){
   await card.scrollIntoViewIfNeeded();
   await expect.poll(()=>card.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  }
  const card=page.locator('.gp-card').first();
  await card.click();
  const modal=page.getByRole('dialog',{name:'Photo viewer'});
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2')).toHaveText('A canopy of light');
  await page.keyboard.press('ArrowRight');
  await expect(modal.locator('h2')).toHaveText('Florals & warm light');
  await modal.getByRole('button',{name:'Previous photo'}).click();
  await expect(modal.locator('h2')).toHaveText('A canopy of light');
  if(width===390){
   const image=modal.locator('.gp-viewer-image');
   await image.evaluate(el=>{
    const start=new Touch({identifier:1,target:el,clientX:280,clientY:300});
    const end=new Touch({identifier:1,target:el,clientX:100,clientY:310});
    el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[start]}));
    el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[end]}));
   });
   await expect(modal.locator('h2')).toHaveText('Florals & warm light');
  }
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(card).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('.gp-card')).toHaveCount(62);
  await page.evaluate(()=>scrollTo(0,0));
  await page.locator('.gp-hero img').evaluate(i=>i.decode());
  await page.screenshot({path:'/tmp/real-gallery-'+width+'.png'});
 });
}
test('all gallery assets are available and home links to separate gallery',async({page,request})=>{
 const {default:photos}=await import('../src/gallery-data.json',{with:{type:'json'}});
 for(const photo of photos){
  for(const suffix of ['', '-small']){
   const response=await request.get('/images/gallery/'+photo.id+suffix+'.webp');
   expect(response.ok()).toBe(true);
   expect(response.headers()['content-type']).toContain('image/webp');
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.backstage-loader')).toHaveCount(0);
 await page.getByRole('link',{name:'EXPLORE OUR GALLERY Weddings. Stages. Celebrations.'}).click();
 await expect(page).toHaveURL(/\/gallery$/);
 await expect(page.locator('h1')).toContainText('Some moments.');
});
