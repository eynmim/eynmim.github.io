import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { ScrollReveal } from './Hero';
import TiltCard from './TiltCard';

const categoryColors = {
  hardware: '#ffbe0b',
  firmware: '#00f0ff',
  python: '#39ff14',
};

export default function ProjectCard({ project, index, onOpenDetail }) {
  const { lang, t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const color = categoryColors[project.category] || '#00f0ff';
  const hasDetails = project.images?.length > 0 || project.github;

  return (
    <ScrollReveal delay={index * 0.1}>
      <TiltCard color={color}>
        <div className="glass-card-top">
          <span className="glass-card-badge" style={{ color, borderColor: color + '44' }}>
            {project.badge}
          </span>
          <span className="glass-card-period">{project.period}</span>
        </div>

        <div
          className="glass-card-image"
          style={{ borderColor: color + '15', cursor: 'pointer' }}
          onClick={() => onOpenDetail(project)}
        >
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

        <h3
          className="glass-card-title"
          style={{ cursor: 'pointer' }}
          onClick={() => onOpenDetail(project)}
        >
          {project.title[lang]}
        </h3>
        <p className="glass-card-company" style={{ color }}>{project.company} — {project.role[lang]}</p>
        <p className="glass-card-desc">{project.description[lang]}</p>

        <div className="glass-card-tags">
          {project.tags.map((tag) => (
            <span key={tag} className="glass-tag" style={{ color, borderColor: color + '30' }}>
              {tag}
            </span>
          ))}
        </div>

        <div className="glass-card-actions">
          <button
            className="glass-card-expand"
            onClick={() => setExpanded((v) => !v)}
            style={{ color }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide project details' : 'Show project details'}
          >
            {expanded ? '- Hide details' : '+ Show details'}
          </button>

          {hasDetails && (
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
