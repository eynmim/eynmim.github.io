import { useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { skillCategories } from '../data/skillsData';
import { ScrollReveal } from './Hero';

function SpotlightCanvas() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    let slx = -999, sly = -999, rafId;

    const resize = () => {
      const r = section.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      slx = e.clientX - r.left;
      sly = e.clientY - r.top;
    };
    const onLeave = () => { slx = -999; sly = -999; };

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (slx !== -999) {
        const g = ctx.createRadialGradient(slx, sly, 0, slx, sly, 280);
        g.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
        g.addColorStop(0.4, 'rgba(57, 255, 20, 0.04)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="spotlight-canvas" />;
}

function SkillBar({ name, level, color, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="skill-bar-wrap">
      <div className="skill-bar-label">
        <span>{name}</span>
        <span className="skill-bar-pct">{level}%</span>
      </div>
      <div className="skill-bar-track">
        <div
          className="skill-bar-fill"
          style={{
            width: visible ? `${level}%` : '0%',
            background: `linear-gradient(90deg, ${color}44, ${color})`,
            boxShadow: `0 0 8px ${color}44`,
            transitionDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
}

import { useState } from 'react';

export default function Skills() {
  const { lang, t } = useLang();

  return (
    <section id="skills" className="portfolio-section spotlight-section">
      <SpotlightCanvas />
      <div className="spotlight-content">
        <ScrollReveal>
          <span className="tag">02 — Tech Stack</span>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="section-title">{t('skills.title')}</h2>
          <p className="section-sub">{t('skills.subtitle')}</p>
        </ScrollReveal>

        <div className="skills-grid">
          {skillCategories.map((cat, ci) => (
            <ScrollReveal key={cat.id} delay={ci * 0.15}>
              <div className="glass-card skill-card" style={{ '--card-accent': cat.color }}>
                <h3 className="skill-card-title" style={{ color: cat.color }}>
                  {cat.label[lang]}
                </h3>
                <div className="skill-card-divider" style={{ backgroundColor: cat.color + '33' }} />
                <div className="skill-bars">
                  {cat.skills.map((skill, i) => (
                    <SkillBar
                      key={skill.name}
                      name={skill.name}
                      level={skill.level}
                      color={cat.color}
                      delay={ci * 0.15 + i * 0.06}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
