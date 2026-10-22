import {useRef,useState} from 'react';
import bare from './assets/wedding-bare.webp';
import finished from './assets/wedding-final.webp';
import './StageComparison.css';

export default function StageComparison() {
 const [position,setPosition]=useState(50);
 const [failed,setFailed]=useState(false);
 const dialog=useRef(null);
 const opener=useRef(null);
 const close=()=>{dialog.current.close();opener.current?.focus();};
 const scene=(expanded=false)=><>
  <div className="compare-scene" style={{'--split':position+'%'}}>
   <img src={bare} alt="Undecorated wedding hall and bare stage" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>
   <img className="compare-after" src={finished} alt="Completed red and gold wedding stage with flowers, sofa and warm lighting" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>
   <div className="compare-tags" aria-hidden="true"><span>THE VISION</span><span>THE REALITY</span></div>
   <div className="compare-divider" aria-hidden="true"><span>‹ <i/> ›</span></div>
   <input className="compare-range" type="range" min="0" max="100" value={position} onChange={e=>setPosition(Number(e.target.value))} aria-label={expanded?'Fullscreen stage comparison':'Stage before and after comparison'} aria-valuetext={position+'% completed stage revealed'} />
   {failed&&<p className="compare-error" role="status">An image could not load. Please refresh to try again.</p>}
  </div>
  <div className="compare-controls">
   <div className="compare-presets" aria-label="Comparison views">
    {[[0,'Before'],[50,'Compare'],[100,'After']].map(([value,label])=><button type="button" key={label} aria-pressed={position===value} onClick={()=>setPosition(value)}>{label}</button>)}
   </div>
   <span className="compare-hint">DRAG TO REVEAL <span aria-hidden="true">↔</span></span>
  </div>
 </>;
 return <section className="stage-comparison" aria-labelledby="comparison-heading" id="transformation">
  <div className="compare-heading"><div><p className="compare-kicker">THE ART OF TRANSFORMATION</p><h2 id="comparison-heading">One space.<br/><em>Endless possibility.</em></h2></div><p>From a blank canvas to a moment you never forget. Move the light to reveal every detail.</p></div>
  <div className="compare-frame">{scene()}</div>
  <div className="compare-foot"><span>WEDDING STAGE / DESIGN VISUALISATION</span><button type="button" ref={opener} onClick={()=>dialog.current.showModal()}>EXPLORE FULLSCREEN <span aria-hidden="true">↗</span></button></div>
  <dialog className="compare-modal" ref={dialog} aria-label="Fullscreen wedding stage comparison" onCancel={e=>{e.preventDefault();close();}} data-lenis-prevent>
   <div className="compare-modal-head"><span>MICEFACTORY / TRANSFORMATION</span><button type="button" onClick={close} autoFocus aria-label="Close fullscreen comparison">CLOSE ×</button></div>
   {scene(true)}
  </dialog>
 </section>;
}
