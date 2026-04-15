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

      <p className="hero-sub">
        <span>firmware.</span>{' '}
        <span>hardware.</span>{' '}
        <span>IoT.</span>{' '}
        <span>shipped.</span>
      </p>

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
        <div className="hero-actions">
          <a href="#projects" className="hero-cta">
            {'>'} {t('hero.cta')}
          </a>
          <div className="hero-socials">
            <a href="https://github.com/eynmim" target="_blank" rel="noopener noreferrer" className="hero-social-link" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/ali-mansouri-767b65235/" target="_blank" rel="noopener noreferrer" className="hero-social-link" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
