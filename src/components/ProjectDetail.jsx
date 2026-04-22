import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import PCBViewer from './PCBViewer';
import CircleGallery from './CircleGallery';
import Lightbox from './Lightbox';
import FloatingSchematic from './FloatingSchematic';

const badgeColorMap = {
  amber: '#ffbe0b',
  cyan: '#00f0ff',
  green: '#39ff14',
};

export default function ProjectDetail({ project, onClose }) {
  const { lang } = useLang();
  const [lightboxImage, setLightboxImage] = useState(null);
  const images = project.images || [];
  const color = badgeColorMap[project.badgeColor] || '#00f0ff';
  const pdfImage = images.find((img) => img.isPdf);

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

      {pdfImage && <FloatingSchematic pdfSrc={pdfImage.src} />}

      <div className="pd-scroll">
        <section className="pd-hero">
          <span className="tag pd-hero-tag" style={{ '--accent': color }}>
            {project.badge} — {project.company}
          </span>

          <div className="glitch-wrap">
            <h1
              className="glitch pd-glitch pd-glitch-gradient"
              data-text={project.title[lang]}
              style={{ '--accent': color }}
            >
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

          <a href="#pd-details" className="hero-cta pd-cta-accent" style={{ '--accent': color }}>
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
              <p className="pd-gallery-hint">// scroll to rotate through images</p>
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
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta pd-github-cta"
              >
                {'>'} View on GitHub
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
