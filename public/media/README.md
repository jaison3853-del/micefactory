# Required construction media

The user-supplied ZIP is not present in this workspace yet. Do not substitute the existing five-second final-stage clip or synthetic test footage for the construction film.

Required files from the ZIP:

- `wedding-stage-scroll.mp4`: optimized desktop construction film, approximately 64 seconds.
- `wedding-stage-scroll-mobile.mp4`: optimized mobile film of the identical edit/duration and camera perspective.

Check both with ffprobe: H.264, yuv420p, no audio needed, MP4 faststart, short GOP (ideally 0.25–0.5 seconds), matching frame rate and duration. Desktop up to 1920×1080; mobile up to 960×540 or 1280×720. Do not upscale. Verify HTTP byte-range support and accurate reverse seeking on the deployed host. Check actual worker motion and reference-stage matching visually before deployment.

The component seeks the video while paused; it never uses autoplay as a clock. Canvas rendering is capped to the selected device budget. Reduced motion loads only the final poster and does not request either video. Missing/unsupported media shows the poster and a retry button.

Tests use clearly labeled generated codec fixtures in temporary storage, never production assets. Final source quality and physical iPhone/Android behavior cannot be certified without the supplied files and real devices.
