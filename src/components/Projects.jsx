import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { projects } from '../data/projectsData';
import { ScrollReveal } from './Hero';
import ProjectDetail from './ProjectDetail';

const categoryColors = {
  hardware: '#ffbe0b',
  firmware: '#00f0ff',
  python: '#39ff14',
};

function TiltCard({ children, color }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
    };
    const onLeave = () => {
      card.style.transition = 'transform .6s cubic-bezier(.23,1,.32,1), box-shadow .4s';
      card.style.transform = '';
      setTimeout(() => (card.style.transition = ''), 600);
    };
    const onEnter = () => {
      card.style.transition = 'transform .12s ease, box-shadow .4s';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('mouseenter', onEnter);
    return () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
      card.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <div ref={cardRef} className="glass-card" style={{ '--card-accent': color }}>
      {children}
    </div>
  );
}

function ProjectCard({ project, index, onOpenDetail }) {
  const { lang, t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const color = categoryColors[project.category] || '#00f0ff';

  return (
    <ScrollReveal delay={index * 0.1}>
      <TiltCard color={color}>
        {/* Badge */}
        <div className="glass-card-top">
          <span className="glass-card-badge" style={{ color, borderColor: color + '44' }}>
            {project.badge}
          </span>
          <span className="glass-card-period">{project.period}</span>
        </div>

        {/* Image — clickable to open project */}
        <div className="glass-card-image" style={{ borderColor: color + '15', cursor: 'pointer' }}
          onClick={() => onOpenDetail(project)}>
          {project.image ? (
            <img src={project.image} alt={project.title[lang]} />
          ) : (
            <svg width="60" height="60" viewBox="0 0 60 60" opacity="0.15">
              <rect x="5" y="5" width="50" height="50" rx="3" fill="none" stroke={color} strokeWidth="1" />
              <path d="M 15 25 H 30 V 40 H 42" fill="none" stroke={color} strokeWidth="1" />
              <circle cx="15" cy="25" r="3" fill={color} />
              <circle cx="42" cy="40" r="3" fill={color} />
              <circle cx="30" cy="25" r="2" fill={color} opacity="0.6" />
            </svg>
          )}
        </div>

        {/* Title — clickable to open project */}
        <h3 className="glass-card-title" style={{ cursor: 'pointer' }}
          onClick={() => onOpenDetail(project)}>{project.title[lang]}</h3>
        <p className="glass-card-company" style={{ color }}>{project.company} — {project.role[lang]}</p>
        <p className="glass-card-desc">{project.description[lang]}</p>

        {/* Tags */}
        <div className="glass-card-tags">
          {project.tags.map((tag) => (
            <span key={tag} className="glass-tag" style={{ color, borderColor: color + '30' }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Action buttons — side by side */}
        <div className="glass-card-actions">
          <button
            className="glass-card-expand"
            onClick={() => setExpanded(!expanded)}
            style={{ color }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide project details' : 'Show project details'}
          >
            {expanded ? '- Hide details' : '+ Show details'}
          </button>

          {(project.images?.length > 0 || project.github) && (
            <button
              className="glass-card-view-btn"
              onClick={() => onOpenDetail(project)}
              style={{ color }}
            >
              View Full Project
            </button>
          )}
        </div>

        {expanded && (
          <div className="glass-card-highlights" style={{ borderColor: color + '20' }}>
            <h4 style={{ color }}>{t('projects.highlights')}</h4>
            <ul>
              {project.highlights[lang].map((item, i) => (
                <li key={i}>
                  <span className="highlight-dot animate-led" style={{ backgroundColor: color, color }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </TiltCard>
    </ScrollReveal>
  );
}

export default function Projects() {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');
  const [detailProject, setDetailProject] = useState(null);

  const filters = [
    { key: 'all', label: t('projects.filterAll'), color: '#00f0ff' },
    { key: 'hardware', label: t('projects.filterHardware'), color: '#ffbe0b' },
    { key: 'firmware', label: t('projects.filterFirmware'), color: '#00f0ff' },
  ];

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  return (
    <>
    {detailProject && (
      <ProjectDetail project={detailProject} onClose={() => setDetailProject(null)} />
    )}
    <section id="projects" className="portfolio-section">
      <ScrollReveal>
        <span className="tag">01 — Projects</span>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <h2 className="section-title">{t('projects.title')}</h2>
        <p className="section-sub">{t('projects.subtitle')}</p>
      </ScrollReveal>

      {/* Filters */}
      <div className="filter-row">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            style={{
              '--btn-color': f.color,
              borderColor: filter === f.key ? f.color : 'rgba(255,255,255,0.1)',
              color: filter === f.key ? '#fff' : f.color,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="cards-grid">
        {filtered.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} onOpenDetail={setDetailProject} />
        ))}
      </div>
    </section>
    </>
  );
}
