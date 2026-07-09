import { ScrollReveal } from './Hero';
import { projects } from '../data/projectsData';
import { LogoA } from './Nav';

function Card({ p, i }) {
  const img = p.image || (p.images && p.images[0] && p.images[0].src);
  return (
    <ScrollReveal className="work-card" delay={(i % 2) * 0.08}>
      <article className="wc">
        <div className="wc-media">
          <span className="wc-badge">{p.badge}</span>
          {img
            ? <img src={img} alt={p.title.en} loading="lazy" />
            : <div className="wc-placeholder"><LogoA size={54} /></div>}
        </div>
        <div className="wc-body">
          <div className="wc-meta">{p.company} · {p.period}</div>
          <h3>{p.title.en}</h3>
          <p>{p.description.en}</p>
          <div className="chips">
            {p.tags.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
      </article>
    </ScrollReveal>
  );
}

export default function Work() {
  return (
    <section id="work" className="sec">
      <div className="wrap">
        <div className="sec-head">
          <ScrollReveal><span className="eyebrow">/ selected work</span></ScrollReveal>
          <ScrollReveal delay={0.05}><h2 className="sec-title">Things I designed &amp; shipped.</h2></ScrollReveal>
        </div>
        <div className="work-grid">
          {projects.map((p, i) => <Card key={p.id} p={p} i={i} />)}
        </div>
      </div>
    </section>
  );
}
