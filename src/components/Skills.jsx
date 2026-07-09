import { memo, useState, useEffect, useRef } from 'react';
import { skillCategories } from '../data/skillsData';
import { ScrollReveal } from './Hero';

// warm accents per category — stays inside the orange signal family
const ACCENTS = ['#ff5a1f', '#ffab40', '#ff8a3c'];

const SkillBar = memo(function SkillBar({ name, level, accent, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="sk-bar">
      <div className="sk-bar-top"><span>{name}</span><span className="sk-pct">{level}%</span></div>
      <div className="sk-track">
        <div className="sk-fill" style={{ '--w': visible ? `${level}%` : '0%', '--a': accent, '--d': `${delay}s` }} />
      </div>
    </div>
  );
});

export default function Skills() {
  return (
    <section id="stack" className="sec">
      <div className="wrap">
        <div className="sec-head">
          <ScrollReveal><span className="eyebrow">/ stack</span></ScrollReveal>
          <ScrollReveal delay={0.05}><h2 className="sec-title">The tools I reach for.</h2></ScrollReveal>
        </div>
        <div className="sk-grid">
          {skillCategories.map((cat, ci) => {
            const accent = ACCENTS[ci % ACCENTS.length];
            return (
              <ScrollReveal key={cat.id} className="sk-card" delay={ci * 0.08}>
                <div className="sk-inner" style={{ '--a': accent }}>
                  <h3 className="sk-title">{cat.label.en}</h3>
                  <div className="sk-div" />
                  <div className="sk-bars">
                    {cat.skills.map((s, i) => (
                      <SkillBar key={s.name} name={s.name} level={s.level} accent={accent} delay={ci * 0.1 + i * 0.05} />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
