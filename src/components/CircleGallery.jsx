import { useEffect, useRef, useState } from 'react';

export default function CircleGallery({ images, color, onImageClick }) {
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
            // card-i=1 sits at 12 o'clock (75% on offset-path circle);
            // subsequent cards counter-clockwise around the perimeter.
            const offsetPct = (((75 - (i / cards) * 100) % 100) + 100) % 100;
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
