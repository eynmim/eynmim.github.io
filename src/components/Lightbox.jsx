import { useEffect } from 'react';

export default function Lightbox({ image, onClose }) {
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
      <img src={image.src} alt={image.label} onClick={(e) => e.stopPropagation()} />
      <p className="pd-lightbox-label">{image.label}</p>
    </div>
  );
}
