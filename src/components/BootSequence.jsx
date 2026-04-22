import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const bootLines = [
  { text: "AM-BIOS v2.0 — Embedded Systems Portfolio", delay: 0, color: "#00f0ff" },
  { text: "Copyright (C) 2025 Ali Mansouri", delay: 200, color: "#8892a4" },
  { text: "", delay: 400 },
  { text: "Detecting CPU............. STM32F4 @ 168MHz", delay: 600, status: "OK" },
  { text: "Detecting GPU............. KiCAD Renderer v8.0", delay: 900, status: "OK" },
  { text: "RAM...................... 256KB SRAM", delay: 1200, status: "OK" },
  { text: "Flash.................... 1MB Internal", delay: 1400, status: "OK" },
  { text: "", delay: 1600 },
  { text: "Loading firmware......... ali_core.bin", delay: 1800, status: "OK" },
  { text: "Initializing USART....... 115200 baud", delay: 2100, status: "OK" },
  { text: "Initializing SPI......... Mode 0, 8MHz", delay: 2300, status: "OK" },
  { text: "Initializing CAN......... 500Kbps", delay: 2500, status: "OK" },
  { text: "Initializing BLE......... ESP32 Stack", delay: 2700, status: "OK" },
  { text: "", delay: 2900 },
  { text: "Mounting projects........ 3 found", delay: 3100, color: "#39ff14", status: "OK" },
  { text: "Loading PCB designs...... KiCAD / Altium", delay: 3300, color: "#39ff14", status: "OK" },
  { text: "Calibrating sensors...... GNSS + IMU", delay: 3500, color: "#39ff14", status: "OK" },
  { text: "", delay: 3700 },
  { text: "All systems ready. Launching portfolio...", delay: 3900, color: "#00f0ff" },
];

export default function BootSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = bootLines.map((line, i) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
        setProgress(Math.round(((i + 1) / bootLines.length) * 100));
      }, line.delay)
    );

    const done = setTimeout(onComplete, 4800);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [onComplete]);

  useEffect(() => {
    const skip = () => onComplete();
    window.addEventListener('keydown', skip, { once: true });
    return () => window.removeEventListener('keydown', skip);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="boot-backdrop"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="boot-shell">
          <div className="boot-window">
            <div className="boot-titlebar">
              <span className="boot-dot boot-dot--red" />
              <span className="boot-dot boot-dot--amber" />
              <span className="boot-dot boot-dot--green" />
              <span className="boot-titlebar-label">AM-BIOS v2.0</span>
            </div>

            <div className="boot-logs">
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                  className="boot-log-line"
                  style={{ color: line.color || '#e2e8f0' }}
                >
                  <span>{line.text}</span>
                  {line.status && <span className="boot-log-status">[{line.status}]</span>}
                </motion.div>
              ))}
              <span className="boot-caret animate-blink" />
            </div>

            <div className="boot-progress-row">
              <div className="boot-progress-track">
                <motion.div
                  className="boot-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="boot-progress-label">{progress}%</span>
            </div>
          </div>

          <button onClick={onComplete} className="boot-skip-btn">
            Click or press any key to skip...
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
