import {useEffect,useRef,useState} from 'react';
import photos from './gallery-data.json';
import './GalleryPage.css';
const categories=['All moments',...new Set(photos.map(p=>p.category))];
const src=(photo,small=false)=>'/images/gallery/'+photo.id+(small?'-small':'')+'.webp';
function Photo({photo,eager=false}) {
 return <img src={src(photo)} srcSet={photo.smallWidth<photo.fullWidth?src(photo,true)+' '+photo.smallWidth+'w, '+src(photo)+' '+photo.fullWidth+'w':undefined} sizes="(max-width:600px) 90vw, (max-width:1000px) 45vw, 30vw" width={photo.width} height={photo.height} alt={photo.title} loading={eager?'eager':'lazy'} decoding="async"/>;
}
export default function GalleryPage(){
 const [category,setCategory]=useState('All moments');
 const [active,setActive]=useState(null);
 const [imageFailed,setImageFailed]=useState(false);
 const modal=useRef(null),opener=useRef(null),touch=useRef(null);
 const visible=photos.filter(p=>category==='All moments'||p.category===category);
 const index=visible.findIndex(p=>p.id===active?.id);
 const choose=p=>{setImageFailed(false);setActive(p);};
 const open=(p,e)=>{opener.current=e.currentTarget;choose(p);modal.current.showModal();};
 const close=()=>{modal.current.close();opener.current?.focus({preventScroll:true});};
 const move=direction=>choose(visible[(index+direction+visible.length)%visible.length]);
 useEffect(()=>{document.title='Gallery — MICEFACTORY Events';},[]);
 return <div className="gallery-page">
  <a className="gp-skip" href="#gallery-collection">Skip to photos</a>
  <header className="gp-header"><a href="/" className="gp-brand" aria-label="MICEFACTORY home">MICEFACTORY<span>EVENTS / THE GALLERY</span></a><a href="/" className="gp-home">← Back to website</a></header>
  <main>
   <section className="gp-hero" aria-labelledby="gp-title">
    <div className="gp-hero-photo"><Photo photo={photos.find(p=>p.id==="moment-27")} eager/></div>
    <div className="gp-hero-shade"/>
    <div className="gp-hero-copy"><span className="gp-eyebrow">MICEFACTORY / SELECTED MOMENTS</span><h1 id="gp-title">Some moments.<br/><em>Stay with you.</em></h1><p>The people. The atmosphere. The details.<br/>Step inside our world of celebrations.</p><a href="#gallery-collection">EXPLORE THE COLLECTION <span aria-hidden="true">↓</span></a></div>
    <span className="gp-hero-note">01 — A STAGE IN BLOOM</span>
   </section>
   <section className="gp-collection" id="gallery-collection" aria-labelledby="gp-collection-title">
    <div className="gp-intro"><div><span className="gp-eyebrow">THE MOMENTS BEHIND THE MEMORIES</span><h2 id="gp-collection-title">Every frame,<br/><em>a feeling.</em></h2></div><p>A collection of celebrations, performances and the work behind them. Explore a world, or wander through them all.</p></div>
    <div className="gp-filters" role="group" aria-label="Gallery categories">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}<span>{c==='All moments'?photos.length:photos.filter(p=>p.category===c).length}</span></button>)}</div>
    <p className="gp-count" role="status">{String(visible.length).padStart(2,'0')} FRAMES / {category.toUpperCase()}</p>
    <div className="gp-grid">{visible.map((p,i)=><button className="gp-card" key={p.id} onClick={e=>open(p,e)} aria-label={'View '+p.title}><div className="gp-image"><Photo photo={p}/><span className="gp-expand" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 9V5h4m6 0h4v4m0 6v4h-4m-6 0H5v-4"/></svg></span></div><div className="gp-caption"><span>{p.category}</span><h3>{p.title}</h3><small>{p.id.slice(-2)}</small></div></button>)}</div>
   </section>
   <section className="gp-end"><span className="gp-eyebrow">YOUR STORY COULD BE NEXT</span><h2>Let’s make<br/><em>your moment.</em></h2><a href="/#contact">PLAN YOUR EVENT ↗</a><a className="gp-instagram" href="https://www.instagram.com/teammicefactory/" target="_blank" rel="noopener noreferrer">Follow @teammicefactory on Instagram ↗</a></section>
  </main>
  <footer className="gp-footer"><a href="/">MICEFACTORY EVENTS</a><span>GALLERY / {new Date().getFullYear()}</span><a href="#gp-title">Back to top ↑</a></footer>
  <dialog ref={modal} className="gp-viewer" aria-label="Photo viewer" onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}}>
   <div className="gp-viewer-top"><span>MICEFACTORY / GALLERY</span><button onClick={close} autoFocus aria-label="Close photo viewer">Close ×</button></div>
   {active&&<><div className="gp-viewer-image" onTouchStart={e=>{if(e.touches.length===1)touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};else touch.current=null;}} onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);touch.current=null;}} onTouchCancel={()=>touch.current=null}>
    <img key={active.id} src={src(active)} alt={active.title} onError={()=>setImageFailed(true)}/>
    {imageFailed&&<p role="status">This photo could not load. <a href={src(active)} target="_blank" rel="noopener noreferrer">Open the photo directly</a></p>}
   </div><div className="gp-viewer-bottom"><button onClick={()=>move(-1)} aria-label="Previous photo">←</button><div aria-live="polite"><span>{active.category} · {index+1} / {visible.length}</span><h2>{active.title}</h2></div><button onClick={()=>move(1)} aria-label="Next photo">→</button></div></>}
  </dialog>
 </div>;
}
