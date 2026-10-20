import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

let folder, fixture;
test.beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(),'mice-video-test-'));
  const path = join(folder,'codec-fixture.mp4');
  // Synthetic codec/seek fixture only. Never copied into public/media or deployed.
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=320x180:rate=12','-t','64','-an','-c:v','libx264','-preset','ultrafast','-crf','32','-g','6','-keyint_min','6','-sc_threshold','0','-pix_fmt','yuv420p','-movflags','+faststart',path]);
  fixture = await readFile(path);
});
test.afterAll(async () => { if(folder) await rm(folder,{recursive:true,force:true}); });
async function media(page) {
  const requests=[];
  await page.route('**/*.mp4', async route => {
    requests.push(route.request().url());
    const range = route.request().headers()['range'];
    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      const start=Number(match?.[1]||0),end=Math.min(Number(match?.[2]||fixture.length-1),fixture.length-1);
      return route.fulfill({status:206,contentType:'video/mp4',headers:{'access-control-allow-origin':'*','accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${fixture.length}`},body:fixture.subarray(start,end+1)});
    }
    return route.fulfill({contentType:'video/mp4',headers:{'access-control-allow-origin':'*','accept-ranges':'bytes'},body:fixture});
  });
  return requests;
}
async function seek(page,p) {
  await page.evaluate(p=>scrollTo(0,(document.querySelector('.journey').offsetHeight-innerHeight)*p),p);
  await expect.poll(()=>page.locator('.stage-scrub-source').evaluate((v,time)=>Math.abs(v.currentTime-time),Math.min(p*64,64-1/30))).toBeLessThan(.1);
  await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','ready');
}

test('64-second video follows forward and reverse scroll without independent playback',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const requests=await media(page);await page.goto('/');
  await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','ready');
  expect(await page.locator('.stage-scrub-source').evaluate(v=>v.duration)).toBeCloseTo(64,1);
  await seek(page,.5);await seek(page,.85);await seek(page,.2);
  const time=await page.locator('.stage-scrub-source').evaluate(v=>v.currentTime);
  await page.waitForTimeout(250);
  expect(await page.locator('.stage-scrub-source').evaluate(v=>v.currentTime)).toBe(time);
  expect(await page.locator('.stage-scrub-source').evaluate(v=>v.paused&&v.muted&&v.playsInline)).toBe(true);
  await seek(page,1);await seek(page,0);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every(url=>url.endsWith('MICEFACTORY_Stage_Construction_4K_UHD.mp4'))).toBe(true);
  expect(errors).toEqual([]);
});

test('mobile video selection, bounded canvas, rapid direction changes and overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const requests=await media(page);await page.goto('/');
  await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','ready');
  for(const p of [.7,.1,.9,.3]) await seek(page,p);
  expect(requests.every(url=>url.endsWith('wedding-stage-scroll-mobile.mp4'))).toBe(true);
  expect(await page.locator('canvas').evaluate(c=>c.width*c.height)).toBeLessThanOrEqual(960*720);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const plane=await page.locator('.stage-plane').boundingBox();
  expect(plane.width).toBeLessThanOrEqual(391);
  expect(plane.width/plane.height).toBeCloseTo(16/9,1);
});

test('reduced motion skips media and runtime motion toggle restores seeking',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});const requests=await media(page);await page.goto('/');
  await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','poster');
  expect(requests).toEqual([]);
  await expect(page.locator('.stage-photo-finish')).toHaveCSS('opacity','1');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','ready');
  await seek(page,.6);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','poster');
  await expect(page.locator('.stage-scroll-experience')).not.toHaveClass(/has-frames/);
  expect(await page.locator('.stage-scrub-source').evaluate(v=>!v.getAttribute('src'))).toBe(true);
});

for (const mobile of [false, true]) {
  test(`supplied construction film: seven stages forward/reverse and HTTP ranges (${mobile ? 'mobile' : 'desktop'})`, async ({page}) => {
    test.setTimeout(120000);
    if (mobile) await page.setViewportSize({width:390,height:844});
    const errors=[];page.on('pageerror', e=>errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('.stage-scroll-experience')).toHaveAttribute('data-state','ready', {timeout:60000});
    const source=page.locator('.stage-scrub-source');
    expect(await source.evaluate(v=>v.duration)).toBeCloseTo(64,1);
    expect(await source.evaluate(v=>v.videoWidth)).toBe(mobile?768:3840);
    const times = [0,.125,.25,.375,.5,.625,.75,.875,1,.75,.5,.25,0];
    for(const p of times) {
      await seek(page,p);
      await expect.poll(()=>page.locator('.stage-scroll-experience').evaluate((el,t)=>Math.abs(Number(el.dataset.renderedTime)-t), Math.min(p*64,64-1/30))).toBeLessThan(.15);
    }
    expect(await source.evaluate(v=>v.paused&&v.muted&&v.playsInline)).toBe(true);
    const path=await source.evaluate(v=>v.currentSrc);
    const range=await page.request.get(path,{headers:{Range:'bytes=0-1023'}});
    expect(range.status()).toBe(206);
    expect((await range.body()).length).toBe(1024);
    expect(range.headers()['content-type']).toContain('video/mp4');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
