import { useEffect, useState } from 'react';

export default function FloatingSchematic({ pdfSrc }) {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const scrollEl = document.querySelector('.pd-scroll');
    if (!scrollEl) return;

    const onScroll = () => setDocked(scrollEl.scrollTop > 300);

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href={pdfSrc}
      target="_blank"
      rel="noopener noreferrer"
      className={`pd-float-schematic ${docked ? 'docked' : ''}`}
    >
      <div className="gemini-border" />
      <div className="gemini-inner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="pd-float-label">Schematic</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="7 17 17 7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </div>
    </a>
  );
}
