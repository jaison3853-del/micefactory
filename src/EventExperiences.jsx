import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { services } from './content.js';
import './EventExperiences.css';

gsap.registerPlugin(ScrollTrigger);
const worlds = [
  {id:'garden', image:'wedding', title:'Under a sky of possibilities.', tag:'01 / WEDDINGS & CELEBRATIONS', text:'An open sky. A thousand little lights. A celebration that feels entirely yours.', service:'Weddings & celebrations', alt:'Concept of a candlelit garden wedding with ivory flowers, palms and elegant banquet tables'},
  {id:'gala', image:'gala', title:'Give your big idea a bigger stage.', tag:'02 / GALAS & CORPORATE EVENTS', text:'From the first welcome to the final applause. Every detail, working together.', service:'Corporate events', alt:'Concept of a corporate gala with golden stage architecture and beautifully dressed banquet tables'},
];
function MotionWords({text}) {
  return <span><span className="sr-only">{text}</span>{text.split(' ').map((word,i)=><span className="motion-word-mask" aria-hidden="true" key={i}><span className="motion-word">{word}&nbsp;</span></span>)}</span>;
}
const atmospheres=['Timeless elegance','Bold & theatrical','Natural & intimate'];

export default function EventExperiences({reduced, onPlan}) {
  const root=useRef(null);
  const [service,setService]=useState(services[0].title);
  const [guests,setGuests]=useState(150);
  const [mood,setMood]=useState(atmospheres[0]);
  const [details,setDetails]=useState(['Décor & styling','Lighting & sound']);
  useEffect(()=>{
    const cleanups=[];
    const context=gsap.context(()=>{
      if(reduced) return;
      if(matchMedia('(hover: hover) and (pointer: fine)').matches) {
        root.current.querySelectorAll('.event-world').forEach(panel=>{
          const move=e=>{
            const rect=panel.getBoundingClientRect();
            panel.style.setProperty('--pointer-x',`${(e.clientX-rect.left)/rect.width*100}%`);
            panel.style.setProperty('--pointer-y',`${(e.clientY-rect.top)/rect.height*100}%`);
            panel.classList.add('pointer-lit');
          };
          const leave=()=>panel.classList.remove('pointer-lit');
          panel.addEventListener('pointermove',move); panel.addEventListener('pointerleave',leave);
          cleanups.push(()=>{panel.removeEventListener('pointermove',move);panel.removeEventListener('pointerleave',leave);leave();});
        });
        root.current.querySelectorAll('.event-outline,.planner-submit').forEach(button=>{
          const x=gsap.quickTo(button,'x',{duration:.35,ease:'power3.out'});
          const y=gsap.quickTo(button,'y',{duration:.35,ease:'power3.out'});
          const move=e=>{const r=button.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.12);y((e.clientY-r.top-r.height/2)*.2);};
          const leave=()=>{x(0);y(0);};
          button.addEventListener('pointermove',move);button.addEventListener('pointerleave',leave);
          cleanups.push(()=>{button.removeEventListener('pointermove',move);button.removeEventListener('pointerleave',leave);});
        });
        document.querySelectorAll('.experience-card').forEach(card=>{
          const photo=card.querySelector('.photo');
          if(!photo) return;
          const rx=gsap.quickTo(photo,'rotationX',{duration:.5});
          const ry=gsap.quickTo(photo,'rotationY',{duration:.5});
          const zoom=gsap.quickTo(photo,'scale',{duration:.5});
          const move=e=>{const r=card.getBoundingClientRect();rx(-(e.clientY-r.top-r.height/2)/r.height*8);ry((e.clientX-r.left-r.width/2)/r.width*8);zoom(1.06);};
          const leave=()=>{rx(0);ry(0);zoom(1);};
          card.addEventListener('pointermove',move);card.addEventListener('pointerleave',leave);
          cleanups.push(()=>{card.removeEventListener('pointermove',move);card.removeEventListener('pointerleave',leave);});
        });
      }
      const overture=root.current.querySelector('.motion-overture');
      const journey=gsap.timeline({scrollTrigger:{trigger:overture,start:'top top',end:'bottom bottom',scrub:.7}});
      journey.fromTo('.overture-card-one',{xPercent:-85,yPercent:18,rotation:-18,scale:.8},{xPercent:0,yPercent:0,rotation:-7,scale:1,duration:1},0)
        .fromTo('.overture-card-two',{xPercent:85,yPercent:-18,rotation:18,scale:.8},{xPercent:0,yPercent:0,rotation:9,scale:1,duration:1},0)
        .fromTo('.overture-type',{scale:.8,opacity:.25},{scale:1,opacity:1,duration:1},0)
        .to('.overture-card-one',{xPercent:-30,yPercent:-20,rotation:-12,duration:.7},1)
        .to('.overture-card-two',{xPercent:30,yPercent:20,rotation:13,duration:.7},1)
        .fromTo('.overture-caption',{y:25,opacity:0},{y:0,opacity:1,duration:.5},1)
        .fromTo('.overture-progress',{scaleX:0},{scaleX:1,ease:'none',duration:1.7},0);
      gsap.fromTo('.event-edit-intro .motion-word',{yPercent:110,rotation:5},{yPercent:0,rotation:0,stagger:.07,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.event-edit-intro',start:'top 75%',toggleActions:'play none none reverse'}});
      gsap.utils.toArray('.event-world').forEach(panel=>{
        gsap.fromTo(panel,{clipPath:'inset(8% 6% round 48px)'},{clipPath:'inset(0% 0% round 0px)',ease:'none',scrollTrigger:{trigger:panel,start:'top 95%',end:'top 10%',scrub:.45}});
        ScrollTrigger.create({trigger:panel,start:'top bottom',end:'bottom top',onToggle:self=>panel.classList.toggle('world-active',self.isActive)});
        gsap.fromTo(panel.querySelectorAll('.motion-word'),{yPercent:115,rotation:4},{yPercent:0,rotation:0,stagger:.065,duration:.85,ease:'power3.out',scrollTrigger:{trigger:panel,start:'top 65%',toggleActions:'play none none reverse'}});
        gsap.fromTo(panel.querySelector('.event-world-image'),{yPercent:-8,scale:1.23},{yPercent:8,scale:1.04,ease:'none',scrollTrigger:{trigger:panel,start:'top bottom',end:'bottom top',scrub:.6}});
        gsap.fromTo(panel.querySelector('.event-world-copy'),{y:65,opacity:0},{y:0,opacity:1,duration:1,scrollTrigger:{trigger:panel,start:'top 65%',toggleActions:'play none none reverse',onEnter:()=>window.dispatchEvent(new Event('mice:chapter'))}});
      });
      gsap.to('.planner-orbit',{rotation:270,ease:'none',scrollTrigger:{trigger:'.event-planner',start:'top bottom',end:'bottom top',scrub:1}});
      gsap.to('.event-marquee-track',{xPercent:-20,ease:'none',scrollTrigger:{trigger:'.event-marquee',start:'top bottom',end:'bottom top',scrub:1}});
      gsap.fromTo('.event-planner-heading',{y:40,opacity:0},{y:0,opacity:1,duration:.8,scrollTrigger:{trigger:'.event-planner',start:'top 75%'}});
    },root);
    const refresh = requestAnimationFrame(()=>ScrollTrigger.refresh());
    return ()=>{ cancelAnimationFrame(refresh); cleanups.forEach(cleanup=>cleanup()); context.revert(); root.current?.querySelectorAll('.world-active').forEach(el=>el.classList.remove('world-active')); };
  },[reduced]);
  const toggleDetail=value=>setDetails(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]);
  const brief=`Guest count: ${guests}${guests===1000?'+':''}.\nAtmosphere: ${mood}.\nInterested in: ${details.length?details.join(', '):'Full planning consultation'}.`;
  return <div className="event-extension" ref={root}>
    <section className="event-edit-intro" id="inspiration" aria-labelledby="event-edit-title">
      <span className="mono">THE INSPIRATION EDIT / IMAGINE WHAT’S POSSIBLE</span>
      <h2 id="event-edit-title"><MotionWords text="Different worlds."/><br/><em><MotionWords text="One unforgettable feeling."/></em></h2>
      <p>A little inspiration for your next occasion. Every experience begins with a conversation — and becomes something uniquely yours.</p>
      <span className="event-concept-note mono">CONCEPT VISUALS · CREATIVE DIRECTIONS, NOT CLIENT PROJECT PHOTOGRAPHS</span>
    </section>
    <section className="motion-overture" aria-label="Beyond the expected — event inspiration">
      <div className="overture-sticky">
        <span className="overture-eyebrow mono">GOOD IS A STARTING POINT. / WE GO FURTHER.</span>
        <div className="overture-orbit" aria-hidden="true"/>
        <div className="overture-card overture-card-one"><img src="/images/events/wedding-800.webp" alt="Garden wedding concept" width="800" height="450" loading="lazy"/></div>
        <div className="overture-card overture-card-two"><img src="/images/events/gala-800.webp" alt="Golden gala concept" width="800" height="450" loading="lazy"/></div>
        <h2 className="overture-type">BEYOND<br/><em>THE EXPECTED.</em></h2>
        <p className="overture-caption mono">THE ATMOSPHERE. THE ENERGY. THE WAY IT MAKES YOU FEEL.</p>
        <div className="overture-progress" aria-hidden="true"/>
      </div>
    </section>
    {worlds.map(world=><section className={`event-world event-world-${world.id}`} key={world.id} aria-labelledby={`${world.id}-title`}>
      <picture className="event-world-image"><source type="image/webp" srcSet={`/images/events/${world.image}-800.webp 800w, /images/events/${world.image}-1600.webp 1600w, /images/events/${world.image}-full.webp 1672w`} sizes="100vw"/><img src={`/images/events/${world.image}-1600.webp`} alt={world.alt} width="1672" height={world.id === 'garden' ? 941 : 940} loading="lazy" decoding="async"/></picture>
      <div className="event-atmosphere" aria-hidden="true"><i className="event-light-sweep"/>{Array.from({length:8},(_,i)=><i className="event-spark" key={i} style={{left:`${9+i*12}%`,top:`${15+(i*19)%65}%`,'--spark-delay':`${-i*1.3}s`}}/>)}</div><div className="event-pointer-light" aria-hidden="true"/><div className="event-world-shade"/>
      <div className="event-world-copy"><span className="mono">{world.tag}</span><h2 id={`${world.id}-title`}><MotionWords text={world.title}/></h2><p>{world.text}</p><button className="event-outline mono" onClick={()=>onPlan(world.service)}>CREATE YOUR VERSION <span>↗</span></button></div>
      <span className="event-world-caption mono">MICEFACTORY / AN EXPRESSION OF POSSIBILITY</span>
    </section>)}
    <div className="event-marquee" aria-hidden="true"><div className="event-marquee-track">PEOPLE. <em>PLACES.</em> POSSIBILITIES. <em>PEOPLE.</em> PLACES. POSSIBILITIES.</div></div>
    <section className="event-planner" id="event-planner" aria-labelledby="planner-title">
      <div className="event-planner-heading"><span className="mono">YOUR EVENT, YOUR WAY / A STARTING POINT</span><h2 id="planner-title">Let’s shape<br/><em>your next moment.</em></h2><p>Build a little brief. We’ll bring the ideas, the experience and the attention to detail.</p><span className="planner-orbit" aria-hidden="true">✳</span></div>
      <div className="event-planner-controls">
        <label className="planner-select"><span className="mono">01 / THE OCCASION</span><select value={service} onChange={e=>setService(e.target.value)} aria-label="Planner event type">{services.map(s=><option key={s.number}>{s.title}</option>)}</select></label>
        <div className="planner-guests"><label htmlFor="planner-guests" className="mono">02 / YOUR PEOPLE <strong>{guests}{guests===1000?'+':''} GUESTS</strong></label><input id="planner-guests" type="range" min="20" max="1000" step="10" value={guests} onChange={e=>setGuests(Number(e.target.value))}/><div className="mono"><span>INTIMATE / 20</span><span>EXTRAORDINARY / 1000+</span></div></div>
        <fieldset><legend className="mono">03 / THE ATMOSPHERE</legend><div className="planner-chips">{atmospheres.map(value=><label key={value} className={mood===value?'selected':''}><input type="radio" name="event-atmosphere" value={value} checked={mood===value} onChange={()=>setMood(value)}/>{value}</label>)}</div></fieldset>
        <fieldset><legend className="mono">04 / THE DETAILS</legend><div className="planner-checks">{['Décor & styling','Lighting & sound','Guest hospitality','Entertainment','Venue coordination','Full event planning'].map(value=><label key={value}><input type="checkbox" checked={details.includes(value)} onChange={()=>toggleDetail(value)}/>{value}</label>)}</div></fieldset>
        <div className="planner-summary" aria-live="polite"><span className="mono">YOUR STARTING POINT</span><p>{service} · {guests}{guests===1000?'+':''} guests<br/>{mood}</p></div>
        <button className="planner-submit" onClick={()=>onPlan({service,details:brief})}>LET’S PLAN THIS <span>↗</span></button><p className="planner-note">Review your brief before opening WhatsApp. This is an enquiry, not a booking or price estimate.</p>
      </div>
    </section>
    <section className="event-faq" aria-labelledby="event-faq-title"><div><span className="mono">GOOD QUESTIONS. THOUGHTFUL ANSWERS.</span><h2 id="event-faq-title">Before the<br/><em>first hello.</em></h2></div><div>{[
      ['Where do we begin?','Start with your occasion, a location and an approximate guest count. Even if the details are still taking shape, your enquiry gives us a starting point for a conversation.'],
      ['Can we bring our own ideas?','Absolutely. Share the colours, references and little details you love. We can discuss how to shape them around your venue and occasion.'],
      ['What should our event brief include?','Your preferred date, city or venue, guest count, the atmosphere you have in mind, and the areas where you need support. A budget range is useful when you are ready to share it.'],
      ['Does sending an enquiry confirm a booking?','No. Your WhatsApp message starts a conversation. Scope, availability, pricing and booking terms need to be agreed directly with the team.'],
    ].map(([question,answer])=><details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
  </div>;
}
