import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bareStage from "./assets/wedding-bare.webp";
import drapedStage from "./assets/wedding-draped.webp";
import finalStage from "./assets/wedding-final.webp";
import stageFilm from "./assets/stage-film.mp4";

const clamp = value => Math.max(0, Math.min(1, value));
const progress = (value, start, end) => clamp((value - start) / (end - start));

export default function WeddingStage({ reduced, onReady, onPhase }) {
  const scene = useRef(null);
  const film = useRef(null);
  const [filmVisible, setFilmVisible] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const playFilm = () => {
    const video = film.current;
    if (!video) return;
    video.muted = true;
    video.play().then(() => { setFilmVisible(true); setPlayBlocked(false); }).catch(error => { if (error.name !== "AbortError") setPlayBlocked(true); });
  };
  useEffect(() => {
    const node = scene.current;
    let lastPhase = -1;
    let inView = true;
    const syncLights = () => {
      const active = !reduced && inView && !document.hidden && lastPhase === 3;
      node.classList.toggle("lights-running", active);
      if (active && film.current && !film.current.ended) playFilm();
      else if (!active) film.current?.pause();
    };
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
      if (phase !== lastPhase) {
        onPhase(phase);
        if (phase !== 3) {
          film.current?.pause();
          if (film.current) film.current.currentTime = 0;
          setFilmVisible(false);
          setPlayBlocked(false);
        }
        lastPhase = phase;
        syncLights();
      }
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
  return <div className="wedding-scene" ref={scene} role="img" aria-label="A wedding venue builds continuously over four scroll chapters: fabric dresses the stage from the ceiling down, flowers and seating fill the stage and aisle, the completed stage is revealed, then a five-second silent film brings it to life.">
    <div className="stage-frame"><div className="stage-plane">
      <img className="stage-image stage-bare" src={bareStage} alt="" onLoad={onReady} onError={onReady} fetchPriority="high" />
      <img className="stage-image stage-fabric" src={drapedStage} alt="" />
      <img className="stage-image stage-finish" src={finalStage} alt="" />
      <div className="stage-light" />
      <video ref={film} className={`stage-film ${filmVisible ? "is-playing" : ""}`} src={stageFilm} muted playsInline preload="metadata" poster={finalStage} aria-label="Five-second silent wedding stage film" />
      {(playBlocked || reduced) && <button className="film-play mono" onClick={playFilm}>PLAY STAGE FILM · 5 SEC ↗</button>}
    </div></div>
    <div className="stage-progress" aria-hidden="true"><span /></div>
  </div>;
}
