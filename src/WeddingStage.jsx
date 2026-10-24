import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bareStage from "./assets/wedding-bare.webp";
import drapedStage from "./assets/wedding-draped.webp";
import finalStage from "./assets/wedding-final.webp";

const clamp = value => Math.max(0, Math.min(1, value));
const progress = (value, start, end) => clamp((value - start) / (end - start));

export default function WeddingStage({ reduced, onReady, onPhase }) {
  const scene = useRef(null);
  useEffect(() => {
    const node = scene.current;
    let lastPhase = -1;
    let inView = true;
    const syncLights = () => node.classList.toggle("lights-running", !reduced && inView && !document.hidden && lastPhase === 3);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting && entry.intersectionRatio > .01; syncLights(); }, { threshold: [0, .01] });
    observer.observe(node);
    document.addEventListener("visibilitychange", syncLights);
    const draw = p => {
      const fabric = progress(p, .02, .30);
      const flowers = progress(p, .30, .70);
      // Broad feathered edges build through depth, without moving photo fragments.
      node.style.setProperty("--fabric-edge", `${-28 + fabric * 156}%`);
      node.style.setProperty("--floral-edge", `${-28 + flowers * 156}%`);
      node.style.setProperty("--finish", progress(p, .30, .35));
      node.style.setProperty("--lights", progress(p, .78, .92));
      node.style.setProperty("--progress", p);
      node.style.setProperty("--live-lights", progress(p, .83, .95));
      const phase = p < .30 ? 0 : p < .65 ? 1 : p < .84 ? 2 : 3;
      node.dataset.phase = String(phase);
      if (phase !== lastPhase) { onPhase(phase); lastPhase = phase; syncLights(); }
    };
    draw(reduced ? 1 : 0);
    if (reduced) return () => { observer.disconnect(); document.removeEventListener("visibilitychange", syncLights); };
    const state = { value: 0 };
    const animation = gsap.to(state, {
      value: 1, ease: "none", onUpdate: () => draw(state.value),
      scrollTrigger: { trigger: ".journey", start: "top top", end: "bottom bottom", scrub: .45, invalidateOnRefresh: true },
    });
    return () => { animation.scrollTrigger?.kill(); animation.kill(); observer.disconnect(); document.removeEventListener("visibilitychange", syncLights); };
  }, [reduced, onPhase]);
  return <div className="wedding-scene" ref={scene} role="img" aria-label="A wedding venue builds continuously over four scroll chapters: fabric dresses the stage from the ceiling down, flowers and seating fill the stage and aisle, the completed stage is revealed, then moving spotlights and candlelight bring it to life.">
    <div className="stage-frame"><div className="stage-plane">
      <img className="stage-image stage-bare" src={bareStage} alt="" onLoad={onReady} onError={onReady} fetchPriority="high" />
      <img className="stage-image stage-fabric" src={drapedStage} alt="" />
      <img className="stage-image stage-finish" src={finalStage} alt="" />
      <div className="stage-light" />
      <div className="live-stage-lights" aria-hidden="true">
        {[18, 29, 36, 44, 58, 65, 73, 82].map((left, i) => <div className="stage-spotlight" key={left} style={{ left: `${left}%`, "--angle": `${i % 2 ? -12 : 12}deg`, "--duration": `${7 + i % 3 * 2}s`, "--delay": `${-i * 1.4}s` }}><i /></div>)}
        <div className="floor-light-pattern" />
        {[[23,94],[31,80],[36,70],[39,63],[77,94],[69,80],[64,70],[61,63],[4,59],[96,59],[23,31],[74,31]].map(([left,top],i) => <span className="candle-glow" key={i} style={{left:`${left}%`,top:`${top}%`,"--delay":`${-i*.7}s`}} />)}
      </div>
    </div></div>
    <div className="stage-progress" aria-hidden="true"><span /></div>
  </div>;
}
