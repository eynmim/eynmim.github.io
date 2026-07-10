import { useEffect, useRef } from 'react';

/* Kept — used by other sections for scroll-in reveals */
function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('in-view'); },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
export { ScrollReveal };

/* ──────────────────────────────────────────────────────────────
   SIGNAL HERO — "In his element" (candid).
   A cinematic looping clip of Ali at the workbench (soldering /
   inspecting a board) under warm orange light — not posing, not
   looking at camera. Type lives in the negative space. A subtle
   scroll parallax + fade hands off to the content.
   Drop /hero-work.mp4 in public/ to bring it to life; until then
   the poster (him soldering) shows.
   ────────────────────────────────────────────────────────────── */
export default function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const vid = root.querySelector('.sh-vid');
    const copy = root.querySelector('.sh-copy');
    const hint = root.querySelector('.sh-hint');
    let reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

    let raf = 0;
    const frame = () => {
      const r = root.getBoundingClientRect();
      const p = clamp(-r.top / (innerHeight || 1), 0, 1); // 0 at top → 1 when scrolled one screen
      if (vid) vid.style.transform = `scale(${1 + p * 0.14}) translateY(${p * 3}%)`;
      if (copy) { copy.style.opacity = `${1 - smooth(p * 1.5)}`; copy.style.transform = `translateY(${-p * 42}px)`; }
      if (hint) hint.style.opacity = p < 0.04 ? '0.7' : '0';
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="signal-hero" id="home" ref={rootRef}>
      <video className="sh-vid" autoPlay muted loop playsInline preload="auto" poster="/about-portrait.png">
        <source src="/hero-work.mp4" type="video/mp4" />
      </video>
      <div className="sh-scrim" />
      <div className="sh-copy">
        <span className="sh-kick">Embedded Systems Engineer · Turin</span>
        <h1>I make<br />hardware <b>think.</b></h1>
        <p className="sh-sub">PCB, firmware, DSP — and the last 1% that makes hardware reliable in the field.</p>
        <div className="sh-cta-row">
          <a className="sh-btn sh-btn--primary" href="#work">See the work</a>
          <a className="sh-btn" href="#contact">Let's talk</a>
        </div>
      </div>
      <div className="sh-hint">scroll ↓</div>
    </section>
  );
}
