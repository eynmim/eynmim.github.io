import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import PCBViewer from './PCBViewer';

function CircleGallery({ images, color, onImageClick }) {
  const sectionRef = useRef(null);
  const [rotate, setRotate] = useState(0);
  const cards = images.length;

  useEffect(() => {
    const scrollEl = document.querySelector('.pd-scroll');
    const section = sectionRef.current;
    if (!scrollEl || !section) return;

    const maxRotate = (cards - 1) / cards;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();
      const sectionTopOffset = rect.top - scrollRect.top;
      const scrollableRange = rect.height - scrollRect.height;
      if (scrollableRange <= 0) return;
      let progress = -sectionTopOffset / scrollableRange;
      progress = Math.max(0, Math.min(1, progress));
      const stepped = Math.min(maxRotate, Math.round(progress * cards) / cards);
      setRotate(stepped);
    };

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [cards]);

  const handleClick = (img) => {
    if (img.isPdf) window.open(img.src, '_blank');
    else onImageClick?.(img);
  };

  return (
    <div ref={sectionRef} className="pd-circle-section" style={{ '--cards': cards }}>
      <div className="pd-circle-sticky">
        <div className="pd-circle-wrapper" style={{ '--pd-rotate': rotate }}>
          {images.map((img, i) => {
            // Place card-i=1 at 12 o'clock (75% on offset-path circle),
            // subsequent cards CCW around the circle.
            const offsetPct = ((75 - (i / cards) * 100) % 100 + 100) % 100;
            return (
            <div
              key={i}
              data-title={img.label}
              className="pd-circle-card"
              style={{ '--card-i': i + 1, '--card-offset': `${offsetPct}%`, '--accent': color }}
              onClick={() => handleClick(img)}
            >
              {img.isPdf ? (
                <div className="pd-circle-pdf" style={{ color }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>PDF</span>
                </div>
              ) : (
                <img src={img.src} alt={img.label} />
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="pd-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button className="pd-lightbox-close" onClick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img
        src={image.src}
        alt={image.label}
        onClick={(e) => e.stopPropagation()}
      />
      <p className="pd-lightbox-label">{image.label}</p>
    </div>
  );
}

const badgeColorMap = {
  amber: '#ffbe0b',
  cyan: '#00f0ff',
  green: '#39ff14',
};

function FloatingSchematic({ pdfSrc }) {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const scrollEl = document.querySelector('.pd-scroll');
    if (!scrollEl) return;

    function onScroll() {
      setDocked(scrollEl.scrollTop > 300);
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a href={pdfSrc} target="_blank" rel="noopener noreferrer"
      className={`pd-float-schematic ${docked ? 'docked' : ''}`}>
      <div className="gemini-border" />
      <div className="gemini-inner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="pd-float-label">Schematic</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="7 17 17 7" /><polyline points="7 7 17 7 17 17" />
        </svg>
      </div>
    </a>
  );
}

// No separate floating socials — the navbar already has them

export default function ProjectDetail({ project, onClose }) {
  const { lang } = useLang();
  const [lightboxImage, setLightboxImage] = useState(null);
  const images = project.images || [];
  const color = badgeColorMap[project.badgeColor] || '#00f0ff';
  const pdfImage = project.images?.find(img => img.isPdf);

  return (
    <div className="pd-fullpage">
      {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
      {project.glb && <PCBViewer glbPath={project.glb} className="pd-pcb-fullbg" />}
      <div className="pd-overlay" />

      <button className="pd-back-btn" onClick={onClose} aria-label="Back to projects">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Back</span>
      </button>

      {/* Floating schematic — scrolls to top-left */}
      {pdfImage && <FloatingSchematic pdfSrc={pdfImage.src} />}


      <div className="pd-scroll">
        <section className="pd-hero">
          <span className="tag" style={{ color, borderColor: color + '44', background: color + '0a', marginBottom: '1.5rem' }}>
            {project.badge} — {project.company}
          </span>

          <div className="glitch-wrap">
            <h1 className="glitch pd-glitch" data-text={project.title[lang]}
              style={{
                background: `linear-gradient(135deg, ${color} 0%, #fff 50%, ${color} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
              {project.title[lang]}
            </h1>
          </div>

          <p className="pd-hero-role" style={{ color }}>{'< '}{project.role[lang]}{' />'}</p>
          <p className="pd-hero-period">{project.period}</p>

          <div className="hero-status-row">
            {project.tags.slice(0, 4).map((tag) => (
              <div key={tag} className="hero-led">
                <span className="led-dot animate-led" style={{ backgroundColor: color, color }} />
                {tag}
              </div>
            ))}
          </div>

          <a href="#pd-details" className="hero-cta" style={{ borderColor: color + '66', color }}>
            {'>'} Explore Project
          </a>

          <div className="scroll-indicator">
            <div className="scroll-mouse"><div className="scroll-wheel" /></div>
          </div>
        </section>

        <section className="pd-details" id="pd-details">
          <div className="pd-block">
            <h3 className="pd-block-title" style={{ color }}>Overview</h3>
            <p className="pd-block-text">{project.description[lang]}</p>
          </div>

          {images.length > 0 && (
            <div className="pd-block">
              <h3 className="pd-block-title" style={{ color }}>Gallery</h3>
              <p className="pd-block-text" style={{ marginBottom: '0.5rem', fontSize: '0.7rem', opacity: 0.55, fontFamily: 'var(--font-mono)' }}>
                // scroll to rotate through images
              </p>
              <CircleGallery images={images} color={color} onImageClick={setLightboxImage} />
            </div>
          )}

          <div className="pd-block">
            <h3 className="pd-block-title" style={{ color }}>Key Highlights</h3>
            <ul className="pd-highlights-full">
              {project.highlights[lang].map((h, i) => (
                <li key={i}><span className="pd-dot-full" style={{ backgroundColor: color }} />{h}</li>
              ))}
            </ul>
          </div>

          <div className="pd-block">
            <h3 className="pd-block-title" style={{ color }}>Technologies</h3>
            <div className="pd-tags-full">
              {project.tags.map((tag) => (
                <span key={tag} className="pd-tag-full" style={{ color, borderColor: color + '33' }}>{tag}</span>
              ))}
            </div>
          </div>

          {project.github && (
            <div className="pd-block">
              <a href={project.github} target="_blank" rel="noopener noreferrer"
                className="hero-cta" style={{ borderColor: '#39ff1466', color: '#39ff14' }}>
                {'>'} View on GitHub
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
