import { ScrollReveal } from './Hero';

const FACTS = [
  { k: 'Based in', v: 'Turin, Italy' },
  { k: 'Studying', v: 'M.Sc. Embedded Systems — Polytechnic of Turin' },
  { k: 'Languages', v: 'C · C++ · Python' },
  { k: 'Status', v: 'Open to embedded roles', live: true },
];

export default function About() {
  return (
    <section id="about" className="sec">
      <div className="wrap about-grid">
        <ScrollReveal className="about-media">
          <img src="/about-portrait.png" alt="Ali soldering a PCB at his workbench" loading="lazy" />
        </ScrollReveal>
        <div className="about-copy">
          <ScrollReveal><span className="eyebrow">/ about</span></ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h2 className="sec-title">Power budgets, EMI, watchdogs — the parts nobody sees.</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p>I'm Ali — an embedded systems engineer in Turin, currently doing a <strong>Master's in
              Embedded &amp; Smart System Design</strong> at Politecnico di Torino. I've shipped a
              battery-powered IoT camera on <strong>ESP32-S3</strong>, designed <strong>UAV power
              electronics</strong> with MPPT, and built real-time robotics firmware on <strong>STM32</strong>.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p>I care about the reliability layer — multi-tier power management, EMI shielding, OTA,
              watchdogs — the engineering that keeps hardware alive in the field, not just on the bench.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="facts">
              {FACTS.map((f) => (
                <div key={f.k} className="fact">
                  <div className="fact-k">{f.k}</div>
                  <div className={`fact-v ${f.live ? 'is-live' : ''}`}>{f.v}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
