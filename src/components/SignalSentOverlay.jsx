import { useEffect, useState } from 'react';

export default function SignalSentOverlay({ visible, onDone }) {
  const [phase, setPhase] = useState(0); // 0=traces, 1=chip, 2=text, 3=fadeout

  useEffect(() => {
    if (!visible) { setPhase(0); return; }
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2800);
    const t4 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className={`signal-overlay ${phase >= 3 ? 'fade-out' : ''}`}>
      {/* Circuit traces drawing in */}
      <svg className="signal-traces" viewBox="0 0 600 400" fill="none">
        {/* Left traces */}
        <path d="M 0 200 H 120 V 150 H 200" stroke="#00f0ff" strokeWidth="2" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '400', '--delay': '0s' }} />
        <path d="M 0 220 H 100 V 250 H 200" stroke="#39ff14" strokeWidth="1.5" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '350', '--delay': '0.15s' }} />
        <path d="M 0 180 H 80 V 170 H 200" stroke="#ffbe0b" strokeWidth="1" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '300', '--delay': '0.3s' }} />

        {/* Right traces */}
        <path d="M 600 200 H 480 V 150 H 400" stroke="#00f0ff" strokeWidth="2" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '400', '--delay': '0.1s' }} />
        <path d="M 600 220 H 500 V 250 H 400" stroke="#39ff14" strokeWidth="1.5" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '350', '--delay': '0.25s' }} />
        <path d="M 600 180 H 520 V 170 H 400" stroke="#ffbe0b" strokeWidth="1" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '300', '--delay': '0.4s' }} />

        {/* Top/bottom traces */}
        <path d="M 300 0 V 100 H 280 V 150" stroke="#00f0ff" strokeWidth="1.5" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '300', '--delay': '0.2s' }} />
        <path d="M 300 400 V 300 H 320 V 250" stroke="#00f0ff" strokeWidth="1.5" className={`signal-trace ${phase >= 0 ? 'draw' : ''}`} style={{ '--len': '300', '--delay': '0.2s' }} />

        {/* Signal dots traveling along traces */}
        {phase >= 0 && (
          <>
            <circle r="3" fill="#00f0ff" opacity="0.8">
              <animateMotion dur="0.8s" begin="0.3s" fill="freeze" path="M 0 200 H 120 V 150 H 200" />
            </circle>
            <circle r="3" fill="#00f0ff" opacity="0.8">
              <animateMotion dur="0.8s" begin="0.4s" fill="freeze" path="M 600 200 H 480 V 150 H 400" />
            </circle>
            <circle r="2" fill="#39ff14" opacity="0.6">
              <animateMotion dur="0.7s" begin="0.5s" fill="freeze" path="M 0 220 H 100 V 250 H 200" />
            </circle>
            <circle r="2" fill="#39ff14" opacity="0.6">
              <animateMotion dur="0.7s" begin="0.55s" fill="freeze" path="M 600 220 H 500 V 250 H 400" />
            </circle>
          </>
        )}

        {/* Nodes at intersections */}
        {phase >= 0 && [
          { cx: 120, cy: 200 }, { cx: 200, cy: 150 }, { cx: 100, cy: 250 }, { cx: 200, cy: 250 },
          { cx: 480, cy: 200 }, { cx: 400, cy: 150 }, { cx: 500, cy: 250 }, { cx: 400, cy: 250 },
          { cx: 300, cy: 100 }, { cx: 300, cy: 300 },
        ].map((n, i) => (
          <circle key={i} cx={n.cx} cy={n.cy} r="3" fill="#00f0ff" opacity="0"
            className={`signal-node ${phase >= 0 ? 'show' : ''}`}
            style={{ '--node-delay': `${0.4 + i * 0.05}s` }} />
        ))}

        {/* Center IC Chip */}
        <g className={`signal-chip ${phase >= 1 ? 'show' : ''}`}>
          {/* Chip body */}
          <rect x="230" y="140" width="140" height="120" rx="6" fill="#0a1018" stroke="#00f0ff" strokeWidth="2" />
          {/* Inner die */}
          <rect x="250" y="158" width="100" height="84" rx="3" fill="#00f0ff08" stroke="#00f0ff" strokeWidth="0.5" opacity="0.4" />
          {/* Corner notch */}
          <circle cx="242" cy="152" r="4" fill="#00f0ff" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          {/* Pins top */}
          {[255, 275, 295, 315, 335].map((x, i) => (
            <line key={`t${i}`} x1={x} y1="125" x2={x} y2="140" stroke="#00f0ff" strokeWidth="2" opacity="0.6" />
          ))}
          {/* Pins bottom */}
          {[255, 275, 295, 315, 335].map((x, i) => (
            <line key={`b${i}`} x1={x} y1="260" x2={x} y2="275" stroke="#00f0ff" strokeWidth="2" opacity="0.6" />
          ))}
          {/* Pins left */}
          {[160, 180, 200, 220, 240].map((y, i) => (
            <line key={`l${i}`} x1="215" y1={y} x2="230" y2={y} stroke="#00f0ff" strokeWidth="2" opacity="0.6" />
          ))}
          {/* Pins right */}
          {[160, 180, 200, 220, 240].map((y, i) => (
            <line key={`r${i}`} x1="370" y1={y} x2="385" y2={y} stroke="#00f0ff" strokeWidth="2" opacity="0.6" />
          ))}
        </g>

        {/* Checkmark inside chip */}
        <path d="M 280 200 L 295 215 L 325 180" stroke="#39ff14" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
          className={`signal-check ${phase >= 2 ? 'draw' : ''}`}
          style={{ '--len': '80', '--delay': '0s' }} />
      </svg>

      {/* Text */}
      <div className={`signal-text ${phase >= 2 ? 'show' : ''}`}>
        <span className="signal-text-main">SIGNAL TRANSMITTED</span>
        <span className="signal-text-sub">Message sent successfully</span>
      </div>
    </div>
  );
}
