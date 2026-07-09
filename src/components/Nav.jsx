import { useEffect, useState } from 'react';

export function LogoA({ size = 26 }) {
  // "Intensity A" — the letter A as a signal peak with intensity nodes
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 120 84" fill="none"
      stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 66 H34 L52 22 L70 66 H88" />
      <path d="M44 47 H60" />
      <g stroke="none" fill="currentColor">
        <circle cx="34" cy="66" r="4" /><circle cx="52" cy="21" r="5" /><circle cx="70" cy="66" r="4" />
      </g>
    </svg>
  );
}

const LINKS = [
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#stack', label: 'Stack' },
];

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // fade the nav out during the deepest part of the eye-dive, back in for content
    const onScroll = () => {
      const hero = document.querySelector('.signal-hero');
      if (!hero) return;
      const total = hero.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / (total || 1)));
      setHidden(p > 0.12 && p < 0.46); // hidden while diving into the pupil
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav ${hidden ? 'nav--hidden' : ''}`}>
      <div className="nav-in">
        <a className="nav-brand" href="#home" aria-label="Ali Mansouri — home">
          <LogoA /><b>Ali Mansouri</b>
        </a>
        <span className="nav-sep" />
        {LINKS.map((l) => (
          <a key={l.href} className="nav-link" href={l.href}>{l.label}</a>
        ))}
        <a className="nav-cta" href="#contact">Let's talk</a>
      </div>
    </nav>
  );
}
