# MICEFACTORY Events

A responsive event studio website built with React, Vite, Three.js, GSAP and Lenis.

The opening scene follows the supplied Igloo reference video: an assembling ice structure in a generated landscape, a scroll-driven overhead portal, and a floating M monogram. All geometry, frost textures, snow and ambient audio are generated locally. The rest of the site presents MICEFACTORY's services, imagery and profile from the supplied brochure.

## Run locally

Use Node.js 22.12+ or 24 LTS (validated with Node 24.19.0).

```sh
npm ci
npm run dev
```

In the cloud workspace, use `npm ci --cache /workspace/.cache/npm` if the default home cache is not writable. The checkout is `/workspace/micefactory`.

```sh
npm run build
npm run preview
```

`dist/` is a static production site. Deploy that folder to a static host. No application server, database, secrets, external font service or third-party 3D asset service is required.

## Deploy on Vercel

Import the existing GitHub repository `jaison3853-del/micefactory` into your Vercel account. The root directory is the repository root (`./`). The committed `vercel.json` selects Vite, runs `npm ci` and `npm run build`, and publishes `dist/`. `package.json` selects Node.js 24.x. No environment variables are required for the website; the confirmed contact number is already configured.

Use `main` as the production branch. Once the GitHub repository is connected in Vercel, pushes to `main` create production deployments. Deployment requires your Vercel account to authorize access to this GitHub repository. Publishing this Codex environment does not deploy the site to Vercel.

For an authenticated CLI workflow, run `npx vercel link` and then `npx vercel deploy --prod` from the repository root. Vercel account/project metadata stays in the ignored `.vercel/` directory. Never commit tokens.

## Preview without installing anything

The cloud onboarding chat does not expose its local server as a public website link. Publishing the cloud environment also does not publish the website.

Create a portable preview with:

```sh
npm run build:preview
```

Download the generated `micefactory-preview.html` and open it in desktop Chrome or Edge. It contains the JavaScript, styles, fonts, photos and brochure in one file, so the animation and navigation work without npm, a web server, or Internet access. Internet access is only needed to open WhatsApp. This is an interactive local file, not a hosted public URL. The normal `dist/` build remains unchanged.

## Contact details

The owner confirmed **+91 95674 95707**, correcting the incomplete number in the brochure. It is the default in `src/content.js`; all call and WhatsApp links use this single source.

To override it, copy `.env.example` to `.env.local`, set `VITE_CONTACT_PHONE` to a complete Indian mobile number in international form, and rebuild. This is public business contact information, not a credential. Invalid overrides disable outgoing phone links and offer a downloadable brief instead.

The enquiry form validates input and opens a prefilled WhatsApp conversation. The visitor must send the message in WhatsApp; the site does not submit to a backend or claim a message was delivered. Editing a prepared enquiry retains the visitor's details. No form data is persisted or logged.

## Checks

```sh
npm run build
npm run test:smoke
```

The Playwright suite starts a production preview (or reuses one), checks all three scene chapters, every service dialog, keyboard/focus behavior, brochure availability, image loading, enquiry validation and URL encoding, mobile overflow, sound controls, reduced motion, and WebGL fallback. It stubs `window.open`, so tests never send messages or contact the business.

The cloud environment supplies Chromium at `/usr/bin/chromium`. Elsewhere, run `npx playwright install chromium`, or set `CHROMIUM_PATH` to an installed Chromium executable. Linux hosts may also need `npx playwright install --with-deps chromium`.

## Content and design

- `src/IceWorld.jsx`: procedural WebGL scene, camera journey, particles and performance limits.
- `src/App.jsx`: sections, dialogs, navigation, audio and enquiry form.
- `src/content.js`: services and confirmed contact configuration.
- `src/styles.css`: responsive presentation and motion preferences.
- `public/images/`: original page imagery extracted from the supplied PDF. CSS viewports crop photography without stretching it.
- `public/micefactory-events.pdf`: original company profile, including its original (incomplete) printed contact number. The website uses the corrected number.

The uploaded video guided the visual and motion reconstruction because direct access to `igloo.inc` was blocked by the environment's network proxy. This is a custom implementation, not the original site's source or 3D assets. Self-hosted Manrope and IBM Plex Mono approximate its typography; an exact font match has not been verified. Brochure imagery illustrates the business's offering and is not labeled as a verified client project portfolio.

The scene pauses outside the viewport, while a dialog is open, and when the browser is hidden. Ice blocks are instanced, rendering is capped at 30 fps, and software renderers use a smaller pixel ratio. OS reduced-motion preferences disable the camera journey and continuous animation. A static fallback retains navigation and content when WebGL is unavailable. Sound is off until explicitly enabled.

Each cloud task already has an isolated checkout. Reuse it; do not create a Git worktree unless explicitly requested.
