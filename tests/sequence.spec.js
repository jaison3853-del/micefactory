import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { validateManifest } from "../src/stageSequence.js";

const count = 90;
const manifest = { version: 1, enabled: true, frameCount: count,
  desktop: {pattern: "/stage-sequence/desktop/frame-{index}.webp", width: 1920, height: 1080},
  mobile: {pattern: "/stage-sequence/mobile/frame-{index}.webp", width: 960, height: 540},
};
// Test-only frames exercise real fetch/decode/canvas paths, not footage realism.
const bare = await readFile(new URL("../src/assets/wedding-bare.webp", import.meta.url));
const final = await readFile(new URL("../src/assets/wedding-final.webp", import.meta.url));
async function fixtures(page, {missing = -1, invalid = false} = {}) {
  const requests = [];
  await page.route("**/stage-sequence/**", async route => {
    const url = route.request().url();
    if (url.endsWith("manifest.json")) return route.fulfill({json: invalid ? {version: 1, enabled: true} : manifest});
    requests.push(url);
    const index = Number(url.match(/frame-(\d+)/)?.[1]);
    if (index === missing) return route.fulfill({status:404, body:"missing fixture"});
    return route.fulfill({contentType:"image/webp", body:index < 40 ? bare : final});
  });
  return requests;
}
async function seek(page, p, index) {
  await page.evaluate(value => {
    const section = document.querySelector(".journey");
    scrollTo(0, (section.offsetHeight - innerHeight) * value);
  }, p);
  if (index !== undefined) await expect(page.locator(".wedding-scene")).toHaveAttribute("data-frame", String(index));
}
const pixels = page => page.locator(".stage-scrub-canvas").evaluate(el => {
  const context = el.getContext("2d");
  return [...context.getImageData(el.width / 2, el.height / 2, 2, 2).data];
});

test("manifest rejects invalid counts, paths and dimensions", () => {
  expect(validateManifest({version:1, enabled:false})).toBeNull();
  expect(validateManifest(manifest)).toEqual(manifest);
  expect(() => validateManifest({...manifest, frameCount:0})).toThrow();
  expect(() => validateManifest({...manifest, desktop:{...manifest.desktop, pattern:"https://other.example/{index}.webp"}})).toThrow();
  expect(() => validateManifest({...manifest, mobile:{...manifest.mobile,width:10000}})).toThrow();
});

test("canvas renders actual loaded frames, reverses, and keeps a bounded desktop cache", async ({page}) => {
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  const requests = await fixtures(page);
  await page.goto("/");
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-frame","0");
  const first = await pixels(page);
  await seek(page,.48,45);
  expect(await pixels(page)).not.toEqual(first);
  await seek(page,.20,19);
  expect(await pixels(page)).toEqual(first);
  await seek(page,.96,89);
  await expect(page.locator("h1")).toHaveText("MICEFACTORY EVENTS");
  const last = await pixels(page);
  await page.waitForTimeout(250);
  expect(await pixels(page)).toEqual(last); // no independent playback clock
  for (const p of [.7,.1,.8,.3]) await seek(page,p,Math.round(p/.96*89));
  const stats = await page.locator(".wedding-scene").evaluate(el => ({bytes:Number(el.dataset.cacheBytes),limit:Number(el.dataset.cacheLimit),frames:Number(el.dataset.cacheFrames)}));
  expect(stats.bytes).toBeLessThanOrEqual(stats.limit);
  expect(stats.limit).toBe(72*1024*1024); expect(stats.frames).toBeLessThanOrEqual(8);
  expect(requests.length).toBeLessThan(90);
  expect(errors).toEqual([]);
});

test("mobile selects smaller assets and bounds decoded memory and canvas pixels", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  const requests = await fixtures(page);
  await page.goto("/");
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-frame","0");
  for (const p of [.3,.7,.15,.96]) await seek(page,p,Math.round(p/.96*89));
  expect(requests.every(url => url.includes("/mobile/"))).toBe(true);
  const stats = await page.locator(".wedding-scene").evaluate(el => ({bytes:Number(el.dataset.cacheBytes),frames:Number(el.dataset.cacheFrames)}));
  expect(stats.bytes).toBeLessThanOrEqual(20*1024*1024); expect(stats.frames).toBeLessThanOrEqual(6);
  expect(await page.locator(".stage-scrub-canvas").evaluate(el => el.width*el.height)).toBeLessThanOrEqual(2_010_000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("missing frames fall back safely and later frames recover", async ({page}) => {
  await fixtures(page,{missing:45}); await page.goto("/");
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-frame","0");
  await seek(page,.48);
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-state","frame-unavailable");
  await expect(page.locator(".stage-scrub-canvas")).toHaveCSS("opacity","0");
  await seek(page,.96,89);
  await expect(page.locator(".stage-scrub-canvas")).toHaveCSS("opacity","1");
});

test("invalid manifest and unavailable canvas keep the poster and navigation usable", async ({page}) => {
  await fixtures(page,{invalid:true}); await page.goto("/");
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-mode","fallback");
  await expect(page.locator(".stage-photo-finish")).toBeVisible();
  await page.addInitScript(() => {HTMLCanvasElement.prototype.getContext = () => null;});
  await page.reload();
  await expect(page.locator(".is-ready")).toBeAttached();
  await expect(page.locator(".stage-photo-finish")).toBeVisible();
  await page.getByRole("button", {name:"[ EXPLORE EXPERIENCES ↗ ]"}).click();
  await expect(page.locator(".service-row").first()).toBeInViewport();
});

test("reduced motion skips sequence requests and shows the final accessible state", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  const network = [];
  page.on("request", request => { if (request.url().includes("/stage-sequence/")) network.push(request.url()); });
  const requests = await fixtures(page);
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("MICEFACTORY EVENTS");
  await expect(page.locator(".stage-photo-finish")).toBeVisible();
  expect(requests).toEqual([]);
  expect(network).toEqual([]);
  expect(await page.locator(".journey").evaluate(el => el.offsetHeight <= innerHeight+1)).toBe(true);
});

test("runtime reduced motion releases the sequence canvas and restores scroll control", async ({page}) => {
  await fixtures(page);
  await page.goto("/");
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-frame","0");
  await seek(page,.48,45);
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-state","poster");
  expect(await page.locator(".stage-scrub-canvas").evaluate(c => c.width*c.height)).toBe(1);
  await expect(page.locator(".stage-scrub-canvas")).toHaveCSS("opacity","0");
  await page.emulateMedia({reducedMotion:"no-preference"});
  // Offscreen decoding is paused; wait for setup, then return to the stage.
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-mode","sequence");
  await seek(page,.20,19);
  await expect(page.locator(".wedding-scene")).toHaveAttribute("data-state","ready");
});
