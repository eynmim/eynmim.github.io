import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from './Hero';

const STATS = [
  { target: 3, label: 'Projects Shipped', suffix: '+' },
  { target: 5, label: 'Protocols Mastered', suffix: '' },
  { target: 2, label: 'Years Experience', suffix: '+' },
  { target: 12, label: 'Tools & Languages', suffix: '' },
];

function Counter({ target, suffix }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const dur = 1800;
    let start = null;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function tick(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setValue(Math.floor(ease(p) * target));
      if (p < 1) requestAnimationFrame(tick);
      else setValue(target);
    }
    requestAnimationFrame(tick);
  }, [started, target]);

  return (
    <span ref={ref} className="stat-num">
      {value}{suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="portfolio-section stats-section">
      <ScrollReveal>
        <span className="tag">Quick Stats</span>
      </ScrollReveal>
      <div className="stats-grid">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1}>
            <div className="stat-item">
              <Counter target={s.target} suffix={s.suffix} />
              <span className="stat-label">{s.label}</span>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
