import { test, expect } from '@playwright/test';

test('event visuals load and planner choices reach the editable WhatsApp brief',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{window.open=url=>{window.__briefUrl=url;};});
 await page.goto('/');
 await expect(page.locator('.event-world')).toHaveCount(2);
 for(const image of await page.locator('.event-world img').all()) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 }
 await expect(page.locator('.event-world')).toHaveCount(2);
 await page.getByLabel('Planner event type').selectOption('Corporate events');
 await page.locator('#planner-guests').focus();
 await page.keyboard.press('End');
 await page.getByLabel('Bold & theatrical',{exact:true}).check();
 await page.getByLabel('Guest hospitality',{exact:true}).check();
 await page.getByRole('button',{name:'LET’S PLAN THIS'}).click();
 await expect(page.getByLabel('What are we planning?')).toHaveValue('Corporate events');
 await expect(page.getByLabel('Tell us a little more')).toHaveValue(/Guest count: 1000\+/);
 await expect(page.getByLabel('Tell us a little more')).toHaveValue(/Bold & theatrical/);
 await expect(page.getByLabel('Tell us a little more')).toHaveValue(/Guest hospitality/);
 await page.getByLabel('Your name').fill('Planner Test');
 await page.getByRole('button',{name:'CONTINUE ON WHATSAPP'}).click();
 expect(await page.evaluate(()=>new URL(window.__briefUrl).searchParams.get('text'))).toContain('Guest hospitality');
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.locator('.event-faq summary').filter({hasText:'Does sending an enquiry confirm a booking?'}).click();
 await expect(page.locator('.event-faq details[open]')).toContainText('No. Your WhatsApp message starts a conversation.');
});

test('new sections animate on scroll, reverse and remain responsive with motion disabled',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const panel=page.locator('.event-world').first();
 await panel.scrollIntoViewIfNeeded();
 await expect(page.locator('.event-world-copy').first()).toHaveCSS('opacity','1');
 const transform=await page.locator('.event-world-image').first().evaluate(el=>getComputedStyle(el).transform);
 await page.evaluate(()=>scrollBy(0,300));
 await expect.poll(()=>page.locator('.event-world-image').first().evaluate(el=>getComputedStyle(el).transform)).not.toBe(transform);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.event-world-image').first()).toHaveCSS('transform','none');
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:844});
  await page.locator('#event-planner').scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);
});

test('SFX only creates tones after sound is enabled and stops when muted',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  window.__oscillators=0;
  const Native=window.AudioContext;
  if(Native) window.AudioContext=class extends Native {
   createOscillator(){window.__oscillators++;return super.createOscillator();}
  };
 });
 await page.goto('/');
 await page.evaluate(()=>window.dispatchEvent(new Event('mice:chapter')));
 expect(await page.evaluate(()=>window.__oscillators)).toBe(0);
 await page.getByRole('button',{name:'Turn ambient sound on'}).click();
 await expect(page.getByRole('button',{name:'Turn ambient sound off'})).toHaveAttribute('aria-pressed','true');
 await page.waitForTimeout(150);
 await page.evaluate(()=>window.dispatchEvent(new Event('mice:chapter')));
 await expect.poll(()=>page.evaluate(()=>window.__oscillators)).toBeGreaterThan(3);
 await page.getByRole('button',{name:'Turn ambient sound off'}).click();
 const count=await page.evaluate(()=>window.__oscillators);
 await page.evaluate(()=>window.dispatchEvent(new Event('mice:chapter')));
 expect(await page.evaluate(()=>window.__oscillators)).toBe(count);
});
