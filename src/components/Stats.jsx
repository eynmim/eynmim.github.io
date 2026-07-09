import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from './Hero';

const STATS = [
  { target: 99, prefix: '', suffix: '%', label: 'Idle power eliminated' },
  { target: 6, prefix: '', suffix: '+ mo', label: 'Field battery life' },
  { target: 100, prefix: '<', suffix: ' ms', label: 'BLE round-trip latency' },
  { target: 15, prefix: '', suffix: '+', label: 'Firmware subsystems shipped' },
];

function Counter({ target, prefix, suffix }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const dur = 1700;
    let start = null;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let raf;
    function tick(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setValue(Math.floor(ease(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick); else setValue(target);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return <span ref={ref} className="stat-num">{prefix}{value}{suffix}</span>;
}

export default function Stats() {
  return (
    <section className="sec stats-sec">
      <div className="wrap">
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} className="stat-item" delay={i * 0.08}>
              <Counter target={s.target} prefix={s.prefix} suffix={s.suffix} />
              <span className="stat-label">{s.label}</span>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
