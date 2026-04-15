import { useEffect, useRef } from 'react';

export default function ScrollPaths() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrollTop / docHeight));

      // Animate stroke-dashoffset based on scroll
      svg.style.setProperty('--path-offset', `${-2400 * progress}`);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="scroll-paths-svg"
      viewBox="0 0 740 2000"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="pathGrad" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="35%" stopColor="#39ff14" />
          <stop offset="65%" stopColor="#ffbe0b" />
          <stop offset="100%" stopColor="#b537f2" />
        </linearGradient>
      </defs>

      {/* 4 flowing paths — dots + dashes travel along curves */}
      <path
        className="scroll-path p1"
        d="m 106,45h 375c 114,0 226,128 226,235v 236c 0,136 -122,222 -224,221l -182,-2c -89,1 -141,42 -142,158l -2,204c -1,117 37,173 134,173h 186c 110,-3 230,111 230,220v 242c 0,113 -125,225 -248,225H 105"
      />
      <path
        className="scroll-path p2"
        d="m 33,85h 444c 96,0 190,107 190,201v 224c 0,116 -98,188 -190,187l -192,-2c -92,0 -166,75 -166,168v 278c 0,94 74,169 166,169h 194c 92,0 188,94 188,188v 228c 0,94 -104,191 -214,191H 105"
      />
      <path
        className="scroll-path p3"
        d="m 155,127h 308c 94,0 162,86 162,177v 178c 0,109 -50,174 -166,173L 277,653C 158,653 77,762 77,849v 302c 0,118 107,196 180,197l 204,4c 92,0 164,67 164,160v 200c 0,91 -89,163 -188,163H 105"
      />
      <path
        className="scroll-path p4"
        d="m 283,173c 2,0 165,0 165,0C 544,175 577,238 577,330v 156c 0,94 -48,126 -140,125L 269,609C 167,602 29,702 29,851v 312c 0,111 101,235 242,235h 162c 109,1 144,49 144,136v 162c 0,73 -53,130 -118,130l -353,1"
      />
    </svg>
  );
}
