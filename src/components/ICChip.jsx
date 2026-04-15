import { motion } from 'framer-motion';

/**
 * IC Chip component - renders an animated SVG integrated circuit
 * Used as a decorative element and section separator
 */
export function ICChipLarge({ label = 'AM', color = '#00f0ff', className = '' }) {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <defs>
        <filter id="chipGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Chip body */}
      <rect x="40" y="40" width="120" height="120" rx="4"
        fill="#0a1018" stroke={color} strokeWidth="1.5" filter="url(#chipGlow)">
        <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
      </rect>

      {/* Inner die */}
      <rect x="60" y="60" width="80" height="80" rx="2"
        fill={`${color}08`} stroke={color} strokeWidth="0.5" opacity="0.4" />

      {/* Die pattern - circuit traces inside */}
      <g opacity="0.3" stroke={color} strokeWidth="0.5" fill="none">
        <path d="M 70 80 H 90 V 100 H 110">
          <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 130 75 H 110 V 95 H 90">
          <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M 80 120 V 105 H 100 V 85">
          <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2.8s" begin="1s" repeatCount="indefinite" />
        </path>
        <path d="M 120 130 V 110 H 100 V 90">
          <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="3.2s" begin="1.5s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Corner notch */}
      <circle cx="52" cy="52" r="3" fill={color} opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Pins — Top */}
      {[60, 75, 90, 105, 120, 135].map((x, i) => (
        <g key={`top-${i}`}>
          <line x1={x} y1="20" x2={x} y2="40" stroke={color} strokeWidth="2" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          </line>
          <circle cx={x} cy="20" r="2" fill={color} opacity="0.4" />
        </g>
      ))}

      {/* Pins — Bottom */}
      {[60, 75, 90, 105, 120, 135].map((x, i) => (
        <g key={`bot-${i}`}>
          <line x1={x} y1="160" x2={x} y2="180" stroke={color} strokeWidth="2" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin={`${i * 0.2 + 0.1}s`} repeatCount="indefinite" />
          </line>
          <circle cx={x} cy="180" r="2" fill={color} opacity="0.4" />
        </g>
      ))}

      {/* Pins — Left */}
      {[60, 75, 90, 105, 120, 135].map((y, i) => (
        <g key={`left-${i}`}>
          <line x1="20" y1={y} x2="40" y2={y} stroke={color} strokeWidth="2" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
          </line>
          <circle cx="20" cy={y} r="2" fill={color} opacity="0.4" />
        </g>
      ))}

      {/* Pins — Right */}
      {[60, 75, 90, 105, 120, 135].map((y, i) => (
        <g key={`right-${i}`}>
          <line x1="160" y1={y} x2="180" y2={y} stroke={color} strokeWidth="2" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin={`${i * 0.15 + 0.1}s`} repeatCount="indefinite" />
          </line>
          <circle cx="180" cy={y} r="2" fill={color} opacity="0.4" />
        </g>
      ))}

      {/* Center label */}
      <text x="100" y="104" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="22" fontFamily="'JetBrains Mono', monospace" fontWeight="700"
        filter="url(#neonGlow)">
        {label}
      </text>
    </motion.svg>
  );
}

/**
 * Section wrapper styled as an IC chip with pins on sides
 */
export function ICSection({ children, color = '#00f0ff', className = '' }) {
  return (
    <div
      className={`ic-frame mx-8 md:mx-16 lg:mx-24 p-8 md:p-12 ${className}`}
      style={{ '--neon-color': color }}
    >
      {children}
    </div>
  );
}

/**
 * Trace connector between sections
 */
export function TraceConnector({ color = '#00f0ff', height = 80 }) {
  return (
    <div className="flex justify-center" style={{ height }}>
      <svg width="4" height={height} className="overflow-visible">
        {/* Main trace */}
        <line x1="2" y1="0" x2="2" y2={height}
          stroke={color} strokeWidth="1" opacity="0.3" />
        {/* Signal dot traveling down */}
        <circle cx="2" r="3" fill={color} opacity="0.8">
          <animate attributeName="cy"
            values={`0;${height}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity"
            values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Glow */}
        <circle cx="2" r="8" fill={color} opacity="0.15">
          <animate attributeName="cy"
            values={`0;${height}`} dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
