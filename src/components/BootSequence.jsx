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

  // Skip on any keypress or click
  useEffect(() => {
    const skip = () => onComplete();
    window.addEventListener('keydown', skip, { once: true });
    return () => window.removeEventListener('keydown', skip);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ backgroundColor: '#050a0e' }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-2xl px-6">
          {/* Terminal window frame */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: '1px solid #00f0ff33',
              boxShadow: '0 0 30px #00f0ff11, 0 0 60px #00f0ff08',
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ backgroundColor: '#00f0ff08', borderColor: '#00f0ff22' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff2d6b' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbe0b' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#39ff14' }} />
              <span className="ml-3 font-mono text-xs" style={{ color: '#3e4a5c' }}>
                AM-BIOS v2.0
              </span>
            </div>

            {/* Boot content */}
            <div className="p-5 font-mono text-xs leading-6 min-h-[350px]"
              style={{ backgroundColor: '#050a0eee' }}>
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex justify-between"
                  style={{ color: line.color || '#e2e8f0' }}
                >
                  <span>{line.text}</span>
                  {line.status && (
                    <span style={{ color: '#39ff14' }}>[{line.status}]</span>
                  )}
                </motion.div>
              ))}
              <span className="inline-block w-2 h-3.5 mt-1 animate-blink"
                style={{ backgroundColor: '#00f0ff' }} />
            </div>

            {/* Progress */}
            <div className="px-5 py-3 border-t" style={{ borderColor: '#00f0ff15', backgroundColor: '#0a101808' }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#050a0e' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #00f0ff, #39ff14)',
                      boxShadow: '0 0 10px #00f0ff66',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className="font-mono text-xs" style={{ color: '#00f0ff' }}>
                  {progress}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="mt-4 font-mono text-xs block mx-auto cursor-pointer bg-transparent border-none"
            style={{ color: '#3e4a5c' }}
          >
            Click or press any key to skip...
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
