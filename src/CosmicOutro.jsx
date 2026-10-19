import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const clamp = v => Math.max(0, Math.min(1, v));
export default function CosmicOutro({ reduced, onRestart }) {
  const root = useRef(null);
  useEffect(() => {
    const node = root.current;
    let armedAt = 0;
    let touchY = null;
    const render = p => {
      node.style.setProperty("--rise", clamp(p / .48));
      node.style.setProperty("--logo", clamp((p - .44) / .28));
      node.dataset.complete = String(p >= .85);
      if (p >= .98 && !armedAt) armedAt = Date.now();
      if (p < .98) armedAt = 0;
    };
    render(reduced ? 1 : 0);
    const trigger = reduced ? null : ScrollTrigger.create({trigger: node, start: "top top", end: "bottom bottom", onUpdate: self => render(self.progress), onRefresh: self => render(self.progress)});
    const atEnd = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
    const restart = event => {
      if (!atEnd() || !armedAt || Date.now() - armedAt < 700 || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      armedAt = 0;
      onRestart();
    };
    const wheel = e => { if (e.deltaY > 0) restart(e); };
    const key = e => {
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) || e.target.isContentEditable) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) restart(e);
    };
    const touchStart = e => { touchY = atEnd() ? e.touches[0]?.clientY : null; };
    const touchMove = e => { if (touchY !== null && touchY - e.touches[0].clientY > 45) { restart(e); touchY = null; } };
    window.addEventListener("wheel", wheel, {passive: false});
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", touchStart, {passive: true});
    window.addEventListener("touchmove", touchMove, {passive: false});
    ScrollTrigger.refresh();
    return () => {
      trigger?.kill();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
    };
  }, [reduced, onRestart]);
  return <section ref={root} className={`cosmic-outro ${reduced ? "cosmic-reduced" : ""}`} aria-label="MICEFACTORY closing experience">
    <div className="cosmic-screen">
      <div className="cosmic-stars" aria-hidden="true" />
      <div className="cosmic-orbit" aria-hidden="true" />
      <p className="cosmic-caption mono">EVERY END IS A NEW BEGINNING.</p>
      <svg className="cosmic-m" viewBox="0 0 48 48" aria-hidden="true"><path d="M5 36V12h6l13 17 13-17h6v24h-7V24L24 39 12 24v12Z" fill="currentColor" /></svg>
      <div className="cosmic-wordmark" aria-label="MICEFACTORY Events">
        <span>MICEFACTORY</span>
        <p>MEETINGS · INCENTIVES · CONFERENCES <b>EVENTS</b></p>
      </div>
      <button className="cosmic-restart mono" onClick={onRestart}>SCROLL TO BEGIN AGAIN <span>↓</span></button>
    </div>
  </section>;
}
