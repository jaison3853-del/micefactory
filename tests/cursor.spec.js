import {test,expect} from '@playwright/test';

test('desktop cursor follows, labels cards, pulses and yields to dialogs and keyboard',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const cursor=page.locator('.advanced-cursor');
 await expect(cursor).toBeAttached();
 const card=page.locator('.experience-card').first();
 await card.scrollIntoViewIfNeeded();
 await card.hover();
 await expect(cursor).toHaveClass(/cursor-visible/);
 await expect(cursor).toHaveAttribute('data-mode','explore');
 await expect(page.locator('.cursor-label')).toHaveText('EXPLORE');
 await page.mouse.down();
 expect(await page.locator('.cursor-pulse').evaluate(el=>el.getAnimations().length)).toBeGreaterThan(0);
 await page.mouse.up();
 await expect(page.locator('.service-dialog')).toBeVisible();
 await expect(cursor).toHaveCSS('display','none');
 await page.locator('.service-dialog h2').hover();
 await expect(page.locator('html')).not.toHaveClass(/custom-cursor-active/);
 await page.keyboard.press('Escape');
 await card.hover();
 await expect(cursor).toHaveClass(/cursor-visible/);
 await page.keyboard.press('Tab');
 await expect(cursor).not.toHaveClass(/cursor-visible/);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.mouse.move(200,200);
 await expect(page.locator('html')).not.toHaveClass(/custom-cursor-active/);
 expect(errors).toEqual([]);
});

test('touch users keep native interaction without a custom cursor',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173');
 await expect(page.locator('.advanced-cursor')).toBeAttached();
 await page.mouse.move(150,150);
 await expect(page.locator('.advanced-cursor')).toHaveCSS('display','none');
 await expect(page.locator('html')).not.toHaveClass(/custom-cursor-active/);
 await page.getByRole('button',{name:'Open navigation menu'}).tap();
 await expect(page.getByRole('dialog',{name:'Navigation',exact:true})).toBeVisible();
 await context.close();
});
