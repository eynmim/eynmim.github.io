import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';

function AMChipLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="nav-logo-svg">
      {/* Chip body */}
      <rect x="5" y="5" width="22" height="22" rx="3" fill="#0a1018" stroke="#00f0ff" strokeWidth="1.2" />
      {/* Pins */}
      {[10, 16, 22].map((p) => (
        <g key={p}>
          <line x1={p} y1="1" x2={p} y2="5" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
          <line x1={p} y1="27" x2={p} y2="31" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
          <line x1="1" y1={p} x2="5" y2={p} stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
          <line x1="27" y1={p} x2="31" y2={p} stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
        </g>
      ))}
      {/* Corner notch */}
      <circle cx="8.5" cy="8.5" r="1.2" fill="#00f0ff" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* AM text */}
      <text x="16" y="17.5" textAnchor="middle" dominantBaseline="middle"
        fill="#00f0ff" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
        AM
      </text>
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { lang, toggleLang, t } = useLang();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);

      // Track active section
      const sections = ['contact', 'experience', 'skills', 'projects', 'home'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { key: 'home', href: '#home' },
    { key: 'projects', href: '#projects' },
    { key: 'skills', href: '#skills' },
    { key: 'experience', href: '#experience' },
    { key: 'contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="navbar"
      data-scrolled={scrolled}
    >
      <div className="nav-inner">
        {/* Logo */}
        <a href="#home" className="nav-logo">
          <AMChipLogo />
          <div className="nav-logo-text">
            <span className="nav-logo-name">Ali Mansouri</span>
            <span className="nav-logo-role">Embedded Systems</span>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="nav-links">
          {navItems.map((item, i) => (
            <a
              key={item.key}
              href={item.href}
              className={`nav-link ${activeSection === item.key ? 'active' : ''}`}
            >
              <span className="nav-link-num">0{i + 1}.</span>
              {t(`nav.${item.key}`)}
            </a>
          ))}

          <div className="nav-divider" />

          <button onClick={toggleLang} className="nav-lang-btn" aria-label={lang === 'en' ? 'Switch to Italian' : 'Switch to English'}>
            {lang === 'en' ? 'IT' : 'EN'}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="nav-mobile-btn"
          aria-label="Menu"
        >
          <span className={`nav-hamburger-line ${mobileOpen ? 'open-1' : ''}`} />
          <span className={`nav-hamburger-line ${mobileOpen ? 'open-2' : ''}`} />
          <span className={`nav-hamburger-line ${mobileOpen ? 'open-3' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="nav-mobile-menu"
        >
          {navItems.map((item, i) => (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`nav-mobile-link ${activeSection === item.key ? 'active' : ''}`}
            >
              <span className="nav-link-num">0{i + 1}.</span>
              {t(`nav.${item.key}`)}
            </a>
          ))}
          <button onClick={toggleLang} className="nav-lang-btn" style={{ marginTop: '0.5rem' }}>
            {lang === 'en' ? 'IT' : 'EN'}
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
}
