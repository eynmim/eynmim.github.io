import { motion } from 'framer-motion';

export function NeonText({
  children,
  color = '#00f0ff',
  flicker = false,
  as: Tag = 'span',
  className = '',
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="inline-block"
    >
      <Tag
        className={`${flicker ? 'neon-text' : 'neon-text-steady'} ${className}`}
        style={{ '--neon-color': color }}
      >
        {children}
      </Tag>
    </motion.div>
  );
}

export function NeonBorder({ children, color = '#00f0ff', className = '' }) {
  return (
    <div
      className={`relative rounded-lg border border-white/10 ${className}`}
      style={{
        '--neon-color': color,
        animation: 'neonBorderPulse 4s ease-in-out infinite',
      }}
    >
      {children}
    </div>
  );
}

export function NeonLine({ color = '#00f0ff', className = '' }) {
  return (
    <div className={`relative h-px ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 8px ${color}66, 0 0 16px ${color}33`,
        }}
      />
    </div>
  );
}
