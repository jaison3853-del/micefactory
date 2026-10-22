import {useEffect,useRef,useState} from 'react';
import bare from './assets/wedding-bare.webp';
import fabric from './assets/wedding-draped.webp';
import final from './assets/wedding-final.webp';
import './BackstageLoader.css';

export default function BackstageLoader({reduced,onReady}) {
 const dialog=useRef(null);
 const callbacks=useRef({onReady,reduced}); callbacks.current={onReady,reduced};
 const finish=useRef(()=>{});
 const [completed,setCompleted]=useState(0);
 const [opening,setOpening]=useState(false);
 const [hidden,setHidden]=useState(false);

 useEffect(()=>{
  const node=dialog.current;
  let active=true,ending=false,settled=0,exitTimer,introTimer;
  const started=performance.now();
  node.showModal();
  document.documentElement.classList.add('backstage-loading');
  const release=()=>{
   if(!active)return;
   active=false;clearTimeout(introTimer);clearTimeout(exitTimer);
   node.close();document.documentElement.classList.remove('backstage-loading');
   setHidden(true);callbacks.current.onReady();
  };
  const open=()=>{
   if(!active||ending)return;
   ending=true;setOpening(true);
   exitTimer=setTimeout(release,callbacks.current.reduced?120:2200);
  };
  finish.current=release;
  const assetsReady=()=>{
   const remaining=callbacks.current.reduced?0:Math.max(0,1800-(performance.now()-started));
   introTimer=setTimeout(open,remaining);
  };
  const check=()=>{if(!active||ending)return;settled++;setCompleted(settled);if(settled===4)assetsReady();};
  // Progress represents settled critical-asset checks, never a fabricated timer.
  for(const src of [bare,fabric,final]) {
   const image=new Image();image.src=src;
   image.decode().then(check,check);
  }
  Promise.all([document.fonts.load('800 24px "Manrope Variable"'),document.fonts.load('400 12px "IBM Plex Mono"')]).then(check,check);
  const timeout=setTimeout(open,6500); // An unavailable image must never trap the visitor.
  return()=>{active=false;clearTimeout(timeout);clearTimeout(introTimer);clearTimeout(exitTimer);node.close();document.documentElement.classList.remove('backstage-loading');};
 },[]);
 if(hidden)return null;
 return <dialog ref={dialog} className={`backstage-loader ${opening?'backstage-opening':''} ${reduced?'backstage-reduced':''}`} aria-label="Opening MICEFACTORY Events" onCancel={e=>{e.preventDefault();finish.current();}}>
  <div className="backstage-panel backstage-panel-left"/><div className="backstage-panel backstage-panel-right"/>
  <div className="backstage-spotlight" aria-hidden="true"/>
  <div className="backstage-content">
   <span className="backstage-eyebrow">BACKSTAGE / MICEFACTORY EVENTS</span>
   <div className="backstage-identity">
    <svg className="backstage-mark" viewBox="0 0 100 80" aria-hidden="true"><path pathLength="1" d="M10 70V10H25L50 48L75 10H90V70H74V36L50 72L26 36V70Z"/></svg>
    <div className="backstage-wordmark" aria-label="MICEFACTORY — Meetings, Incentives, Conferences, Events"><strong>MICEFACTORY</strong><span>MEETINGS | INCENTIVES | CONFERENCES <b>| EVENTS</b></span></div>
   </div>
   <p className="backstage-message" role="status">{opening?'YOUR MOMENT AWAITS.':'SETTING THE STAGE.'}</p>
   <div className="backstage-progress" role="progressbar" aria-label="Opening asset checks" aria-valuemin={0} aria-valuemax={4} aria-valuenow={completed}><span style={{transform:`scaleX(${completed/4})`}}/></div>
   <button className="backstage-enter" onClick={()=>finish.current()}>ENTER WEBSITE <span aria-hidden="true">↗</span></button>
  </div>
 </dialog>;
}
