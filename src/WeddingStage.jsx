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
    const draw = p => {
      const fabric = progress(p, .02, .42);
      const flowers = progress(p, .35, .82);
      // Broad feathered edges build through depth, without moving photo fragments.
      node.style.setProperty("--fabric-edge", `${-28 + fabric * 156}%`);
      node.style.setProperty("--floral-edge", `${-28 + flowers * 156}%`);
      node.style.setProperty("--finish", progress(p, .35, .40));
      node.style.setProperty("--lights", progress(p, .78, .95));
      node.style.setProperty("--progress", p);
      const phase = p < .12 ? 0 : p < .70 ? 1 : 2;
      node.dataset.phase = String(phase);
      if (phase !== lastPhase) { onPhase(phase); lastPhase = phase; }
    };
    draw(reduced ? 1 : 0);
    if (reduced) return;
    const state = { value: 0 };
    const animation = gsap.to(state, {
      value: 1, ease: "none", onUpdate: () => draw(state.value),
      scrollTrigger: { trigger: ".journey", start: "top top", end: "bottom bottom", scrub: .45, invalidateOnRefresh: true },
    });
    return () => { animation.scrollTrigger?.kill(); animation.kill(); };
  }, [reduced, onPhase]);
  return <div className="wedding-scene" ref={scene} role="img" aria-label="A wedding venue builds continuously over three scroll chapters: fabric dresses the stage from the ceiling down, flowers and seating fill the stage and aisle, then warm lighting completes the celebration.">
    <div className="stage-frame"><div className="stage-plane">
      <img className="stage-image stage-bare" src={bareStage} alt="" onLoad={onReady} onError={onReady} fetchPriority="high" />
      <img className="stage-image stage-fabric" src={drapedStage} alt="" />
      <img className="stage-image stage-finish" src={finalStage} alt="" />
      <div className="stage-light" />
    </div></div>
    <div className="stage-progress" aria-hidden="true"><span /></div>
  </div>;
}
