import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bareStage from "./assets/wedding-bare.webp";
import finalStage from "./assets/wedding-final.webp";

const range = (value, start, end) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export default function WeddingStage({ reduced, onReady, onPhase }) {
  const scene = useRef(null);
  useEffect(() => {
    const node = scene.current;
    let lastPhase = -1;
    const draw = (p) => {
      node.style.setProperty("--drapes", range(p, 0.08, 0.32));
      node.style.setProperty("--flowers", range(p, 0.3, 0.58));
      node.style.setProperty("--finish", range(p, 0.56, 0.78));
      node.style.setProperty("--lights", range(p, 0.76, 0.96));
      node.style.setProperty("--progress", p);
      const phase = p < 0.15 ? 0 : p < 0.4 ? 1 : p < 0.78 ? 2 : 3;
      node.dataset.phase = String(phase);
      if (lastPhase !== phase) { onPhase(phase); lastPhase = phase; }
    };
    draw(reduced ? 1 : 0);
    if (reduced) return;
    const trigger = ScrollTrigger.create({
      trigger: ".journey", start: "top top", end: "bottom bottom",
      onUpdate: (self) => draw(self.progress),
      onRefresh: (self) => draw(self.progress),
    });
    return () => trigger.kill();
  }, [reduced, onPhase]);

  return (
    <div className="wedding-scene" ref={scene} role="img"
      aria-label="A wedding stage transforms from an empty venue to crimson drapes, abundant roses, ivory seating and warm golden lights as you scroll.">
      <div className="stage-frame">
        <img className="stage-image stage-bare" src={bareStage} alt="" onLoad={onReady} onError={onReady} fetchPriority="high" />
        <img className="stage-image stage-drapes" src={finalStage} alt="" />
        <img className="stage-image stage-flowers" src={finalStage} alt="" />
        <img className="stage-image stage-finish" src={finalStage} alt="" />
        <div className="stage-light" />
      </div>
      <div className="stage-progress" aria-hidden="true"><span /></div>
    </div>
  );
}
