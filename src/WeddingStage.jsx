import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import bareStage from './assets/wedding-bare.webp';
import finalStage from './assets/wedding-final.webp';
import './WeddingStageScroll.css';

gsap.registerPlugin(ScrollTrigger);

const clamp = value => Math.max(0, Math.min(1, value));
const phaseFor = p => p < 0.22 ? 0 : p < 0.50 ? 1 : p < 0.78 ? 2 : 3;
const DESKTOP = '/media/wedding-stage-scroll.mp4';
const MOBILE = '/media/wedding-stage-scroll-mobile.mp4';

/**
 * 64-second Gemini construction sequence synchronized with vertical scrolling.
 * This uses short-GOP MP4s rather than downloading ~1,300 individual image files.
 * The video is decoded natively, while frames are presented on a canvas.
 * When media is absent/unsupported, original photo-to-photo fallbacks stay visible.
 */
export default function WeddingStage({ reduced = false, onReady = () => {}, onPhase = () => {} }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const video = useRef(null);
  const target = useRef(0);
  const readyCallback = useRef(onReady);
  const phaseCallback = useRef(onPhase);
  const [canRender, setCanRender] = useState(false);
  readyCallback.current = onReady;
  phaseCallback.current = onPhase;

  useEffect(() => {
    const el = root.current;
    const cvs = canvas.current;
    const vid = video.current;
    if (!el || !cvs || !vid) return;

    let destroyed = false;
    let lastPhase = -1;
    let hasDrawn = false;
    let lastRequested = -1;
    let pendingRaf = 0;

    const ctx = cvs.getContext('2d', { alpha: false, desynchronized: true });
    const drawFrame = () => {
      if (destroyed || !ctx || vid.readyState < 2) return;
      if (vid.videoWidth && vid.videoHeight) {
        if (cvs.width !== vid.videoWidth) cvs.width = vid.videoWidth;
        if (cvs.height !== vid.videoHeight) cvs.height = vid.videoHeight;
        try {
          ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
          if (!hasDrawn) {
            hasDrawn = true;
            el.classList.add('has-frames');
            setCanRender(true);
          }
        } catch { /* Keep photographic fallback if decoding is blocked. */ }
      }
    };

    const seekFrame = () => {
      pendingRaf = 0;
      if (destroyed || !Number.isFinite(vid.duration) || vid.duration <= 0 || vid.seeking) return;
      const desired = Math.min(Math.max(0, target.current * vid.duration), Math.max(0, vid.duration - 0.065));
      const minimumDelta = 0.035;
      if (Math.abs(lastRequested - desired) < minimumDelta) {
        if (!hasDrawn) drawFrame();
        return;
      }
      lastRequested = desired;
      if (Math.abs(vid.currentTime - desired) < 0.008) {
        drawFrame();
      } else {
        try { vid.currentTime = desired; } catch { /* Will retry at metadata load. */ }
      }
    };

    const scheduleSeek = () => {
      if (!pendingRaf && !destroyed) pendingRaf = requestAnimationFrame(seekFrame);
    };

    const onSeeked = () => {
      drawFrame();
      if (Math.abs(target.current * vid.duration - vid.currentTime) > 0.06) scheduleSeek();
    };
    const onLoaded = () => { drawFrame(); scheduleSeek(); };
    const onVideoError = () => { el.classList.add('stage-fallback'); };
    const onVisible = () => {
      if (!document.hidden) scheduleSeek();
    };

    const update = p => {
      const value = clamp(p);
      target.current = value;
      el.style.setProperty('--progress', value);
      el.style.setProperty('--fallback-finish', Math.min(1, Math.max(0, (value - 0.18) / 0.75)));
      el.style.setProperty('--reveal', clamp((value - 0.88) / 0.12));
      const phase = phaseFor(value);
      if (phase !== lastPhase) {
        lastPhase = phase;
        el.dataset.phase = String(phase);
        phaseCallback.current(phase);
      }
      if (!reduced) scheduleSeek();
    };

    vid.addEventListener('seeked', onSeeked);
    vid.addEventListener('loadeddata', onLoaded);
    vid.addEventListener('loadedmetadata', onLoaded);
    vid.addEventListener('error', onVideoError);
    document.addEventListener('visibilitychange', onVisible);

    if (reduced) {
      el.classList.add('stage-reduced');
      update(1);
      return () => {
        destroyed = true;
        cancelAnimationFrame(pendingRaf);
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
        vid.removeEventListener('seeked', onSeeked);
        vid.removeEventListener('loadeddata', onLoaded);
        vid.removeEventListener('loadedmetadata', onLoaded);
        vid.removeEventListener('error', onVideoError);
        document.removeEventListener('visibilitychange', onVisible);
        el.classList.remove('stage-reduced');
      };
    }

    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.src = window.matchMedia('(max-width: 759px)').matches ? MOBILE : DESKTOP;
    vid.load();

    const animation = gsap.to({ value: 0 }, {
      value: 1,
      ease: 'none',
      onUpdate() { update(this.targets()[0].value); },
      scrollTrigger: {
        trigger: '.journey', start: 'top top', end: 'bottom bottom',
        scrub: 0.25, invalidateOnRefresh: true,
        onRefresh(self) { update(self.progress); },
      },
    });
    update(animation.scrollTrigger?.progress || 0);

    return () => {
      destroyed = true;
      cancelAnimationFrame(pendingRaf);
      animation.scrollTrigger?.kill();
      animation.kill();
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
      vid.removeEventListener('seeked', onSeeked);
      vid.removeEventListener('loadeddata', onLoaded);
      vid.removeEventListener('loadedmetadata', onLoaded);
      vid.removeEventListener('error', onVideoError);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reduced]);

  return (
    <div className="wedding-scene stage-scroll-experience" ref={root}
      role="img" aria-label="An empty wedding hall is transformed by a professional crew into a lavish red and gold wedding stage as you scroll. Scrolling upward reverses the construction.">
      <div className="stage-frame">
        <div className="stage-plane">
          <img className="stage-image stage-photo-base" src={bareStage} alt=""
            onLoad={() => readyCallback.current?.()} onError={() => readyCallback.current?.()} fetchPriority="high" />
          <img className="stage-image stage-photo-finish" src={finalStage} alt="" />
          <canvas className="stage-scrub-canvas" ref={canvas} aria-hidden="true" />
          <video className="stage-scrub-source" ref={video} muted playsInline preload="none"
            tabIndex={-1} aria-hidden="true" />
          <div className="stage-scroll-cinematic-glow" aria-hidden="true" />
        </div>
      </div>
      <div className="stage-progress" aria-hidden="true"><span /></div>
      {!reduced && !canRender && <span className="stage-loading mono" aria-hidden="true">PREPARING THE EXPERIENCE</span>}
    </div>
  );
}
