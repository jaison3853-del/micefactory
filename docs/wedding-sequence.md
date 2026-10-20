# Wedding construction: source and delivery contract

## Current release

The optional canvas image-sequence pipeline is implemented alongside the existing scroll-controlled video. The configured desktop 4K Vercel Blob URL and supplied mobile film remain the default when `public/stage-sequence/manifest.json` has `enabled: false`. This preserves the previously requested film integration. The supplied local films are described as seven Gemini-generated clips; their existence does not establish physically realistic construction or an exact match to the reference. The remote 4K source could not be inspected through this environment's network proxy.

No new construction scenes have been fabricated. A reviewed, continuous construction master is needed before enabling the image sequence. Changing video to WebP frames cannot fix cuts, teleporting objects, geometry inconsistencies or unrealistic worker movements already present in a source film. Invalid manifests, failed sequence frames and unavailable video retain the existing photographic stage fallback. The seven-part typography ends with **MICEFACTORY EVENTS / FROM VISION TO REALITY**. Services, enquiries, navigation, sound controls and cosmic outro remain intact.

## Required source footage

Supply an approved 4K or higher original master (ProRes or high-bitrate H.264/H.265, not a WhatsApp download), ideally 30–60 seconds edited from a real fixed-camera build. Use one locked tripod position, lens, focus, room geometry and exposure strategy throughout. No pans, zooms, lens changes, jump cuts, disappearing people or moved walls. Real hands and tools must contact materials. Keep workers fully in frame and use a safe clear central aisle. Final framing, crimson fabric, flower locations, ivory sofa, candles and lighting should match the provided reference. Film the entire sequence rather than attempting to reconstruct missing actions from two stills.

Required contiguous beats (approximate relative timing):

1. 0–12%: entirely empty room, no platform, fabric, flowers or fixtures.
2. 12–25%: crew enters with frames, platforms, materials and tools.
3. 25–42%: physical platform/staircase/backdrop/truss assembly.
4. 42–60%: curtains installed, floral structures and aisle decorated.
5. 60–78%: sofa carried into place, chandeliers/chairs/candles/lights installed.
6. 78–90%: final adjustments and natural crew exit.
7. 90–100%: room darkens, moving heads and golden lights activate, final stage holds with no crew.

A professionally produced physically coherent VFX/3D render is also usable if the client approves its realism. This repository does not fabricate that footage. Do not enable the sequence using unrelated final-stage clips, duplicate stills or test fixtures. Review the film and reversed playback before approval. Audio is unnecessary.

## Prepare assets

Requires Python 3, FFmpeg with libwebp, and ffprobe. From the repository root:

```bash
python scripts/prepare-stage-sequence.py /path/to/approved-construction-master.mov --output /tmp/stage-review --fps 12
```

This creates zero-based five-digit WebP frames in desktop (up to 1920 px wide) and mobile (up to 960 px) variants, using identical timing/frame counts. It does not upscale low-resolution footage. Output starts disabled. For 30 seconds at 12 fps, expect 360 frames per variant. Aim for 80–220 KB desktop and 25–80 KB mobile per frame. If natural worker motion needs 18/24 fps, re-export from the master and review bandwidth; never synthesize motion with duplicated frames. AVIF can be supplied externally with the same naming contract.

Review framing, each installation beat, no-cut reverse playback, first/last frames and decoded image dimensions. Once approved, copy desktop/mobile directories to `public/stage-sequence/` and copy the manifest, setting `enabled: true`. Alternatively run the script with `--approve` into a fresh directory and copy its reviewed output. The tool refuses to overwrite existing variant directories. Publish both variants and the manifest in the same atomic deployment. No React edits are needed.

Manifest schema:

```json
{
  "version": 1,
  "enabled": true,
  "fps": 12,
  "frameCount": 360,
  "desktop": { "pattern": "/stage-sequence/desktop/frame-{index}.webp", "width": 1920, "height": 1080 },
  "mobile": { "pattern": "/stage-sequence/mobile/frame-{index}.webp", "width": 960, "height": 540 }
}
```

Count is 2–1800; frames range `00000` through `frameCount - 1`. Patterns must stay under `/stage-sequence/` and end in WebP or AVIF. The final 4% of scroll holds the last frame and displays **MICEFACTORY EVENTS / FROM VISION TO REALITY**. Loading all frames before showing the site is intentionally avoided.

## Playback and memory

GSAP ScrollTrigger maps the sticky hero (seven viewport heights on desktop, 5.6 on mobile) to a frame index, with 200 ms scrub smoothing. Rendering is demand-driven through requestAnimationFrame; there is no autoplay clock. Scrolling backward requests previous frames. Missing/unready frames retain the last drawable frame; repeated target failures reveal the reference poster. Requests are prioritized around the latest target with a small bidirectional prefetch window and two concurrent fetch/decode operations. Old decoded frames are released, not retained for the entire sequence. Offscreen/hidden tabs pause work. Unmount/motion changes abort loads and release resources.

Mobile decoded cache: at most 6 frames / 20 MiB. Desktop: at most 8 frames / 72 MiB. These are decoded-cache bounds, **not total browser memory guarantees**: up to two in-flight decodes, compressed response bodies, decoder internals, canvas backing store and browser HTTP cache add overhead. The sequence canvas matches the decoded frame dimensions: up to 960 px wide on mobile and 1920 px on desktop, with no upscale. Mobile assets are selected at mount, contain-fitted to preserve the camera frame; desktop fills the viewport. Reduced motion shows the final poster immediately, requests no sequence and collapses the extra scroll distance.

## Verification

Run `npm run build` and `npm run test:smoke`. The sequence tests use explicitly test-only distinct image frames routed in the browser; they demonstrate loading, forward/reverse frame selection, errors, memory caps and reduced motion, **not realistic construction quality**. Before enabling production footage, repeat testing with actual frames on physical low-memory iOS and Android devices and profile total tab memory/network. Browser-level cache assertions cannot substitute for physical-device profiling.
