import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import finalStage from './assets/wedding-final.webp';
import './WeddingStageScroll.css';
import { phaseFor, sequencePlayer, validateManifest } from './stageSequence.js';

gsap.registerPlugin(ScrollTrigger);
const clamp = value => Math.max(0, Math.min(1, value));
const DESKTOP = import.meta.env.VITE_STAGE_DESKTOP_URL || 'https://ayj0z9uanjiaychq.public.blob.vercel-storage.com/MICEFACTORY_Stage_Construction_4K_UHD.mp4';
const MOBILE = import.meta.env.VITE_STAGE_MOBILE_URL || '/media/wedding-stage-scroll-mobile.mp4';

/** Native paused-video seeking; scroll is the only playback clock. */
export default function WeddingStage({ reduced = false, onReady, onPhase }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const video = useRef(null);
  const callbacks = useRef({ onReady, onPhase });
  callbacks.current = { onReady, onPhase };
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const el = root.current, cvs = canvas.current, vid = video.current;
    const mobile = matchMedia('(max-width: 759px)').matches;
    const ctx = cvs.getContext('2d', { alpha: false, desynchronized: true });
    let destroyed = false, inView = true, pendingRaf = 0, frameCallback = null;
    let target = 0, lastPhase = -1, loadTimer = null, animation = null, statusValue = "";
    let sequence = null;
    const manifestAbort = new AbortController();
    el.dataset.mode = 'fallback';
    el.dataset.cacheBytes = '0'; el.dataset.cacheFrames = '0';
    delete el.dataset.frame; delete el.dataset.targetFrame;
    el.classList.remove('has-frames', 'stage-fallback', 'stage-reduced');
    cvs.width = 1; cvs.height = 1;
    const changeStatus = value => {
      if (destroyed) return;
      if (value === statusValue) return;
      statusValue = value; el.dataset.state = value; setStatus(value);
    };
    const active = () => !destroyed && !reduced && inView && !document.hidden;
    const desiredTime = () => Number.isFinite(vid.duration) && vid.duration > 0
      ? Math.min(target * vid.duration, Math.max(0, vid.duration - 1 / 30)) : 0;
    const drawFrame = () => {
      if (sequence) { if (active()) sequence.draw(); return; }
      if (!active() || !ctx || vid.readyState < 2 || !vid.videoWidth || vid.seeking) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const maxWidth = mobile ? 960 : Math.min(3840, Math.max(1920, Math.round(window.innerWidth * dpr)));
      const maxHeight = mobile ? 720 : Math.min(2160, Math.max(1080, Math.round(window.innerHeight * dpr)));
      const scale = Math.min(1, maxWidth / vid.videoWidth, maxHeight / vid.videoHeight);
      const width = Math.max(1, Math.round(vid.videoWidth * scale));
      const height = Math.max(1, Math.round(vid.videoHeight * scale));
      if (cvs.width !== width || cvs.height !== height) { cvs.width = width; cvs.height = height; }
      try {
        ctx.drawImage(vid, 0, 0, width, height);
        el.classList.add('has-frames'); el.classList.remove('stage-fallback');
        el.dataset.renderedTime = vid.currentTime.toFixed(3);
        clearTimeout(loadTimer); changeStatus('ready'); callbacks.current.onReady?.();
      } catch { fail(); }
    };
    const presentFrame = () => {
      drawFrame();
      // A decoded-frame callback corrects browsers whose seeked event precedes
      // presentation. The immediate draw supports Safari without this API.
      if (vid.requestVideoFrameCallback && active()) {
        if (frameCallback !== null) vid.cancelVideoFrameCallback(frameCallback);
        frameCallback = vid.requestVideoFrameCallback(() => { frameCallback = null; drawFrame(); });
      }
    };
    const seekFrame = () => {
      pendingRaf = 0;
      if (sequence) { if (active()) sequence.draw(); return; }
      if (!active() || vid.readyState < 1 || !Number.isFinite(vid.duration) || vid.duration <= 0 || vid.seeking) return;
      const desired = desiredTime();
      el.dataset.targetTime = desired.toFixed(3);
      if (Math.abs(vid.currentTime - desired) <= .025) { presentFrame(); return; }
      try { vid.currentTime = desired; } catch { /* loadeddata or the next gesture retries. */ }
    };
    const schedule = () => { if (!pendingRaf && active()) pendingRaf = requestAnimationFrame(seekFrame); };
    const onSeeked = () => {
      presentFrame();
      // Coalesce fast/reverse gestures into the latest target after this seek.
      if (Math.abs(desiredTime() - vid.currentTime) > .025) schedule();
    };
    const onLoaded = () => { presentFrame(); schedule(); };
    const fail = () => {
      clearTimeout(loadTimer);
      el.classList.remove('has-frames'); el.classList.add('stage-fallback');
      vid.pause(); changeStatus('unavailable'); callbacks.current.onReady?.();
    };
    const visibility = () => {
      sequence?.pause(!active());
      if (active()) schedule();
      else {
        cancelAnimationFrame(pendingRaf); pendingRaf = 0;
        if (frameCallback !== null) { vid.cancelVideoFrameCallback?.(frameCallback); frameCallback = null; }
        vid.pause();
      }
    };
    const update = progress => {
      target = clamp(progress);
      sequence?.update(target);
      el.style.setProperty('--progress', target);
      el.style.setProperty('--reveal', clamp((target - .88) / .12));
      const phase = phaseFor(target);
      if (phase !== lastPhase) { lastPhase = phase; el.dataset.phase = String(phase); callbacks.current.onPhase?.(phase); }
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting && entry.intersectionRatio > .01; visibility(); }, {threshold:[0,.01]});
    observer.observe(el);
    document.addEventListener('visibilitychange', visibility);
    vid.addEventListener('seeked', onSeeked);
    vid.addEventListener('loadeddata', onLoaded);
    vid.addEventListener('loadedmetadata', onLoaded);
    vid.addEventListener('error', fail);
    const preventAutoplay = () => vid.pause();
    vid.addEventListener('play', preventAutoplay);

    if (reduced || !ctx) {
      el.classList.add(reduced ? 'stage-reduced' : 'stage-fallback');
      changeStatus(reduced ? 'poster' : 'unavailable'); update(reduced ? 1 : 0);
      callbacks.current.onReady?.();
    } else {
      changeStatus('loading');
      loadTimer = setTimeout(() => { manifestAbort.abort(); fail(); }, 60000);
      fetch('/stage-sequence/manifest.json', {signal:manifestAbort.signal, cache:'no-cache'})
        .then(response => { if (!response.ok) throw new Error('Manifest unavailable'); return response.json(); })
        .then(value => {
          if (destroyed) return;
          const manifest = validateManifest(value);
          if (manifest) {
            el.dataset.mode = 'sequence';
            sequence = sequencePlayer({manifest, mobile, canvas:cvs, node:el, changed:schedule, ready:ok => {
              clearTimeout(loadTimer);
              if (ok) el.classList.remove('stage-fallback');
              changeStatus(ok ? 'ready' : 'frame-unavailable');
              callbacks.current.onReady?.();
            }});
            sequence.pause(!active()); sequence.update(target); schedule();
          } else {
            el.dataset.mode = 'video';
            vid.muted = true; vid.defaultMuted = true; vid.playsInline = true;
            vid.preload = 'auto'; vid.crossOrigin = 'anonymous'; vid.src = mobile ? MOBILE : DESKTOP; vid.load();
          }
        }).catch(() => { if (!destroyed) { el.dataset.mode = 'fallback'; fail(); } });
    }
    if (!reduced) {
      const state = { value: 0 };
      animation = gsap.to(state, { value: 1, ease: 'none', onUpdate: () => update(state.value), scrollTrigger: {
        trigger: '.journey', start: 'top top', end: 'bottom bottom', scrub: .2, invalidateOnRefresh: true,
        onRefresh: self => update(self.progress),
      }});
      update(animation.scrollTrigger?.progress || 0);
    }
    return () => {
      destroyed = true; clearTimeout(loadTimer); cancelAnimationFrame(pendingRaf);
      manifestAbort.abort(); sequence?.destroy();
      if (frameCallback !== null) vid.cancelVideoFrameCallback?.(frameCallback);
      animation?.scrollTrigger?.kill(); animation?.kill(); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      vid.removeEventListener('seeked', onSeeked); vid.removeEventListener('loadeddata', onLoaded);
      vid.removeEventListener('loadedmetadata', onLoaded); vid.removeEventListener('error', fail); vid.removeEventListener('play', preventAutoplay);
      vid.pause(); vid.removeAttribute('src'); vid.load(); cvs.width = 1; cvs.height = 1;
    };
  }, [reduced, retry]);

  return <div className="wedding-scene stage-scroll-experience" ref={root} aria-label="Scroll-controlled wedding construction experience">
    <div className="stage-frame"><div className="stage-plane">
      <img className="stage-image stage-photo-finish" src={finalStage} alt="Completed red and gold wedding stage" onLoad={() => callbacks.current.onReady?.()} onError={() => callbacks.current.onReady?.()} fetchPriority="high" />
      <canvas className="stage-scrub-canvas" ref={canvas} role="img" aria-label="Wedding construction follows your scroll position" />
      <video className="stage-scrub-source" ref={video} muted playsInline preload="none" tabIndex={-1} aria-hidden="true" />
      <div className="stage-scroll-cinematic-glow" aria-hidden="true" />
    </div></div>
    <div className="stage-progress" aria-hidden="true"><span /></div>
    {status === 'loading' && <span className="stage-loading mono" role="status">PREPARING THE EXPERIENCE</span>}
    {(status === 'unavailable' || status === 'frame-unavailable') && <button className="stage-retry mono" onClick={() => setRetry(n => n + 1)}>RETRY EXPERIENCE ↻</button>}
  </div>;
}
