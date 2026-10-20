import { test, expect } from "@playwright/test";
import { phone, validatedPhone, whatsappUrl } from "../src/content.js";

test("mobile four-stage lighting experience never loads video", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  const videoRequests = [];
  page.on("request", request => {
    if (/\.mp4(?:[?#]|$)|vercel-storage\.com/.test(request.url())) videoRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".is-ready")).toBeAttached();
  const travel = await page.locator(".journey").evaluate(el => el.offsetHeight-innerHeight);
  for (const [p, phase] of [[.1,0],[.45,1],[.74,2],[.97,3],[.45,1],[0,0]]) {
    await page.evaluate(y=>scrollTo(0,y),travel*p);
    await expect(page.locator(".wedding-scene")).toHaveAttribute("data-phase",String(phase));
  }
  await expect(page.locator("video")).toHaveCount(0);
  expect(videoRequests).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("only the confirmed complete phone number is used for enquiries", () => {
  expect(phone).toBe("+919567495707");
  expect(validatedPhone("+91 956795707")).toBeNull();
  expect(whatsappUrl("Hello", "+91956795707")).toBeNull();
  const link = new URL(whatsappUrl("A celebration & a new beginning"));
  expect(link.pathname).toBe("/919567495707");
  expect(link.searchParams.get("text")).toBe("A celebration & a new beginning");
});

test("wedding stage builds through four continuous chapters and reverses without errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".is-ready")).toBeAttached();
  await expect(page.locator(".stage-bare")).toBeVisible();
  await expect.poll(() => page.locator(".stage-bare").evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
  await expect.poll(() => page.locator(".stage-finish").evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
  await expect(page.locator("h1")).toHaveText("It starts with a vision.");
  const travel = await page
    .locator(".journey")
    .evaluate((el) => el.offsetHeight - innerHeight);
  expect(travel / 900).toBeCloseTo(3, 1);
  await page.evaluate((y) => window.scrollTo(0, y), travel * 0.45);
  await expect(page.locator("h1")).toHaveText("Made with love.");
  await expect(page.locator(".stage-fabric")).toBeVisible();
  await expect.poll(() => page.locator(".stage-fabric").evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
  await expect(page.locator(".stage-piece")).toHaveCount(0);
  await page.evaluate((y) => window.scrollTo(0, y), travel * 0.74);
  await expect(page.locator("h1")).toHaveText("Your moment. Made.");
  await expect(page.locator(".wedding-scene")).not.toHaveClass(/lights-running/);
  await page.evaluate((y) => window.scrollTo(0, y), travel * 0.97);
  await expect(page.locator("h1")).toHaveText("Let the evening glow.");
  await expect.poll(() => page.locator(".wedding-scene").evaluate(el => parseFloat(el.style.getPropertyValue("--floral-edge")))) .toBe(128);
  await expect.poll(() => page.locator(".stage-finish").evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await expect(page.locator(".wedding-scene")).toHaveClass(/lights-running/);
  const beam = page.locator(".stage-spotlight").first();
  const firstTransform = await beam.evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => beam.evaluate(el => getComputedStyle(el).transform)).not.toBe(firstTransform);
  await page.evaluate(() => window.scrollTo(0, document.querySelector("#about").offsetTop + 120));
  await expect(page.locator(".wedding-scene")).not.toHaveClass(/lights-running/);
  await page.evaluate((y) => window.scrollTo(0, y), travel * 0.55);
  await expect(page.locator("h1")).toHaveText("Made with love.");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator("h1")).toHaveText("It starts with a vision.");
  await expect.poll(() => page.locator(".stage-finish").evaluate(el => Number(getComputedStyle(el).opacity))).toBe(0);
  await expect.poll(() => page.locator(".wedding-scene").evaluate(el => parseFloat(el.style.getPropertyValue("--fabric-edge")))).toBe(-28);
  expect(errors).toEqual([]);
});

test("menu, five service details, native dialog focus and brochure work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".is-ready")).toBeAttached();
  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await menuButton.click();
  await expect(
    page.getByRole("dialog", { name: "Navigation", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(menuButton).toBeFocused();
  await menuButton.click();
  await page.getByRole("link", { name: "02 Expertise" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const rows = page.locator(".service-row");
  await expect(rows).toHaveCount(5);
  for (let index = 0; index < 5; index++) {
    await rows.nth(index).click();
    await expect(page.locator(".service-dialog")).toBeVisible();
    await expect(page.locator(".service-dialog li")).toHaveCount(4);
    await page.getByRole("button", { name: "Close dialog" }).click();
  }
  const profile = await page.request.get("/micefactory-events.pdf");
  expect(profile.status()).toBe(200);
  expect(profile.headers()["content-type"]).toContain("application/pdf");
  for (const image of await page.locator(".experience-card img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBeTruthy();
  }
});

test("enquiry validates name and prepares the selected service without sending a message", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.open = (url) => {
      window.__openedUrl = url;
      return null;
    };
  });
  await page.goto("/");
  await expect(page.locator(".is-ready")).toBeAttached();
  await page.locator(".service-row").nth(1).click();
  await page.getByRole("button", { name: "PLAN YOUR EXPERIENCE" }).click();
  await expect(
    page.getByRole("dialog", { name: "Plan your event" }),
  ).toBeVisible();
  await expect(page.getByLabel("What are we planning?")).toHaveValue(
    "Corporate events",
  );
  await page.getByRole("button", { name: "CONTINUE ON WHATSAPP" }).click();
  expect(
    await page
      .getByLabel("Your name")
      .evaluate((el) => el.validity.valueMissing),
  ).toBe(true);
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Event location").fill("Kochi");
  await page
    .getByLabel("Tell us a little more")
    .fill("A corporate gathering for 100 guests.");
  await page.getByRole("button", { name: "CONTINUE ON WHATSAPP" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your next chapter awaits.",
  );
  const target = new URL(await page.evaluate(() => window.__openedUrl));
  expect(target.hostname).toBe("wa.me");
  expect(target.pathname).toBe("/919567495707");
  expect(target.searchParams.get("text")).toContain("Corporate events");
  expect(target.searchParams.get("text")).toContain("Test Visitor");
  expect(target.searchParams.get("text")).toContain("Kochi");
  await page.getByRole("button", { name: "EDIT MY DETAILS" }).click();
  await expect(page.getByLabel("What are we planning?")).toHaveValue(
    "Corporate events",
  );
  await expect(page.getByLabel("Your name")).toHaveValue("Test Visitor");
  await expect(page.getByLabel("Event location")).toHaveValue("Kochi");
});

test("mobile layouts, reduced motion, sound and navigation remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".is-ready")).toBeAttached();
  expect(
    await page
      .locator(".journey")
      .evaluate((el) => el.offsetHeight <= innerHeight + 1),
  ).toBe(true);
  await expect(page.locator("h1")).toHaveText("Let the evening glow.");
  await expect.poll(() => page.locator(".stage-finish").evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await expect(page.locator(".live-stage-lights")).toBeHidden();
  const frame = await page.locator(".stage-frame").boundingBox();
  expect(frame.width / frame.height).toBeCloseTo(16 / 9, 1);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const sound = page.getByRole("button", { name: "Turn ambient sound on" });
  await sound.click();
  await expect(
    page.getByRole("button", { name: "Turn ambient sound off" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Turn ambient sound off" }).click();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("link", { name: "05 Let’s talk" }).click();
  await page.getByRole("button", { name: "Let’s make memories." }).click();
  await expect(
    page.getByRole("dialog", { name: "Plan your event" }),
  ).toBeVisible();
  expect(
    await page
      .locator("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
});

test("WebGL-unavailable devices still get content and navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (
        type === "webgl2" ||
        type === "webgl" ||
        type === "experimental-webgl"
      )
        return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator(".wedding-scene")).toBeVisible();
  await expect(page.locator(".is-ready")).toBeAttached();
  await page.getByRole("button", { name: "[ EXPLORE EXPERIENCES ↗ ]" }).click();
  await expect(page.locator(".service-row").first()).toBeInViewport();
});


test("cosmic M resolves to the full logo and further scroll restarts the experience", async ({page}) => {
  await page.goto("/");
  await expect(page.locator(".cosmic-outro")).toBeAttached();
  const end = async () => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator(".cosmic-outro")).toHaveAttribute("data-complete", "true");
    await expect.poll(() => page.locator(".cosmic-wordmark").evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
    await page.waitForTimeout(800);
  };
  await end();
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
  await expect(page.locator("h1")).toHaveText("It starts with a vision.");
  await end();
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
  await end();
  await page.getByRole("button", {name:"SCROLL TO BEGIN AGAIN"}).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
});
