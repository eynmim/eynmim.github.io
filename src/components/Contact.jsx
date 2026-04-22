import { useState, useRef, useEffect, useCallback } from 'react';
import { useLang } from '../context/LanguageContext';
import { ScrollReveal } from './Hero';
import SignalSentOverlay from './SignalSentOverlay';

const terminalCommands = {
  help: {
    en: `Available commands:\n  about     \u2014 Who is Ali Mansouri?\n  skills    \u2014 Technical expertise\n  contact   \u2014 Contact information\n  github    \u2014 Open GitHub profile\n  linkedin  \u2014 Open LinkedIn profile\n  clear     \u2014 Clear terminal`,
    it: `Comandi disponibili:\n  about     \u2014 Chi \u00e8 Ali Mansouri?\n  skills    \u2014 Competenze tecniche\n  contact   \u2014 Contatti\n  github    \u2014 Apri profilo GitHub\n  linkedin  \u2014 Apri profilo LinkedIn\n  clear     \u2014 Pulisci terminale`,
  },
  about: {
    en: "Embedded Systems Engineer based in Turin, Italy.\nI design PCBs, write firmware, and build IoT systems.",
    it: "Ingegnere di Sistemi Embedded a Torino, Italia.\nProgetto PCB, scrivo firmware e costruisco sistemi IoT.",
  },
  skills: {
    en: "Firmware: C/C++ | FreeRTOS | STM32 | ESP32\nHardware: KiCAD | Altium | PCB Design\nSoftware: Python | Git | Docker | Linux",
    it: "Firmware: C/C++ | FreeRTOS | STM32 | ESP32\nHardware: KiCAD | Altium | PCB\nSoftware: Python | Git | Docker | Linux",
  },
  contact: {
    en: "Email:    Mansouriali955@gmail.com\nPhone:    +39 350 9738344\nLocation: Turin, Italy",
    it: "Email:    Mansouriali955@gmail.com\nTelefono: +39 350 9738344\nLuogo:    Torino, Italia",
  },
  github: { en: ">> Opening github.com/eynmim ...", it: ">> Apertura github.com/eynmim ..." },
  linkedin: { en: ">> Opening LinkedIn ...", it: ">> Apertura LinkedIn ..." },
};

function Terminal() {
  const { lang } = useLang();
  const [history, setHistory] = useState([
    { type: 'system', text: 'AM-Terminal v2.0 \u2014 Type "help" for commands' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    const newHistory = [...history, { type: 'input', text: `ali@terminal:~$ ${cmd}` }];
    if (cmd === 'clear') { setHistory([{ type: 'system', text: 'Terminal cleared.' }]); setInput(''); return; }
    if (cmd === 'github') window.open('https://github.com/eynmim', '_blank');
    if (cmd === 'linkedin') window.open('https://www.linkedin.com/in/ali-mansouri-767b65235/', '_blank');
    const response = terminalCommands[cmd];
    if (response) newHistory.push({ type: 'output', text: response[lang] || response.en });
    else newHistory.push({ type: 'error', text: `Command not found: ${cmd}. Type "help" for commands.` });
    setHistory(newHistory);
    setInput('');
  };

  return (
    <div
      className="glass-card terminal-card"
      style={{ '--card-accent': '#00f0ff' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot terminal-dot--red" />
          <span className="terminal-dot terminal-dot--amber" />
          <span className="terminal-dot terminal-dot--green" />
        </div>
        <span className="terminal-label">AM-Terminal</span>
      </div>
      <div className="terminal-body">
        {history.map((line, i) => (
          <div key={i} className={`terminal-line terminal-line--${line.type}`}>
            {line.text}
          </div>
        ))}
        <form onSubmit={handleCommand} className="terminal-input-row">
          <span className="terminal-prompt">ali@terminal:~$&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="terminal-input"
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal command input"
          />
        </form>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function ContactForm({ onSend }) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(form);
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {[{ key: 'name', label: t('contact.formName'), type: 'text' },
        { key: 'email', label: t('contact.formEmail'), type: 'email' }].map((f) => (
        <div key={f.key} className="form-group">
          <label htmlFor={`contact-${f.key}`}>{f.label}</label>
          <input id={`contact-${f.key}`} type={f.type} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            required className="form-input" />
        </div>
      ))}
      <div className="form-group">
        <label htmlFor="contact-message">{t('contact.formMessage')}</label>
        <textarea id="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={4} required className="form-input form-textarea" />
      </div>
      <button type="submit" className="hero-cta" style={{ width: '100%', textAlign: 'center' }}>
        {'>'} {t('contact.formSend')}
      </button>
    </form>
  );
}

export default function Contact() {
  const { t } = useLang();
  const [showSignal, setShowSignal] = useState(false);
  const pendingForm = useRef(null);

  const handleSend = useCallback((form) => {
    pendingForm.current = form;
    setShowSignal(true);
  }, []);

  const handleSignalDone = useCallback(() => {
    setShowSignal(false);
    if (pendingForm.current) {
      const f = pendingForm.current;
      window.location.href = `mailto:Mansouriali955@gmail.com?subject=Contact from ${f.name}&body=${encodeURIComponent(f.message)}`;
      pendingForm.current = null;
    }
  }, []);

  return (
    <>
    <SignalSentOverlay visible={showSignal} onDone={handleSignalDone} />
    <section id="contact" className="portfolio-section">
      <ScrollReveal>
        <span className="tag">04 — Contact</span>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="section-title">{t('contact.title')}</h2>
        <p className="section-sub">{t('contact.subtitle')}</p>
      </ScrollReveal>
      <div className="contact-grid">
        <ScrollReveal delay={0.2}>
          <Terminal />
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div className="glass-card" style={{ '--card-accent': '#b537f2', padding: '1.8rem' }}>
            <ContactForm onSend={handleSend} />
            <div className="contact-links">
              <p className="section-sub" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{t('contact.orUse')}</p>
              <div className="contact-link-row">
                <a href="https://github.com/eynmim" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/ali-mansouri-767b65235/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <span>+39 350 9738344</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
    </>
  );
}
