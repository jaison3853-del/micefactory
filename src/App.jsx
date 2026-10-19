import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { services, phone, displayPhone, whatsappUrl } from "./content.js";

const WeddingStage = lazy(() => import("./WeddingStage.jsx"));

gsap.registerPlugin(ScrollTrigger);
const Arrow = ({ diagonal = false, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);
const Mark = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path
      d="M5 36V12h6l13 17 13-17h6v24h-7V24L24 39 12 24v12Z"
      fill="currentColor"
    />
  </svg>
);

function Brand({ footer = false }) {
  return (
    <a
      className={`brand ${footer ? "brand-footer" : ""}`}
      href="#home"
      aria-label="MICEFACTORY Events home"
    >
      <span>MICEFACTORY</span>
      <span className="brand-description">
        MEETINGS / INCENTIVES / CONFERENCES / <b>EVENTS</b>
      </span>
    </a>
  );
}

function Photo({ image, alt, className = "", lazy = true }) {
  // The brochure is supplied as full-page images; this viewport presents its photography without modifying it.
  const style = {
    width: `${(1024 / image.w) * 100}%`,
    height: `${(1536 / image.h) * 100}%`,
    left: `${(-image.x / image.w) * 100}%`,
    top: `${(-image.y / image.h) * 100}%`,
  };
  const viewport = {
    width: `max(100cqw, ${(image.w / image.h) * 100}cqh)`,
    height: `max(100cqh, ${(image.h / image.w) * 100}cqw)`,
  };
  return (
    <div className={`photo ${className}`}>
      <div className="photo-viewport" style={viewport}>
        <img
          src={`/images/brand-${image.page}.jpeg`}
          alt={alt}
          loading={lazy ? "lazy" : "eager"}
          style={style}
        />
      </div>
    </div>
  );
}

function SoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const sound = useRef(null);
  useEffect(
    () => () => {
      sound.current?.context.close();
    },
    [],
  );
  const toggle = async () => {
    try {
      if (!sound.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = new AudioContext();
        const gain = context.createGain();
        gain.gain.value = 0;
        gain.connect(context.destination);
        [110, 164.81, 220.25].forEach((frequency) => {
          const oscillator = context.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          oscillator.connect(gain);
          oscillator.start();
        });
        sound.current = { context, gain };
      }
      const { context, gain } = sound.current;
      await context.resume();
      gain.gain.setTargetAtTime(enabled ? 0 : 0.018, context.currentTime, 0.4);
      setEnabled(!enabled);
    } catch {
      setEnabled(false);
    }
  };
  return (
    <button
      className={`sound-toggle mono ${enabled ? "is-on" : ""}`}
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn ambient sound off" : "Turn ambient sound on"}
    >
      <span className="sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      SOUND {enabled ? "ON" : "OFF"}
    </button>
  );
}

function Dialog({ label, onClose, children, className = "" }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    document.body.classList.add("dialog-open");
    return () => {
      document.body.classList.remove("dialog-open");
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`dialog ${className}`}
      aria-label={label}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-lenis-prevent
    >
      <div className="dialog-inner">
        <button
          className="close-dialog mono"
          onClick={onClose}
          aria-label="Close dialog"
        >
          CLOSE <span>×</span>
        </button>
        {children}
      </div>
    </dialog>
  );
}

function Inquiry({ initial, onClose }) {
  const [service, setService] = useState(initial || "Weddings & celebrations");
  const [submitted, setSubmitted] = useState(false);
  const [url, setUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [formValues, setFormValues] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setFormValues(Object.fromEntries(data.entries()));
    const message = `Hello MICEFACTORY! I'm ${data.get("name")}.\nI'd like to plan: ${service}.\nEvent date: ${data.get("date") || "To be decided"}.\nLocation: ${data.get("location") || "To be decided"}.\nDetails: ${data.get("details") || "Let’s discuss my event."}`;
    const destination = whatsappUrl(message);
    setBrief(message);
    setUrl(destination || "");
    setSubmitted(true);
    if (destination) window.open(destination, "_blank", "noopener,noreferrer");
  };
  const downloadBrief = () => {
    const objectUrl = URL.createObjectURL(
      new Blob([brief], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "micefactory-event-brief.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };
  return (
    <Dialog
      label="Plan your event"
      onClose={onClose}
      className="inquiry-dialog"
    >
      <span className="eyebrow mono">
        A GREAT EXPERIENCE STARTS WITH A CONVERSATION
      </span>
      <h2>
        Let’s make
        <br />
        it happen<span className="dot">.</span>
      </h2>
      {!submitted ? (
        <form onSubmit={submit}>
          <div className="form-row">
            <label>
              Your name{" "}
              <input
                autoComplete="name"
                name="name"
                defaultValue={formValues.name}
                placeholder="Your name"
                required
                maxLength={100}
              />
            </label>
            <label>
              What are we planning?
              <select
                name="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.number}>{s.title}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Event date <span>(optional)</span>
              <input
                name="date"
                type="date"
                defaultValue={formValues.date}
                min={new Date().toLocaleDateString("en-CA")}
              />
            </label>
            <label>
              Event location <span>(optional)</span>
              <input
                name="location"
                defaultValue={formValues.location}
                placeholder="City or venue"
                maxLength={160}
              />
            </label>
          </div>
          <label>
            Tell us a little more <span>(optional)</span>
            <textarea
              name="details"
              rows="3"
              defaultValue={formValues.details}
              placeholder="Your vision, guest count, the little things that matter…"
              maxLength={2000}
            />
          </label>
          <p className="form-note">
            {phone
              ? "Your details open in WhatsApp. Send the message there to start your enquiry."
              : "Create a personal event brief to save and share. Online enquiries will open soon."}
          </p>
          <button className="pill pill-dark" type="submit">
            {phone ? "CONTINUE ON WHATSAPP" : "CREATE MY EVENT BRIEF"}{" "}
            <Arrow diagonal />
          </button>
        </form>
      ) : (
        <div className="inquiry-success" role="status">
          <span className="success-icon">↗</span>
          <h3>
            {phone ? "Your next chapter awaits." : "Your event brief is ready."}
          </h3>
          <p>
            {phone
              ? "Your event brief is ready in WhatsApp. Send it there and let’s start creating."
              : "Save your ideas for your conversation with MICEFACTORY. Your brief has not been sent."}
          </p>
          {phone ? (
            <a
              className="pill pill-dark"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              OPEN WHATSAPP <Arrow diagonal />
            </a>
          ) : (
            <button className="pill pill-dark" onClick={downloadBrief}>
              DOWNLOAD YOUR BRIEF <Arrow diagonal />
            </button>
          )}
          <button
            className="text-button mono"
            onClick={() => setSubmitted(false)}
          >
            EDIT MY DETAILS
          </button>
        </div>
      )}
      {phone ? (
        <a href={`tel:${phone}`} className="form-call mono">
          PREFER A CALL? {displayPhone}
        </a>
      ) : (
        <span className="form-call mono">
          MICEFACTORY EVENTS / KOTHAMANGALAM, KERALA
        </span>
      )}
    </Dialog>
  );
}

export default function App() {
  const root = useRef(null);
  const lenis = useRef(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState(0);
  const [solidHeader, setSolidHeader] = useState(false);
  const [menu, setMenu] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [inquiry, setInquiry] = useState(null);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const onReady = useCallback(() => setReady(true), []);
  const onPhase = useCallback((value) => setPhase(value), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const smooth = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      anchors: true,
    });
    lenis.current = smooth;
    smooth.on("scroll", ScrollTrigger.update);
    const tick = (time) => smooth.raf(time * 1000);
    gsap.ticker.add(tick);
    const context = gsap.context(() => {
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 55, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          },
        );
      });
      gsap.fromTo(
        ".story-heading .dim",
        { color: "#424440" },
        {
          color: "#eff0e9",
          stagger: 0.15,
          scrollTrigger: {
            trigger: ".story-heading",
            start: "top 80%",
            end: "bottom 35%",
            scrub: 1,
          },
        },
      );
    }, root);
    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      smooth.destroy();
      lenis.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    if (menu || activeService || inquiry !== null) lenis.current?.stop();
    else lenis.current?.start();
  }, [menu, activeService, inquiry]);

  useEffect(() => {
    const timer = setTimeout(onReady, 3000);
    return () => clearTimeout(timer);
  }, [onReady]);

  useEffect(() => {
    const update = () =>
      setSolidHeader(
        window.scrollY > document.querySelector(".journey").offsetHeight - 90,
      );
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduced]);

  const openInquiry = (service = "") => {
    setMenu(false);
    setActiveService(null);
    setInquiry(service);
  };
  const navigate = (id) => {
    setMenu(false);
    requestAnimationFrame(() => {
      lenis.current?.start();
      if (lenis.current) lenis.current.scrollTo(id, { offset: -70 });
      else document.querySelector(id)?.scrollIntoView({ behavior: "auto" });
    });
  };

  return (
    <div
      ref={root}
      className={`${ready ? "is-ready" : "is-loading"} ${reduced ? "reduced-motion" : ""}`}
    >
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <div className="loading-screen" aria-hidden={ready}>
        <Mark />
        <span className="mono">MAKING ROOM FOR EXTRAORDINARY</span>
        <div className="loading-line" />
      </div>
      <header className={`header ${solidHeader ? "header-solid" : ""}`}>
        <Brand />
        <span className="header-note mono">
          IN THE BUSINESS OF
          <br />
          BRINGING PEOPLE TOGETHER.
        </span>
        <div className="header-actions">
          <button className="header-contact mono" onClick={() => openInquiry()}>
            LET’S TALK <Arrow diagonal />
          </button>
          <button
            className="menu-button"
            aria-label="Open navigation menu"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
        <section className="journey" id="home" aria-labelledby="hero-heading">
          <div className={`hero immersive-hero phase-${phase}`}>
            <div className="hero-scene">
              <Suspense fallback={null}>
                <WeddingStage
                  reduced={reduced}
                  onReady={onReady}
                  onPhase={onPhase}
                />
              </Suspense>
            </div>
            <div className="world-vignette" aria-hidden="true" />
            <div className="world-copyright mono">
              /// INDEPENDENT EVENT STUDIO
              <br />
              <br />
              MICEFACTORY EVENTS.
              <br />
              PEOPLE. IDEAS. POSSIBILITIES.
            </div>
            <aside className="world-manifesto mono">
              <span>////// Manifesto</span>
              <p>
                We believe the most
                <br />
                extraordinary experiences
                <br />
                begin with connection.
                <br />
                Between people. Between
                <br />
                ideas. Between what is
                <br />
                and what could be.
              </p>
              <button onClick={() => navigate("#about")}>
                [ DISCOVER US ↗ ]
              </button>
            </aside>
            <div className="world-reticle" aria-hidden="true">
              <span>+</span>
              <span>+</span>
            </div>
            <div className="world-heading" key={phase}>
              <span className="mono">
                {
                  [
                    "001 / THE EMPTY CANVAS",
                    "002 / COMING TO LIFE",
                    "003 / THE FINAL REVEAL",
                    "004 / LIGHTS. LIFE. CELEBRATION.",
                  ][phase]
                }
              </span>
              <h1 id="hero-heading">
                {
                  [
                    "It starts with a vision.",
                    "Made with love.",
                    "Your moment. Made.",
                    "Let the evening glow.",
                  ][phase]
                }
              </h1>
              <p className="mono">
                {
                  [
                    "AN EMPTY STAGE. ENDLESS POSSIBILITIES.",
                    "FABRIC UNFOLDS. FLOWERS BLOOM. DETAILS FALL INTO PLACE.",
                    "EVERY DETAIL IN PLACE. YOUR STAGE IS SET.",
                    "THE LIGHTS COME ON. THE MEMORY BEGINS.",
                  ][phase]
                }
              </p>
            </div>
            <div className="world-coordinates mono">
              <span>10° N / 77° E</span>
              <span>KOTHAMANGALAM, KERALA</span>
              <button onClick={() => navigate("#expertise")}>
                [ EXPLORE EXPERIENCES ↗ ]
              </button>
            </div>
            <div className="hero-bottom">
              <SoundToggle />
              <button
                className="scroll-cue mono"
                onClick={() => {
                  if (phase === 3 || reduced) navigate("#about");
                  else {
                    const journey = document.querySelector(".journey");
                    const target = journey.offsetTop + (journey.offsetHeight - innerHeight) * [0.48, 0.74, 0.97][phase];
                    if (lenis.current) lenis.current.scrollTo(target);
                    else window.scrollTo({ top: target, behavior: "smooth" });
                  }
                }}
              >
                <span className="scroll-line" />
                {phase === 3
                  ? "DISCOVER MICEFACTORY"
                  : "SCROLL TO CREATE"}{" "}
                <span>↓</span>
              </button>
              <span className="world-index mono">
                0{phase + 1} <span>/ 04</span>
              </span>
            </div>
          </div>
        </section>

        <section
          className="story section-dark"
          id="about"
          aria-labelledby="about-heading"
        >
          <div className="section-top mono">
            <span>
              <span className="section-number">01 /</span> THE MICEFACTORY WAY
            </span>
            <span>CONNECTION IS EVERYTHING.</span>
          </div>
          <div className="story-layout">
            <div className="story-symbol" aria-hidden="true">
              <svg viewBox="0 0 100 100">
                {[0, 45, 90, 135].map((angle) => (
                  <path
                    key={angle}
                    d="M50 0V100"
                    transform={`rotate(${angle} 50 50)`}
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                ))}
              </svg>
            </div>
            <div>
              <h2 className="story-heading" id="about-heading">
                <span>Some moments</span>
                <br />
                <span className="dim">stay with you.</span>
                <br />
                <span className="dim">We create those.</span>
              </h2>
              <div className="story-copy" data-reveal>
                <span className="mono">A LITTLE ABOUT US</span>
                <div>
                  <p>
                    We’re MICEFACTORY Events. A collective of thinkers, planners
                    and makers turning your ideas into experiences that bring
                    people closer.
                  </p>
                  <p>
                    From a celebration that feels like you to a stage that moves
                    a thousand minds — we bring creative concepts, thoughtful
                    planning and a passion for the details.
                  </p>
                  <a
                    href="/micefactory-events.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="underlined-link mono"
                  >
                    MEET MICEFACTORY <Arrow diagonal />
                    <span className="link-note">COMPANY PROFILE · PDF</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="principles" data-reveal>
            {[
              ["01", "People", "at the heart."],
              ["02", "Ideas", "that inspire."],
              ["03", "Details", "that matter."],
              ["04", "Experiences", "that last."],
            ].map(([n, a, b]) => (
              <div key={n}>
                <span className="mono">({n})</span>
                <p>
                  {a}
                  <br />
                  <span>{b}</span>
                </p>
                <span className="principle-plus">+</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="services section-light"
          id="expertise"
          aria-labelledby="services-heading"
        >
          <div className="section-top mono">
            <span>
              <span className="section-number">02 /</span> OUR EXPERTISE
            </span>
            <span>DIFFERENT OCCASIONS. ONE PASSION.</span>
          </div>
          <div className="section-heading" data-reveal>
            <h2 id="services-heading">
              One vision.
              <br />
              Endless possibilities<span className="dot">.</span>
            </h2>
            <p>
              Your vision. Our expertise.
              <br />
              One exceptional experience.
            </p>
          </div>
          <div className="services-list">
            {services.map((service) => (
              <button
                className="service-row"
                key={service.number}
                onClick={() => setActiveService(service)}
                data-reveal
              >
                <span className="service-num mono">({service.number})</span>
                <span className="service-title">{service.title}</span>
                <span className="service-preview">
                  <Photo image={service.image} alt="" />
                </span>
                <span className="service-arrow">
                  <Arrow diagonal />
                </span>
                <span className="sr-only">View details</span>
              </button>
            ))}
          </div>
          <p className="service-footnote mono">
            FROM THE FIRST IDEA TO THE FINAL APPLAUSE. WE’RE WITH YOU.
          </p>
        </section>

        <section
          className="experiences section-dark"
          id="experiences"
          aria-labelledby="experiences-heading"
        >
          <div className="section-top mono">
            <span>
              <span className="section-number">03 /</span> A WORLD OF
              EXPERIENCES
            </span>
            <span>NOT JUST SEEN. FELT.</span>
          </div>
          <div className="experience-heading" data-reveal>
            <h2 id="experiences-heading">
              Made to
              <br />
              <span>be remembered.</span>
            </h2>
            <p>
              Beautiful spaces. Real connections.
              <br />
              The kind of moments you take with you.
            </p>
          </div>
          <div className="experience-grid">
            <button
              className="experience-card experience-card-large"
              onClick={() => setActiveService(services[0])}
              data-reveal
            >
              <Photo
                image={{ page: 3, x: 530, y: 180, w: 488, h: 430 }}
                alt="A candlelit wedding aisle leading to a flower-covered celebration stage"
              />
              <span className="photo-shade" />
              <span className="card-category mono">
                01 / WEDDINGS & CELEBRATIONS
              </span>
              <span className="card-heading">
                A little magic.
                <br />A lifetime of memories.
              </span>
              <span className="card-arrow">
                <Arrow diagonal />
              </span>
            </button>
            <button
              className="experience-card"
              onClick={() => setActiveService(services[1])}
              data-reveal
            >
              <Photo
                image={services[1].image}
                alt="Conference auditorium with blue lighting and a presentation stage"
              />
              <span className="photo-shade" />
              <span className="card-category mono">
                02 / CORPORATE EXPERIENCES
              </span>
              <span className="card-heading">
                Ideas meet
                <br />
                impact.
              </span>
              <span className="card-arrow">
                <Arrow diagonal />
              </span>
            </button>
            <button
              className="experience-card"
              onClick={() => setActiveService(services[4])}
              data-reveal
            >
              <Photo
                image={services[4].image}
                alt="Live performers on stage surrounded by dramatic concert lighting"
              />
              <span className="photo-shade" />
              <span className="card-category mono">
                03 / LIVE & EXTRAORDINARY
              </span>
              <span className="card-heading">
                Feel every
                <br />
                moment.
              </span>
              <span className="card-arrow">
                <Arrow diagonal />
              </span>
            </button>
          </div>
          <div className="experience-caption mono">
            <span>AN EXPRESSION OF WHAT WE CREATE.</span>
            <span>
              YOUR STORY COULD BE NEXT.{" "}
              <button
                onClick={() => openInquiry()}
                aria-label="Enquire about your event"
              >
                <Arrow diagonal />
              </button>
            </span>
          </div>
        </section>

        <section
          className="process section-light"
          id="approach"
          aria-labelledby="process-heading"
        >
          <div className="section-top mono">
            <span>
              <span className="section-number">04 /</span> FROM VISION TO
              REALITY
            </span>
            <span>THOUGHTFULLY PLANNED. BEAUTIFULLY FELT.</span>
          </div>
          <div className="process-layout">
            <div data-reveal>
              <h2 id="process-heading">
                Good people.
                <br />
                Great events<span className="dot">.</span>
              </h2>
              <p>
                Consider us an extension of your team.
                <br />
                We listen, imagine, and make it happen.
              </p>
              <button className="pill" onClick={() => openInquiry()}>
                LET’S CREATE SOMETHING <Arrow diagonal />
              </button>
            </div>
            <div className="process-steps">
              {[
                [
                  "01",
                  "Plan.",
                  "It starts with you. Your story, your ambition, your people. We listen closely and shape a plan around what matters.",
                ],
                [
                  "02",
                  "Create.",
                  "From the big idea to the smallest detail, we bring creative direction, design and production into one shared vision.",
                ],
                [
                  "03",
                  "Experience.",
                  "Be in the moment. We take care of the moving parts, so you can enjoy the connections, the joy and the memories.",
                ],
              ].map(([n, title, text]) => (
                <div className="process-step" key={n} data-reveal>
                  <span className="mono">({n})</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <span>↗</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="contact section-dark"
          id="contact"
          aria-labelledby="contact-heading"
        >
          <div className="section-top mono">
            <span>
              <span className="section-number">05 /</span> YOUR NEXT GREAT
              MOMENT
            </span>
            <span>
              <i className="status-dot" /> OPEN TO EXTRAORDINARY IDEAS
            </span>
          </div>
          <button
            className="contact-title"
            onClick={() => openInquiry()}
            data-reveal
          >
            <h2 id="contact-heading">
              Let’s make
              <br />
              <span>memories.</span>
            </h2>
            <span className="contact-circle">
              <Arrow diagonal />
            </span>
          </button>
          <div className="contact-bottom">
            <p>
              A corporate milestone. A dream wedding.
              <br />
              Something the world hasn’t seen yet.
              <br />
              <span>Let’s bring it to life.</span>
            </p>
            {phone ? (
              <a className="contact-phone" href={`tel:${phone}`}>
                {displayPhone} <Arrow diagonal />
              </a>
            ) : (
              <button className="contact-phone" onClick={() => openInquiry()}>
                Plan your experience <Arrow diagonal />
              </button>
            )}
            <div className="contact-place mono">
              BASED IN KOTHAMANGALAM,
              <br />
              KERALA. THINKING EVERYWHERE.
            </div>
          </div>
        </section>
      </main>
      <footer className="footer section-dark">
        <Brand footer />
        <div className="footer-right mono">
          <span>© {new Date().getFullYear()} MICEFACTORY EVENTS</span>
          <button onClick={() => setReduced(!reduced)} aria-pressed={!reduced}>
            MOTION {reduced ? "OFF" : "ON"}
          </button>
          <button onClick={() => navigate("#home")}>BACK TO TOP ↑</button>
        </div>
      </footer>

      {menu && (
        <Dialog
          label="Navigation"
          onClose={() => setMenu(false)}
          className="menu-dialog"
        >
          <span className="eyebrow mono">
            PEOPLE. IDEAS. SPACES. EXPERIENCES.
          </span>
          <nav aria-label="Main navigation">
            {[
              ["01", "Our story", "#about"],
              ["02", "Expertise", "#expertise"],
              ["03", "Experiences", "#experiences"],
              ["04", "Our approach", "#approach"],
              ["05", "Let’s talk", "#contact"],
            ].map(([n, label, target]) => (
              <a
                key={n}
                href={target}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(target);
                }}
              >
                <span className="mono">{n}</span>
                {label}
                <Arrow diagonal />
              </a>
            ))}
          </nav>
          <div className="menu-bottom mono">
            <span>KOTHAMANGALAM, KERALA</span>
            {phone ? (
              <a href={`tel:${phone}`}>{displayPhone} ↗</a>
            ) : (
              <button onClick={() => openInquiry()}>
                PLAN YOUR EXPERIENCE ↗
              </button>
            )}
          </div>
        </Dialog>
      )}
      {activeService && (
        <Dialog
          label={activeService.title}
          onClose={() => setActiveService(null)}
          className="service-dialog"
        >
          <Photo
            image={activeService.image}
            alt={`${activeService.short} imagery from the MICEFACTORY brochure`}
            lazy={false}
          />
          <div className="service-dialog-copy">
            <span className="eyebrow mono">
              OUR EXPERTISE / {activeService.number}
            </span>
            <h2>{activeService.title}</h2>
            <h3>{activeService.subtitle}</h3>
            <p>{activeService.description}</p>
            <ul>
              {activeService.includes.map((item) => (
                <li key={item}>
                  {item}
                  <span>↗</span>
                </li>
              ))}
            </ul>
            <button
              className="pill pill-dark"
              onClick={() => openInquiry(activeService.title)}
            >
              PLAN YOUR EXPERIENCE <Arrow diagonal />
            </button>
          </div>
        </Dialog>
      )}
      {inquiry !== null && (
        <Inquiry initial={inquiry} onClose={() => setInquiry(null)} />
      )}
    </div>
  );
}
