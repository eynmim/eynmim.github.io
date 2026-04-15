import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../context/LanguageContext';

const CHARS = "!<>-_\\/[]{}—=+*^?#░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌";

function useScramble(phrases) {
  const [text, setText] = useState(phrases[0]);
  const idxRef = useRef(0);
  const timerRef = useRef(null);

  const scrambleTo = useCallback((newText) => {
    clearInterval(timerRef.current);
    const len = Math.max(text.length, newText.length);
    let iter = 0;
    timerRef.current = setInterval(() => {
      setText(
        newText
          .split('')
          .map((ch, i) => {
            if (i < iter) return newText[i];
            if (ch === ' ') return ' ';
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      if (iter >= len + 4) clearInterval(timerRef.current);
      iter += 0.6;
    }, 38);
  }, [text]);

  const next = useCallback(() => {
    idxRef.current = (idxRef.current + 1) % phrases.length;
    scrambleTo(phrases[idxRef.current]);
  }, [phrases, scrambleTo]);

  useEffect(() => {
    scrambleTo(phrases[0]);
    return () => clearInterval(timerRef.current);
  }, []);

  return { text, next };
}

function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export { ScrollReveal };

export default function Hero() {
  const { t } = useLang();

  const PHRASES_EN = [
    "I design circuits. I write firmware.",
    "From schematic to product.",
    "PCB. RTOS. BLE. Shipped.",
    "Embedded systems that work.",
    "Precision in every signal.",
  ];

  const { text: scrambleText, next: scrambleNext } = useScramble(PHRASES_EN);

  return (
    <section id="home" className="hero-section">
      {/* SVG filter for morph blur threshold effect */}
      <svg className="filters-svg">
        <defs>
          <filter id="threshold">
            <feColorMatrix in="SourceGraphic" type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <ScrollReveal>
        <span className="tag">Embedded Systems Engineer — Turin, Italy</span>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="glitch-wrap">
          <h1 className="glitch" data-text="Ali Mansouri">
            Ali Mansouri
          </h1>
        </div>
      </ScrollReveal>

      {/* Morphing blur text — rotates between keywords */}
      <div className="morph-container">
        <div className="word-rotator">
          <div className="morph-word">FIRMWARE</div>
          <div className="morph-word">HARDWARE</div>
          <div className="morph-word">IoT</div>
        </div>
      </div>

      <ScrollReveal delay={0.3}>
        <div
          className="scramble-text"
          onMouseEnter={scrambleNext}
          onClick={scrambleNext}
        >
          {scrambleText}
        </div>
        <p className="scramble-hint">hover to scramble</p>
      </ScrollReveal>

      <ScrollReveal delay={0.4}>
        <div className="hero-status-row">
          {[
            { color: '#39ff14', label: 'Firmware: Online' },
            { color: '#ffbe0b', label: 'PCB Design: Active' },
            { color: '#00f0ff', label: 'IoT: Connected' },
          ].map((led) => (
            <div key={led.label} className="hero-led">
              <span className="led-dot animate-led" style={{ backgroundColor: led.color, color: led.color }} />
              {led.label}
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.5}>
        <a href="#projects" className="hero-cta">
          {'>'} {t('hero.cta')}
        </a>
      </ScrollReveal>

      {/* Mouse scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
      </div>
    </section>
  );
}
