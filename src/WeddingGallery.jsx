import {useRef,useState} from 'react';
import './WeddingGallery.css';
const designs=[
 ['hindu-premium-gold','Royal Jasmine','Hindu','Premium','Carved gold mandap, crimson silk and cascading jasmine.'],
 ['hindu-premium-garden','Courtyard at Sunset','Hindu','Premium','Carved teak, lotus accents and a canopy of flowers.'],
 ['hindu-semi-marigold','Marigold Morning','Hindu','Semi-premium','Marigolds, banana leaves and traditional brass lamps.'],
 ['hindu-semi-jasmine','Earth & Jasmine','Hindu','Semi-premium','Warm terracotta, teak and delicate jasmine strings.'],
 ['christian-premium-ivory','Champagne Reverie','Christian','Premium','Ivory floral arches and sparkling crystal chandeliers.'],
 ['christian-premium-garden','Garden Vows','Christian','Premium','A floral ceremony arch under an evening sky.'],
 ['christian-semi-altar','Grace in White','Christian','Semi-premium','A simple cross, white roses and soft natural light.'],
 ['christian-semi-blush','Blush & Candlelight','Christian','Semi-premium','Ivory drapes, blush florals and an intimate reception setting.']
];
export default function WeddingGallery({onPlan}) {
 const [tradition,setTradition]=useState('All');
 const [tier,setTier]=useState('All');
 const [selected,setSelected]=useState(null);
 const modal=useRef(null),opener=useRef(null);
 const filtered=designs.filter(d=>(tradition==='All'||d[2]===tradition)&&(tier==='All'||d[3]===tier));
 const open=(d,e)=>{opener.current=e.currentTarget;setSelected(d);modal.current.showModal();};
 const close=()=>{modal.current.close();opener.current?.focus();};
 const move=direction=>setSelected(filtered[(filtered.findIndex(d=>d[0]===selected[0])+direction+filtered.length)%filtered.length]);
 return <section className="wedding-gallery" id="wedding-gallery" aria-labelledby="wedding-gallery-title">
  <div className="wg-heading"><div><span className="wg-kicker">THE WEDDING DESIGN COLLECTION</span><h2 id="wedding-gallery-title">Find your<br/><em>kind of extraordinary.</em></h2></div><p>Hindu and Christian wedding inspiration, from intimate elegance to grand celebrations.<br/><small>AI-generated design concepts, not photographs of completed events. Final styling is tailored to your venue and budget.</small></p></div>
  <div className="wg-filters">
   {[['Wedding style',['All','Hindu','Christian'],tradition,setTradition],['Design tier',['All','Premium','Semi-premium'],tier,setTier]].map(([label,options,value,set])=><div role="group" aria-label={label} key={label}><span>{label}</span>{options.map(option=><button key={option} aria-pressed={value===option} onClick={()=>set(option)}>{option}</button>)}</div>)}
   <span role="status">{filtered.length} concepts</span>
  </div>
  <div className="wg-grid">{filtered.map(d=><button className="wg-card" key={d[0]} onClick={e=>open(d,e)} aria-label={'Explore '+d[1]}>
   <div className="wg-photo"><img src={'/images/wedding-concepts/'+d[0]+'.webp'} srcSet={'/images/wedding-concepts/'+d[0]+'-small.webp 640w, /images/wedding-concepts/'+d[0]+'.webp 1536w'} sizes="(max-width:759px) 92vw, 44vw" width="1536" height="1024" alt={d[4]} loading="lazy" decoding="async"/><span>AI CONCEPT</span><b aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 19 19 5M5 5h14v14"/></svg></b></div>
   <div className="wg-caption"><span>{d[2]} / {d[3]}</span><h3>{d[1]}</h3><p>{d[4]}</p></div>
  </button>)}</div>
  <dialog className="wg-modal" ref={modal} aria-label="Wedding design preview" data-lenis-prevent onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}}>
   <button className="wg-close" onClick={close} autoFocus>Close ×</button>
   {selected&&<><img src={'/images/wedding-concepts/'+selected[0]+'.webp'} alt={selected[4]}/><div className="wg-modal-caption"><span>AI CONCEPT · {selected[2]} / {selected[3]}</span><h3>{selected[1]}</h3><p>{selected[4]}</p><div className="wg-modal-actions"><button onClick={()=>move(-1)} aria-label="Previous design">←</button><button onClick={()=>{close();onPlan({service:'Weddings & celebrations',details:'I like the AI design concept “'+selected[1]+'” ('+selected[2]+', '+selected[3]+'). Please help tailor it to my venue and budget.'});}}>Plan a stage like this ↗</button><button onClick={()=>move(1)} aria-label="Next design">→</button></div></div></>}
  </dialog>
 </section>;
}
