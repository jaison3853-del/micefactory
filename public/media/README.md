# Integrated construction media

Source: user-provided `MICEFACTORY_Codex_Scroll_Integration.zip` (20 October 2026).

| Asset | Duration | Dimensions | FPS | Size | Maximum keyframe interval |
| --- | --- | --- | --- | --- | --- |
| wedding-stage-scroll.mp4 | 64 s | 1280×720 | 20 | 19,815,519 bytes | 0.4 s |
| wedding-stage-scroll-mobile.mp4 | 64 s | 768×432 | 15 | 4,314,497 bytes | 0.667 s |

Both are H.264/yuv420p, without audio streams, with the MP4 `moov` atom before media data for fast startup. `wedding-stage-poster.jpg` is the supplied matching thumbnail. Videos are retained as supplied, without re-encoding. The existing approved stage still remains the reduced-motion/error fallback.

The component seeks the video while paused; it never uses autoplay as a clock. Canvas rendering is capped to the selected device budget. Reduced motion loads only the final poster and does not request either video. Missing/unsupported media shows the poster and a retry button. Desktop source is about 19 MB, so network speed affects first-load seeking.

The supplied asset notes describe the source as seven Gemini-generated clips. The integration preserves their content; edits, generated-motion artifacts and the source watermark are not removed or represented as real filmed event work.

Tests include the actual desktop/mobile media, forward and reverse seeks, HTTP 206 range loading, and clearly labeled synthetic fixtures for error/runtime-mode cases. Chromium mobile emulation validates layout and media selection, not physical iPhone/Android device certification.
