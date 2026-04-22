import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { projects } from '../data/projectsData';
import { ScrollReveal } from './Hero';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';

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
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onOpenDetail={setDetailProject}
            />
          ))}
        </div>
      </section>
    </>
  );
}
