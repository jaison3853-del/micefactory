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
const atmospheres=['Timeless elegance','Bold & theatrical','Natural & intimate'];

export default function EventExperiences({reduced, onPlan}) {
  const root=useRef(null);
  const [service,setService]=useState(services[0].title);
  const [guests,setGuests]=useState(150);
  const [mood,setMood]=useState(atmospheres[0]);
  const [details,setDetails]=useState(['Décor & styling','Lighting & sound']);
  useEffect(()=>{
    const context=gsap.context(()=>{
      if(reduced) return;
      gsap.utils.toArray('.event-world').forEach(panel=>{
        gsap.fromTo(panel.querySelector('.event-world-image'),{yPercent:-5,scale:1.08},{yPercent:5,scale:1,ease:'none',scrollTrigger:{trigger:panel,start:'top bottom',end:'bottom top',scrub:.6}});
        gsap.fromTo(panel.querySelector('.event-world-copy'),{y:65,opacity:0},{y:0,opacity:1,duration:1,scrollTrigger:{trigger:panel,start:'top 65%',toggleActions:'play none none reverse',onEnter:()=>window.dispatchEvent(new Event('mice:chapter'))}});
      });
      gsap.to('.event-marquee-track',{xPercent:-20,ease:'none',scrollTrigger:{trigger:'.event-marquee',start:'top bottom',end:'bottom top',scrub:1}});
      gsap.fromTo('.event-planner-heading',{y:40,opacity:0},{y:0,opacity:1,duration:.8,scrollTrigger:{trigger:'.event-planner',start:'top 75%'}});
    },root);
    const refresh = requestAnimationFrame(()=>ScrollTrigger.refresh());
    return ()=>{ cancelAnimationFrame(refresh); context.revert(); };
  },[reduced]);
  const toggleDetail=value=>setDetails(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]);
  const brief=`Guest count: ${guests}${guests===1000?'+':''}.\nAtmosphere: ${mood}.\nInterested in: ${details.length?details.join(', '):'Full planning consultation'}.`;
  return <div className="event-extension" ref={root}>
    <section className="event-edit-intro" id="inspiration" aria-labelledby="event-edit-title">
      <span className="mono">THE INSPIRATION EDIT / IMAGINE WHAT’S POSSIBLE</span>
      <h2 id="event-edit-title">Different worlds.<br/><em>One unforgettable feeling.</em></h2>
      <p>A little inspiration for your next occasion. Every experience begins with a conversation — and becomes something uniquely yours.</p>
      <span className="event-concept-note mono">CONCEPT VISUALS · CREATIVE DIRECTIONS, NOT CLIENT PROJECT PHOTOGRAPHS</span>
    </section>
    {worlds.map(world=><section className={`event-world event-world-${world.id}`} key={world.id} aria-labelledby={`${world.id}-title`}>
      <picture className="event-world-image"><source type="image/webp" srcSet={`/images/events/${world.image}-800.webp 800w, /images/events/${world.image}-1600.webp 1600w, /images/events/${world.image}-full.webp 1672w`} sizes="100vw"/><img src={`/images/events/${world.image}-1600.webp`} alt={world.alt} width="1672" height={world.id === 'garden' ? 941 : 940} loading="lazy" decoding="async"/></picture>
      <div className="event-world-shade"/>
      <div className="event-world-copy"><span className="mono">{world.tag}</span><h2 id={`${world.id}-title`}>{world.title}</h2><p>{world.text}</p><button className="event-outline mono" onClick={()=>onPlan(world.service)}>CREATE YOUR VERSION <span>↗</span></button></div>
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
