import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bareStage from "./assets/wedding-bare.webp";
import finalStage from "./assets/wedding-final.webp";
import decorations from "./assets/wedding-cutout.webp";

// Every decoration keeps its photographed size and perspective on one common plane.
// Four screen-length chapters: venue, fabric, flowers/seating, complete celebration.
const pieces = [
  { name: "Overhead velvet drapes", start: .04, end: .24, x: 0, y: -34, shape: "0% 0%,100% 0%,100% 18%,60% 18%,57% 15%,43% 15%,40% 18%,0% 18%" },
  { name: "Left velvet curtain", start: .07, end: .29, x: -30, y: -5, shape: "0% 18%,22% 18%,22% 44%,27% 44%,27% 55%,0% 55%" },
  { name: "Right velvet curtain", start: .10, end: .32, x: 30, y: -5, shape: "78% 18%,100% 18%,100% 55%,73% 55%,73% 44%,78% 44%" },
  { name: "Left hanging flowers", start: .27, end: .44, x: -4, y: -42, shape: "22% 18%,30% 18%,30% 38%,27% 43%,22% 43%" },
  { name: "Right hanging flowers", start: .29, end: .46, x: 4, y: -42, shape: "70% 18%,78% 18%,78% 43%,73% 43%,70% 38%" },
  { name: "Center floral chandeliers", start: .31, end: .49, x: 0, y: -40, shape: "30% 18%,40% 18%,43% 15%,57% 15%,60% 18%,70% 18%,70% 43%,30% 43%" },
  { name: "Left floral pillar", start: .35, end: .53, x: -38, y: 0, shape: "30% 28%,38% 28%,38% 55%,27% 59%,25% 53%,29% 40%" },
  { name: "Right floral pillar", start: .38, end: .56, x: 38, y: 0, shape: "62% 28%,70% 28%,71% 40%,75% 53%,73% 59%,62% 55%" },
  { name: "Ivory wedding sofa", start: .42, end: .60, x: 20, y: 14, shape: "43% 47%,48% 44%,53% 44%,57% 47%,57% 55%,43% 55%" },
  { name: "Stage flower border", start: .52, end: .66, x: 0, y: 22, shape: "36% 40%,64% 40%,73% 58%,27% 58%" },
  { name: "Left reception tables", start: .55, end: .73, x: -45, y: 0, shape: "0% 43%,25% 43%,25% 69%,0% 83%" },
  { name: "Right reception tables", start: .57, end: .75, x: 45, y: 0, shape: "75% 43%,100% 43%,100% 83%,75% 69%" },
  { name: "Left floral aisle and candles", start: .62, end: .81, x: -32, y: 12, shape: "27% 55%,44% 55%,43% 73%,26% 100%,0% 100%,0% 83%,25% 69%" },
  { name: "Right floral aisle and candles", start: .65, end: .84, x: 32, y: 12, shape: "56% 55%,73% 55%,75% 69%,100% 83%,100% 100%,74% 100%,57% 73%" },
];
const clamp = value => Math.max(0, Math.min(1, value));
export default function WeddingStage({ reduced, onReady, onPhase }) {
  const scene = useRef(null);
  useEffect(() => {
    const node = scene.current;
    const elements = [...node.querySelectorAll(".stage-piece")];
    let lastPhase = -1;
    const draw = p => {
      pieces.forEach((piece, i) => {
        const t = clamp((p - piece.start) / (piece.end - piece.start));
        const remaining = Math.pow(1 - t, 3);
        const el = elements[i];
        el.style.visibility = t === 0 ? "hidden" : "visible";
        el.style.transform = `translate(${piece.x * remaining}%, ${piece.y * remaining}%)`;
        el.style.opacity = clamp(t * 8);
        el.style.willChange = t > 0 && t < 1 ? "transform" : "auto";
        el.dataset.settled = String(t === 1);
      });
      node.style.setProperty("--assembly", clamp((p - .82) / .04));
      node.style.setProperty("--finish", clamp((p - .86) / .08));
      node.style.setProperty("--lights", clamp((p - .80) / .14));
      node.style.setProperty("--progress", p);
      const phase = p < .18 ? 0 : p < .36 ? 1 : p < .68 ? 2 : 3;
      node.dataset.phase = String(phase);
      if (phase !== lastPhase) { onPhase(phase); lastPhase = phase; }
    };
    draw(reduced ? 1 : 0);
    if (reduced) return;
    const trigger = ScrollTrigger.create({trigger: ".journey", start: "top top", end: "bottom bottom", onUpdate: self => draw(self.progress), onRefresh: self => draw(self.progress)});
    return () => trigger.kill();
  }, [reduced, onPhase]);
  return <div className="wedding-scene" ref={scene} role="img" aria-label="Four scroll chapters assemble a wedding venue: empty stage, descending crimson curtains, arriving flowers and seating, then the complete candlelit celebration.">
    <div className="stage-frame"><div className="stage-plane">
      <img className="stage-image stage-bare" src={bareStage} alt="" onLoad={onReady} onError={onReady} fetchPriority="high" />
      {pieces.map(piece => <img key={piece.name} src={decorations} alt="" className="stage-image stage-piece" data-piece={piece.name} style={{clipPath: `polygon(${piece.shape})`, visibility: "hidden"}} />)}
      <img src={decorations} className="stage-image stage-assembled" alt="" />
      <img className="stage-image stage-finish" src={finalStage} alt="" />
      <div className="stage-light" />
    </div></div>
    <div className="stage-progress" aria-hidden="true"><span /></div>
  </div>;
}
