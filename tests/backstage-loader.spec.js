import {test,expect} from '@playwright/test';

test('loader tracks asset checks, preserves the full intro on first and repeat visits',async({page})=>{
 let release;
 const gate=new Promise(resolve=>release=resolve);
 await page.route('**/assets/wedding-*.webp',async route=>{await gate;await route.continue();});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 const loader=page.getByRole('dialog',{name:'Opening MICEFACTORY Events'});
 await expect(loader).toBeVisible();
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
 await page.screenshot({path:'/tmp/mice-loader-desktop.png'});
 release();
 await expect(loader).toHaveCount(0);
 await expect(page.locator('.is-ready')).toHaveClass(/is-ready/);

 await page.reload({waitUntil:'domcontentloaded'});
 await expect(loader).toBeVisible();
 await page.waitForTimeout(1000);
 await expect(page.locator('.backstage-mark')).toHaveCSS('opacity','1');
 await expect(page.locator('.backstage-opening')).toHaveCount(1);
 await expect(page.locator('.backstage-wordmark')).toHaveCSS('opacity','1');
 await expect(loader).toHaveCount(0);
});

test('mobile reduced-motion loader can be skipped while images are pending',async({page})=>{
 await page.setViewportSize({width:320,height:700});
 await page.emulateMedia({reducedMotion:'reduce'});
 let release;
 const gate=new Promise(resolve=>release=resolve);
 await page.route('**/assets/wedding-*.webp',async route=>{await gate;await route.abort();});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.backstage-reduced')).toBeVisible();
 const button=page.getByRole('button',{name:'ENTER WEBSITE'});
 expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/mice-loader-mobile.png'});
 await button.click();
 await expect(page.locator('.backstage-loader')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.classList.contains('backstage-loading'))).toBe(false);
 release();
});

test('failed assets do not trap visitors and Escape dismisses the loader',async({page})=>{
 await page.route('**/assets/wedding-*.webp',route=>route.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.keyboard.press('Escape');
 await expect(page.locator('.backstage-loader')).toHaveCount(0);
 await expect(page.locator('.is-ready')).toHaveClass(/is-ready/);
});
