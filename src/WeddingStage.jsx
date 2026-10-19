import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bareStage from "./assets/wedding-bare.webp";
import finalStage from "./assets/wedding-final.webp";
import decorAtlas from "./assets/wedding-decor.webp";

// Transparent decorations share the final photograph’s stage coordinates.
const pieces = [
  { name: "Ivory backdrop", start: .03, end: .16, x: 0, y: -95, angle: 0 },
  { name: "Overhead velvet drapes", start: .08, end: .24, x: 0, y: -70, angle: -5 },
  { name: "Left velvet curtain", start: .14, end: .30, x: -75, y: -15, angle: -14 },
  { name: "Right velvet curtain", start: .17, end: .33, x: 75, y: -15, angle: 14 },
  { name: "Left gold candle screen", start: .23, end: .38, x: -90, y: 5, angle: -18 },
  { name: "Right gold candle screen", start: .26, end: .41, x: 90, y: 5, angle: 18 },
  { name: "Left floral pillar", start: .31, end: .47, x: -80, y: 20, angle: -24 },
  { name: "Right floral pillar", start: .34, end: .50, x: 80, y: 20, angle: 24 },
  { name: "Left hanging flowers", start: .39, end: .53, x: -15, y: -85, angle: -12 },
  { name: "Inner left chandelier", start: .42, end: .56, x: -10, y: -90, angle: 9 },
  { name: "Right hanging flowers", start: .41, end: .55, x: 15, y: -85, angle: 12 },
  { name: "Inner right chandelier", start: .44, end: .58, x: 10, y: -90, angle: -9 },
  { name: "Center floral chandelier", start: .46, end: .61, x: 0, y: -95, angle: 8 },
  { name: "Stage flower bed", start: .49, end: .64, x: 0, y: 80, angle: -8 },
  { name: "Ivory wedding sofa", start: .56, end: .71, x: 75, y: -35, angle: 24 },
  { name: "Left floral aisle", start: .60, end: .75, x: -95, y: 30, angle: -20 },
  { name: "Right floral aisle", start: .63, end: .78, x: 95, y: 30, angle: 20 },
  { name: "Left reception tables", start: .66, end: .81, x: -100, y: -10, angle: -16 },
  { name: "Right reception tables", start: .69, end: .84, x: 100, y: -10, angle: 16 },
  { name: "Left aisle lanterns", start: .74, end: .88, x: -35, y: 100, angle: -25 },
  { name: "Right aisle lanterns", start: .77, end: .91, x: 35, y: 100, angle: 25 },
];
const sprites = {
  backdrop: [765, 0, 350, 360], swag: [0, 0, 490, 360], curtain: [490, 0, 240, 360],
  screen: [1190, 0, 230, 375], pillar: [30, 370, 220, 375], chandelier: [290, 370, 420, 380],
  sofa: [705, 510, 375, 200], flowers: [1080, 455, 368, 255],
  aisleLeft: [0, 755, 235, 331], aisleRight: [235, 755, 235, 331],
  table: [475, 730, 450, 345], lantern: [985, 730, 160, 335],
};
const placement = [
  ["backdrop", 31, 21, 38, 35], ["swag", 8, 2, 84, 29],
  ["curtain", 15, 19, 19, 34], ["curtain", 66, 19, 19, 34],
  ["screen", 17, 25, 6, 30], ["screen", 77, 25, 6, 30],
  ["pillar", 28, 31, 10, 28], ["pillar", 62, 31, 10, 28],
  ["chandelier", 21, 19, 12, 17], ["chandelier", 35, 21, 10, 15],
  ["chandelier", 69, 19, 12, 17], ["chandelier", 55, 21, 10, 15],
  ["chandelier", 41, 16, 18, 20], ["flowers", 34, 43, 32, 13],
  ["sofa", 43, 45, 14, 10], ["aisleLeft", 0, 58, 40, 42],
  ["aisleRight", 60, 58, 40, 42], ["table", -3, 54, 28, 29],
  ["table", 75, 54, 28, 29], ["lantern", 27, 84, 5, 15], ["lantern", 68, 84, 5, 15],
];
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => 1 - Math.pow(1 - v, 3);

export default function WeddingStage({ reduced, onReady, onPhase }) {
  const scene = useRef(null);
  useEffect(() => {
    const node = scene.current;
    const elements = [...node.querySelectorAll(".stage-piece")];
    let lastPhase = -1;
    const draw = (p) => {
      pieces.forEach((piece, i) => {
        const t = clamp((p - piece.start) / (piece.end - piece.start));
        const remaining = 1 - ease(t);
        const el = elements[i];
        el.style.visibility = t === 0 ? "hidden" : "visible";
        el.style.transform = `translate(${piece.x * remaining}cqw, ${piece.y * remaining}cqh) rotate(${piece.angle * remaining}deg) scale(${1 - .28 * remaining})`;
        el.style.willChange = t > 0 && t < 1 ? "transform" : "auto";
        el.dataset.settled = String(t === 1);
      });
      node.style.setProperty("--finish", clamp((p - .94) / .03));
      node.style.setProperty("--lights", clamp((p - .88) / .09));
      node.style.setProperty("--progress", p);
      const phase = p < .15 ? 0 : p < .4 ? 1 : p < .78 ? 2 : 3;
      node.dataset.phase = String(phase);
      if (phase !== lastPhase) { onPhase(phase); lastPhase = phase; }
    };
    draw(reduced ? 1 : 0);
    if (reduced) return;
    const trigger = ScrollTrigger.create({ trigger: ".journey", start: "top top", end: "bottom bottom", onUpdate: self => draw(self.progress), onRefresh: self => draw(self.progress) });
    return () => trigger.kill();
  }, [reduced, onPhase]);

  return (
    <div className="wedding-scene" ref={scene} role="img" aria-label="Wedding decorations fly into place as you scroll: velvet drapes descend, floral pillars arrive from the sides, chandeliers drop in, and the sofa, tables and lanterns settle into a finished wedding stage.">
      <div className="stage-frame">
        <div className="stage-plane">
          <img className="stage-image stage-bare" src={bareStage} alt="" onLoad={onReady} onError={onReady} fetchPriority="high" />
          {pieces.map((piece, i) => {
            const [sprite, left, top, width, height] = placement[i];
            const [x, y, w, h] = sprites[sprite];
            return <div key={piece.name} data-piece={piece.name} className="stage-piece"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, visibility: "hidden" }}>
              <div className="decor-crop"><img src={decorAtlas} alt="" draggable="false" style={{ width: `${1448 / w * 100}%`, height: `${1086 / h * 100}%`, left: `${-x / w * 100}%`, top: `${-y / h * 100}%` }} /></div>
            </div>;
          })}
          <img className="stage-image stage-finish" src={finalStage} alt="" />
          <div className="stage-light" />
        </div>
      </div>
      <div className="stage-progress" aria-hidden="true"><span /></div>
    </div>
  );
}
