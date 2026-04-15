import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageProvider } from './context/LanguageContext';
import BootSequence from './components/BootSequence';
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
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setBooted(true);
  }, []);

  // Force scroll to top after portfolio mounts
  useEffect(() => {
    if (booted) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        // Enable smooth scroll only after we've landed at top
        document.documentElement.classList.add('smooth-scroll');
      }, 100);
      return () => clearTimeout(t);
    }
  }, [booted]);

  return (
    <LanguageProvider>
      {/* Boot Sequence */}
      <AnimatePresence>
        {!booted && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

      {/* Main Portfolio */}
      {booted && (
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
