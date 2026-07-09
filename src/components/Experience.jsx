import { ScrollReveal } from './Hero';

const XP = [
  {
    org: 'P2CAM', role: 'Embedded IoT Engineer', period: 'Aug 2024 – Mar 2026',
    body: 'Led the end-to-end firmware of a battery-powered IoT camera on ESP32-S3 — 15+ subsystems from BLE to an animated LVGL UI. Extended field battery life beyond 6 months (99% idle-power cut), built a sub-100 ms BLE protocol, OTA updates and a multi-layer watchdog on dual-core FreeRTOS.',
    tags: ['ESP32-S3', 'BLE', 'FreeRTOS', 'LVGL', 'Power Mgmt', 'OTA'],
  },
  {
    org: 'Stratobotic', role: 'On-Board Electronics Engineer', period: 'Sep 2024 – Dec 2024',
    body: 'Designed and optimized PCB schematics and layouts for UAV power distribution in KiCAD, with custom MPPT circuits for a solar-powered UAV and Arduino-based GNSS tracking with sub-meter accuracy. Received a strong recommendation for the work.',
    tags: ['KiCAD', 'MPPT', 'GNSS', 'Power Optimization'],
  },
  {
    org: 'Politecnico di Torino — Robotic Team', role: 'Embedded Software Developer', period: 'Nov 2023 – Sep 2024',
    body: 'Developed robotic functionalities in C and Python under competition constraints — real-time operating systems on STM32 and robust CAN/SPI/USART communication between subsystems.',
    tags: ['STM32', 'FreeRTOS', 'C', 'CAN', 'SPI'],
  },
];

const EDU = [
  { d: 'M.Sc. Computer Engineering — Embedded & Smart System Design', s: 'Polytechnic University of Turin', y: '2025 – 2027' },
  { d: 'B.Sc. Electronics & Communication Engineering', s: 'Polytechnic University of Turin', y: '2022 – 2025' },
];

export default function Experience() {
  return (
    <section id="experience" className="sec">
      <div className="wrap">
        <div className="sec-head">
          <ScrollReveal><span className="eyebrow">/ experience</span></ScrollReveal>
          <ScrollReveal delay={0.05}><h2 className="sec-title">Where I've built.</h2></ScrollReveal>
        </div>
        <div className="timeline">
          {XP.map((x, i) => (
            <ScrollReveal key={x.org} className="tl-item" delay={i * 0.05}>
              <div className="tl-dot" />
              <div className="tl-card">
                <div className="tl-top"><h3>{x.org}</h3><span className="tl-period">{x.period}</span></div>
                <div className="tl-role">{x.role}</div>
                <p>{x.body}</p>
                <div className="chips">{x.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="edu">
          {EDU.map((e) => (
            <ScrollReveal key={e.d} className="edu-item">
              <div className="edu-y">{e.y}</div>
              <div><div className="edu-d">{e.d}</div><div className="edu-s">{e.s}</div></div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
