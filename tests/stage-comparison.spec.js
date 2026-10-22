import {test,expect} from '@playwright/test';
for(const mobile of [false,true]) {
 test('stage comparison '+(mobile?'mobile':'desktop'),async({page})=>{
  if(mobile) await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.backstage-loader')).toHaveCount(0);
  const section=page.locator('#transformation');
  await section.scrollIntoViewIfNeeded();
  const range=page.getByRole('slider',{name:'Stage before and after comparison',exact:true});
  await range.focus();
  await page.keyboard.press('ArrowRight');
  await expect(range).toHaveValue('51');
  await page.keyboard.press('Home');
  await expect(range).toHaveValue('0');
  await section.getByRole('button',{name:'After',exact:true}).click();
  await expect(range).toHaveValue('100');
  await section.getByRole('button',{name:'Compare',exact:true}).click();
  await range.scrollIntoViewIfNeeded();
  const box=await range.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.75,box.y+box.height/2,{steps:8});
  await page.mouse.up();
  expect(Number(await range.inputValue())).toBeGreaterThan(65);
  await expect.poll(()=>section.locator('.compare-frame img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await page.screenshot({path:'/tmp/comparison-'+(mobile?'mobile':'desktop')+'.png',fullPage:false});
  const open=section.getByRole('button',{name:'EXPLORE FULLSCREEN'});
  await open.click();
  const modal=page.getByRole('dialog',{name:'Fullscreen wedding stage comparison'});
  await expect(modal).toBeVisible();
  await modal.getByRole('button',{name:'Before',exact:true}).click();
  await expect(modal.getByRole('slider')).toHaveValue('0');
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(open).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
