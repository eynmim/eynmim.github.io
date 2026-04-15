import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageProvider } from './context/LanguageContext';
import BootSequence from './components/BootSequence';
import HyperScroll from './components/HyperScroll';
import CustomCursor from './components/CustomCursor';
import AuroraBackground from './components/AuroraBackground';
import Navbar from './components/Navbar';
import Marquee from './components/Marquee';
import Hero from './components/Hero';
import Projects from './components/Projects';
import Stats from './components/Stats';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  const [phase, setPhase] = useState('boot');

  const handleBootComplete = useCallback(() => setPhase('hyper'), []);
  const handleEnterPortfolio = useCallback(() => {
    // Reset scroll before, during, and after phase change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setPhase('portfolio');
  }, []);

  // Force scroll to top when portfolio phase mounts
  useEffect(() => {
    if (phase === 'portfolio') {
      // Immediate reset
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Also reset after a frame (after DOM has rendered)
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      // And once more after a short delay for safety
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <LanguageProvider>
      {/* Phase 1: Boot */}
      <AnimatePresence>
        {phase === 'boot' && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

      {/* Phase 2: 3D Hyper Scroll */}
      <AnimatePresence>
        {phase === 'hyper' && (
          <motion.div key="hyper" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <HyperScroll onEnterPortfolio={handleEnterPortfolio} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Full Portfolio */}
      {phase === 'portfolio' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <CustomCursor />
          <AuroraBackground />
          <div className="scanline-overlay" />

          <Navbar />

          <div className="portfolio-page">
            <Hero />
            <div className="divider" />
            <Marquee />
            <Projects />
            <div className="divider" />
            <Stats />
            <div className="divider" />
            <Skills />
            <div className="divider" />
            <Marquee />
            <Experience />
            <div className="divider" />
            <Contact />
          </div>

          <Footer />
        </motion.div>
      )}
    </LanguageProvider>
  );
}
