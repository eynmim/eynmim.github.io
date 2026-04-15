import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { ICChipLarge } from './ICChip';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggleLang, t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
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
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'backdrop-blur-xl' : ''
      }`}
      style={{
        backgroundColor: scrolled ? 'rgba(5, 10, 14, 0.85)' : 'transparent',
        borderBottom: scrolled ? '1px solid #00f0ff15' : '1px solid transparent',
        boxShadow: scrolled ? '0 0 30px #00f0ff08' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo — small IC chip */}
        <a href="#home" className="flex items-center gap-3 no-underline group">
          <svg width="36" height="36" viewBox="0 0 200 200" className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_#00f0ff66]">
            <rect x="40" y="40" width="120" height="120" rx="4"
              fill="#0a1018" stroke="#00f0ff" strokeWidth="2" />
            <circle cx="52" cy="52" r="3" fill="#00f0ff" opacity="0.5" />
            {[60, 80, 100, 120, 140].map((p) => (
              <g key={p}>
                <line x1={p} y1="25" x2={p} y2="40" stroke="#00f0ff" strokeWidth="2" opacity="0.5" />
                <line x1={p} y1="160" x2={p} y2="175" stroke="#00f0ff" strokeWidth="2" opacity="0.5" />
                <line x1="25" y1={p} x2="40" y2={p} stroke="#00f0ff" strokeWidth="2" opacity="0.5" />
                <line x1="160" y1={p} x2="175" y2={p} stroke="#00f0ff" strokeWidth="2" opacity="0.5" />
              </g>
            ))}
            <text x="100" y="105" textAnchor="middle" dominantBaseline="middle"
              fill="#00f0ff" fontSize="28" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
              AM
            </text>
          </svg>
          <div className="hidden sm:block">
            <span className="font-mono text-xs text-cyan block leading-none">Ali Mansouri</span>
            <span className="font-mono text-[10px] text-text-muted">Embedded Systems</span>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item, i) => (
            <a
              key={item.key}
              href={item.href}
              className="font-mono text-xs px-4 py-2 text-text-secondary hover:text-cyan transition-all duration-300 no-underline relative group rounded"
            >
              <span className="relative z-10">
                <span className="text-text-muted mr-1 text-[10px]">0{i + 1}.</span>
                {t(`nav.${item.key}`)}
              </span>
              <span className="absolute inset-0 bg-cyan/0 group-hover:bg-cyan/5 rounded transition-colors duration-300" />
            </a>
          ))}

          <div className="w-px h-4 bg-text-muted/30 mx-2" />

          <button
            onClick={toggleLang}
            className="font-mono text-[10px] px-3 py-1.5 border rounded cursor-pointer transition-all duration-300"
            style={{
              borderColor: '#00f0ff44',
              color: '#00f0ff',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#00f0ff15';
              e.target.style.boxShadow = '0 0 10px #00f0ff22';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.boxShadow = 'none';
            }}
          >
            {lang === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 cursor-pointer p-2 bg-transparent border-none"
        >
          <span className={`block w-5 h-0.5 bg-cyan transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-cyan transition-opacity duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-cyan transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t px-6 py-4"
          style={{ backgroundColor: 'rgba(5, 10, 14, 0.95)', borderColor: '#00f0ff15' }}
        >
          {navItems.map((item, i) => (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block font-mono text-sm text-text-secondary hover:text-cyan py-2.5 no-underline"
            >
              <span className="text-text-muted mr-2 text-xs">0{i + 1}.</span>
              {t(`nav.${item.key}`)}
            </a>
          ))}
          <button
            onClick={toggleLang}
            className="mt-3 font-mono text-xs px-3 py-1 border border-cyan/30 rounded text-cyan cursor-pointer bg-transparent"
          >
            {lang === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
}
