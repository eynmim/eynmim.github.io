import { useLang } from '../context/LanguageContext';
import { ScrollReveal } from './Hero';

const experiences = [
  {
    company: "P2CAM",
    role: { en: "IoT Engineer", it: "Ingegnere IoT" },
    period: "Aug 2024 - Jan 2026",
    type: { en: "Part-Time", it: "Part-Time" },
    description: {
      en: "Designed custom PCBs with ESP32 for BLE communication. Embedded AI object detection on microcontrollers with LVGL interfaces.",
      it: "Progettato PCB custom con ESP32 per BLE. Rilevamento oggetti AI su MCU con interfacce LVGL.",
    },
    tags: ["ESP32", "BLE", "LVGL", "AI/ML"],
    color: "#00f0ff",
  },
  {
    company: "Stratobotic",
    role: { en: "On-Board Electronics Engineer", it: "Ingegnere Elettronico di Bordo" },
    period: "Sep 2024 - Dec 2024",
    type: { en: "Project-Based", it: "Basato su Progetto" },
    description: {
      en: "Designed UAV power distribution PCBs with MPPT circuits in KiCAD. Programmed GNSS tracking systems on Arduino.",
      it: "Progettato PCB distribuzione potenza UAV con MPPT in KiCAD. Programmato tracking GNSS su Arduino.",
    },
    tags: ["KiCAD", "MPPT", "GNSS", "Arduino"],
    color: "#ffbe0b",
  },
  {
    company: "PoliTO Robotic Team",
    role: { en: "Embedded Software Developer", it: "Sviluppatore Software Embedded" },
    period: "Nov 2023 - Sep 2024",
    type: { en: "Team Member", it: "Membro del Team" },
    description: {
      en: "Developed robotic functionalities with C and Python. Implemented FreeRTOS on STM32 with CAN/SPI/USART communication.",
      it: "Funzionalit\u00e0 robotiche in C e Python. FreeRTOS su STM32 con comunicazione CAN/SPI/USART.",
    },
    tags: ["STM32", "FreeRTOS", "C", "CAN"],
    color: "#39ff14",
  },
];

export default function Experience() {
  const { lang, t } = useLang();

  return (
    <section id="experience" className="portfolio-section">
      <ScrollReveal>
        <span className="tag">03 — Experience</span>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <h2 className="section-title">{t('experience.title')}</h2>
        <p className="section-sub">{t('experience.subtitle')}</p>
      </ScrollReveal>

      <div className="timeline">
        {experiences.map((exp, i) => (
          <ScrollReveal key={exp.company} delay={i * 0.15}>
            <div className="timeline-item">
              <div className="timeline-node" style={{ '--node-color': exp.color }}>
                <span className="timeline-dot" />
              </div>
              <div className="glass-card timeline-card" style={{ '--card-accent': exp.color }}>
                <div className="timeline-card-header">
                  <div>
                    <h3 className="timeline-company">{exp.company}</h3>
                    <p className="timeline-role" style={{ color: exp.color }}>{exp.role[lang]}</p>
                  </div>
                  <div className="timeline-meta">
                    <span>{exp.period}</span>
                    <span>{exp.type[lang]}</span>
                  </div>
                </div>
                <p className="timeline-desc">{exp.description[lang]}</p>
                <div className="glass-card-tags">
                  {exp.tags.map((tag) => (
                    <span key={tag} className="glass-tag" style={{ color: exp.color, borderColor: exp.color + '30' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Education */}
      <ScrollReveal delay={0.4}>
        <div className="glass-card education-card" style={{ '--card-accent': '#b537f2' }}>
          <span className="tag" style={{ color: '#b537f2' }}>{t('experience.education')}</span>
          <h3 className="education-degree">{t('experience.degree')}</h3>
          <p className="education-uni">{t('experience.university')}</p>
          <p className="education-period">{t('experience.period')}</p>
        </div>
      </ScrollReveal>
    </section>
  );
}
