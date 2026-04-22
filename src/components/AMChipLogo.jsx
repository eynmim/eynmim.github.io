import { memo } from 'react';

function AMChipLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="nav-logo-svg">
      <rect x="5" y="5" width="22" height="22" rx="3" fill="#0a1018" stroke="#00f0ff" strokeWidth="1.2" />
      {[10, 16, 22].map((p) => (
        <g key={p}>
          <line x1={p} y1="1" x2={p} y2="5" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
          <line x1={p} y1="27" x2={p} y2="31" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
          <line x1="1" y1={p} x2="5" y2={p} stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
          <line x1="27" y1={p} x2="31" y2={p} stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
        </g>
      ))}
      <circle cx="8.5" cy="8.5" r="1.2" fill="#00f0ff" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      <text
        x="16"
        y="17.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#00f0ff"
        fontSize="8"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
      >
        AM
      </text>
    </svg>
  );
}

export default memo(AMChipLogo);
