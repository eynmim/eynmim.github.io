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
  const [cvOpen, setCvOpen] = useState(false);
  const { lang, setLang, t } = useLang();

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
    <>
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

        {/* Desktop nav — bevel overlapping tabs */}
        <nav className="bevel-nav">
          {navItems.map((item, i) => (
            <a
              key={item.key}
              href={item.href}
              className={`bevel-link ${activeSection === item.key ? 'active' : ''}`}
            >
              <span className="bevel-num">0{i + 1}.</span>
              {t(`nav.${item.key}`)}
            </a>
          ))}
        </nav>

        <div className="nav-actions">

          <button onClick={() => setCvOpen(true)} className="nav-gradient-btn nav-cv-btn" type="button" aria-label="View CV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            CV
          </button>

          <label className="lang-switch">
            <input
              className="lang-switch__input"
              type="checkbox"
              role="switch"
              checked={lang === 'en'}
              onChange={() => setLang(lang === 'en' ? 'it' : 'en')}
            />
            <span className="lang-switch__letters" aria-hidden="true">EN</span>
            <span className="lang-switch__letters" aria-hidden="true">IT</span>
            <span className="lang-switch__sr">Toggle language</span>
          </label>
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
          <label className="lang-switch" style={{ marginTop: '0.5rem' }}>
            <input className="lang-switch__input" type="checkbox" role="switch"
              checked={lang === 'en'} onChange={() => setLang(lang === 'en' ? 'it' : 'en')} />
            <span className="lang-switch__letters" aria-hidden="true">EN</span>
            <span className="lang-switch__letters" aria-hidden="true">IT</span>
            <span className="lang-switch__sr">Toggle language</span>
          </label>
        </motion.div>
      )}
    </motion.nav>

    {/* CV Modal — only renders PDF when open */}
    {cvOpen && (
      <div className="cv-modal show" onClick={(e) => {
        if (e.target.classList.contains('cv-modal')) setCvOpen(false);
      }}>
        <div className="cv-modal-content">
          <div className="cv-modal-header">
            <span className="cv-modal-title">Ali Mansouri — CV</span>
            <div className="cv-modal-actions">
              <a href="/Ali_Mansouri_CV.pdf" download className="cv-modal-download" aria-label="Download CV">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                Download
              </a>
              <button onClick={() => setCvOpen(false)} className="cv-modal-close" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <iframe
            src={`/Ali_Mansouri_CV.pdf#toolbar=1&navpanes=0`}
            className="cv-modal-iframe"
            title="Ali Mansouri CV"
          />
        </div>
      </div>
    )}
    </>
  );
}
