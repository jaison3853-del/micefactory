import {useEffect,useRef} from 'react';
import './AdvancedCursor.css';
export default function AdvancedCursor({reduced}) {
 const root=useRef(null);
 useEffect(()=>{
  const node=root.current;
  const media=matchMedia('(hover:hover) and (pointer:fine)');
  let raf=0,x=0,y=0,rx=0,ry=0,visible=false;
  const hide=()=>{visible=false;node.classList.remove('cursor-visible');document.documentElement.classList.remove('custom-cursor-active');cancelAnimationFrame(raf);raf=0;};
  const render=()=>{raf=0;if(!visible)return;rx+=(x-rx)*.22;ry+=(y-ry)*.22;node.style.setProperty('--cursor-x',`${x}px`);node.style.setProperty('--cursor-y',`${y}px`);node.style.setProperty('--ring-x',`${rx}px`);node.style.setProperty('--ring-y',`${ry}px`);if(Math.abs(x-rx)+Math.abs(y-ry)>.2)raf=requestAnimationFrame(render);};
  const move=e=>{
   if(reduced||!media.matches||e.pointerType==='touch'||e.target.closest('dialog,input,textarea,select,[contenteditable="true"]')){hide();return;}
   x=e.clientX;y=e.clientY;
   if(!visible){rx=x;ry=y;visible=true;node.classList.add('cursor-visible');document.documentElement.classList.add('custom-cursor-active');}
   const target=e.target.closest('button,a,summary');
   const explore=e.target.closest('.experience-card,.service-row,.event-outline');
   const mode=explore?'explore':target?'action':'default';
   node.dataset.mode=mode;node.querySelector('.cursor-label').textContent=explore?'EXPLORE':target?'↗':'';
   if(!raf)raf=requestAnimationFrame(render);
  };
  const press=()=>{if(visible)node.querySelector('.cursor-pulse').animate([{opacity:.8,transform:'translate(-50%,-50%) scale(.4)'},{opacity:0,transform:'translate(-50%,-50%) scale(2)'}],{duration:550,easing:'ease-out'});};
  const keyboard=e=>{if(e.key==='Tab'||e.key==='Escape')hide();};
  document.addEventListener('pointermove',move);document.addEventListener('pointerdown',press);document.addEventListener('keydown',keyboard);document.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);document.addEventListener('visibilitychange',hide);media.addEventListener('change',hide);
  return()=>{hide();document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',press);document.removeEventListener('keydown',keyboard);document.removeEventListener('pointerleave',hide);window.removeEventListener('blur',hide);document.removeEventListener('visibilitychange',hide);media.removeEventListener('change',hide);};
 },[reduced]);
 return <div ref={root} className="advanced-cursor" aria-hidden="true" data-mode="default"><span className="cursor-dot"/><span className="cursor-ring"><i/><b className="cursor-label"/></span><span className="cursor-pulse"/></div>;
}
