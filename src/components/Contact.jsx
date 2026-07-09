import { ScrollReveal } from './Hero';
import { LogoA } from './Nav';

const EMAIL = 'Mansouriali955@gmail.com';

const CHANNELS = [
  { label: 'GitHub', sub: '@eynmim', href: 'https://github.com/eynmim' },
  { label: 'LinkedIn', sub: 'Ali Mansouri', href: 'https://www.linkedin.com/in/ali-mansouri-767b65235/' },
  { label: 'Phone', sub: '+39 350 9738344', href: 'tel:+393509738344' },
  { label: 'Location', sub: 'Turin, Italy', href: null },
];

export default function Contact() {
  return (
    <section id="contact" className="sec contact-sec">
      <div className="wrap">
        <div className="contact-card">
          <ScrollReveal><span className="eyebrow">/ contact</span></ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h2 className="contact-head">Have a board that needs firmware,<br />or a signal worth chasing?</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <a className="contact-email" href={`mailto:${EMAIL}?subject=Let's%20talk`}>
              <span className="ce-glow"><LogoA size={30} /></span>
              <span>{EMAIL}</span>
              <span className="ce-arrow">→</span>
            </a>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="channels">
              {CHANNELS.map((c) => {
                const inner = (
                  <>
                    <span className="ch-label">{c.label}</span>
                    <span className="ch-sub">{c.sub}</span>
                  </>
                );
                return c.href
                  ? <a key={c.label} className="channel" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{inner}</a>
                  : <div key={c.label} className="channel">{inner}</div>;
              })}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
