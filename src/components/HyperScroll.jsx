import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';

const CONFIG = {
  itemCount: 18,
  starCount: 120,
  zGap: 800,
  loopSize: 0,
  camSpeed: 2.5,
  colors: ['#00f0ff', '#39ff14', '#ffbe0b', '#b537f2'],
};
CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

const HERO_TEXTS = [
  "FIRMWARE", "STM32", "PCB", "EMBEDDED",
  "RTOS", "KiCAD", "ESP32", "SIGNAL",
  "IoT", "CIRCUIT",
];

const CARD_DATA = [
  {
    id: 'PRJ-001',
    title: 'UAV POWER',
    subtitle: 'Stratobotic',
    detail: 'MPPT Circuit + GNSS Tracking',
    grid: 'PCB: 4-Layer',
    data: 'KiCAD v8',
    accent: '#ffbe0b',
  },
  {
    id: 'PRJ-002',
    title: 'IoT BLE',
    subtitle: 'P2CAM',
    detail: 'ESP32 + AI Object Detection',
    grid: 'MCU: ESP32-S3',
    data: 'LVGL UI',
    accent: '#00f0ff',
  },
  {
    id: 'PRJ-003',
    title: 'ROBOTICS',
    subtitle: 'PoliTO Team',
    detail: 'FreeRTOS + CAN/SPI',
    grid: 'MCU: STM32F4',
    data: 'C / Python',
    accent: '#39ff14',
  },
  {
    id: 'PRJ-004',
    title: 'NEURAL DSP',
    subtitle: 'Life Logger',
    detail: 'Dual-Mic Beamforming + NSNet AI',
    grid: 'MCU: ESP32-S3',
    data: 'esp-dsp FFT',
    accent: '#b537f2',
  },
  {
    id: 'SKL-010',
    title: 'C / C++',
    subtitle: 'Firmware',
    detail: 'Bare-metal & RTOS',
    grid: 'HAL / LL',
    data: '5+ Years',
    accent: '#00f0ff',
  },
  {
    id: 'SKL-011',
    title: 'PYTHON',
    subtitle: 'Automation',
    detail: 'RPi4 + Serial + Vision',
    grid: 'OpenCV',
    data: 'Scripting',
    accent: '#39ff14',
  },
  {
    id: 'SKL-012',
    title: 'PCB DESIGN',
    subtitle: 'Hardware',
    detail: 'Schematic \u2192 Layout \u2192 Fab',
    grid: 'KiCAD / Altium',
    data: 'Multi-Layer',
    accent: '#ffbe0b',
  },
  {
    id: 'SKL-013',
    title: 'FreeRTOS',
    subtitle: 'Real-Time',
    detail: 'Task Scheduling & Semaphores',
    grid: 'ARM Cortex-M',
    data: 'Hard RT',
    accent: '#b537f2',
  },
  {
    id: 'EXP-020',
    title: 'PROTOCOLS',
    subtitle: 'Communication',
    detail: 'USART \u2022 SPI \u2022 I2C \u2022 CAN \u2022 BLE',
    grid: 'Full-Duplex',
    data: 'Multi-Bus',
    accent: '#00f0ff',
  },
  {
    id: 'EXP-021',
    title: 'SENSORS',
    subtitle: 'Interfacing',
    detail: 'GNSS \u2022 IMU \u2022 ADC \u2022 PWM',
    grid: 'Analog + Digital',
    data: 'Signal Proc',
    accent: '#ffbe0b',
  },
  {
    id: 'EDU-030',
    title: 'B.Sc. EE',
    subtitle: 'PoliTO',
    detail: 'Electronics & Communication',
    grid: 'Turin, Italy',
    data: '2022-2025',
    accent: '#b537f2',
  },
];

export default function HyperScroll({ onEnterPortfolio }) {
  const worldRef = useRef(null);
  const viewportRef = useRef(null);
  const stateRef = useRef({ scroll: 0, velocity: 0, targetSpeed: 0, mouseX: 0, mouseY: 0 });
  const velRef = useRef(null);
  const fpsRef = useRef(null);
  const coordRef = useRef(null);

  useEffect(() => {
    const world = worldRef.current;
    const viewport = viewportRef.current;
    if (!world || !viewport) return;

    const items = [];
    let cardDataIndex = 0;

    for (let i = 0; i < CONFIG.itemCount; i++) {
      const el = document.createElement('div');
      el.className = 'hyper-item';

      const isHeading = i % 3 === 0;

      if (isHeading) {
        const txt = document.createElement('div');
        txt.className = 'hyper-big-text';
        txt.innerText = HERO_TEXTS[i % HERO_TEXTS.length];
        el.appendChild(txt);
        items.push({ el, type: 'text', x: 0, y: 0, rot: 0, baseZ: -i * CONFIG.zGap });
      } else {
        const cardInfo = CARD_DATA[cardDataIndex % CARD_DATA.length];
        cardDataIndex++;

        const card = document.createElement('div');
        card.className = 'hyper-card';
        card.style.setProperty('--card-accent', cardInfo.accent);
        card.innerHTML = `
          <div class="hyper-card-header">
            <span class="hyper-card-id">${cardInfo.id}</span>
            <div style="width:8px;height:8px;background:${cardInfo.accent};box-shadow:0 0 6px ${cardInfo.accent};border-radius:1px;"></div>
          </div>
          <div class="hyper-card-body">
            <h2>${cardInfo.title}</h2>
            <span class="hyper-card-sub">${cardInfo.subtitle}</span>
            <p class="hyper-card-detail">${cardInfo.detail}</p>
          </div>
          <div class="hyper-card-footer">
            <span>${cardInfo.grid}</span>
            <span>${cardInfo.data}</span>
          </div>
          <div class="hyper-card-num">0${i}</div>
        `;
        el.appendChild(card);

        // FIX 1: Push cards MUCH further from center so they don't cover the name
        const angle = (i / CONFIG.itemCount) * Math.PI * 6;
        const spreadX = window.innerWidth * 0.42;
        const spreadY = window.innerHeight * 0.4;
        const x = Math.cos(angle) * spreadX;
        const y = Math.sin(angle) * spreadY;
        const rot = (Math.random() - 0.5) * 20;

        items.push({ el, type: 'card', x, y, rot, baseZ: -i * CONFIG.zGap });
      }
      world.appendChild(el);
    }

    // Stars
    for (let i = 0; i < CONFIG.starCount; i++) {
      const el = document.createElement('div');
      el.className = 'hyper-star';
      const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      el.style.background = color;
      el.style.boxShadow = `0 0 4px ${color}`;
      world.appendChild(el);
      items.push({
        el, type: 'star',
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        baseZ: -Math.random() * CONFIG.loopSize,
      });
    }

    // Mouse tracking
    const onMouse = (e) => {
      stateRef.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      stateRef.current.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    // Lenis
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

    lenis.on('scroll', ({ scroll, velocity }) => {
      stateRef.current.scroll = scroll;
      stateRef.current.targetSpeed = velocity;
    });

    // RAF loop
    let lastTime = 0;
    let frameCount = 0;

    function raf(time) {
      lenis.raf(time);
      const delta = time - lastTime;
      lastTime = time;
      frameCount++;

      if (frameCount % 10 === 0 && fpsRef.current) {
        fpsRef.current.innerText = Math.round(1000 / delta);
      }

      const st = stateRef.current;
      st.velocity += (st.targetSpeed - st.velocity) * 0.1;

      if (velRef.current) velRef.current.innerText = Math.abs(st.velocity).toFixed(2);
      if (coordRef.current) coordRef.current.innerText = st.scroll.toFixed(0);

      const tiltX = st.mouseY * 5 - st.velocity * 0.5;
      const tiltY = st.mouseX * 5;
      world.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

      const fov = 1000 - Math.min(Math.abs(st.velocity) * 10, 600);
      viewport.style.perspective = `${fov}px`;

      const cameraZ = st.scroll * CONFIG.camSpeed;

      items.forEach((item) => {
        let relZ = item.baseZ + cameraZ;
        const modC = CONFIG.loopSize;
        let vizZ = ((relZ % modC) + modC) % modC;
        if (vizZ > 500) vizZ -= modC;

        let alpha = 1;
        if (vizZ < -3000) alpha = 0;
        else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;
        if (vizZ > 100 && item.type !== 'star') alpha = 1 - (vizZ - 100) / 400;
        if (alpha < 0) alpha = 0;

        item.el.style.opacity = alpha;

        if (alpha > 0) {
          let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

          if (item.type === 'star') {
            const stretch = Math.max(1, Math.min(1 + Math.abs(st.velocity) * 0.1, 10));
            trans += ` scale3d(1, 1, ${stretch})`;
          } else if (item.type === 'text') {
            trans += ` rotateZ(${item.rot}deg)`;
            if (Math.abs(st.velocity) > 1) {
              const offset = st.velocity * 2;
              item.el.style.textShadow = `${offset}px 0 #ff2d6b, ${-offset}px 0 #00f0ff`;
            } else {
              item.el.style.textShadow = 'none';
            }
          } else {
            const t2 = time * 0.001;
            const float = Math.sin(t2 + item.x) * 8;
            trans += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;
          }

          item.el.style.transform = trans;
        }
      });

      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('mousemove', onMouse);
      while (world.firstChild) world.removeChild(world.firstChild);
    };
  }, []);

  return (
    <div className="hyper-scroll-container">
      {/* Overlays */}
      <div className="hyper-scanlines" />
      <div className="hyper-vignette" />
      <div className="hyper-noise" />

      {/* HUD */}
      <div className="hyper-hud">
        <div className="hyper-hud-top">
          <span>SYS.<strong style={{ color: '#39ff14' }}>READY</strong></span>
          <div className="hyper-hud-line" />
          <span>FPS: <strong ref={fpsRef} style={{ color: '#00f0ff' }}>60</strong></span>
        </div>

        {/* FIX 3: Social links in HUD — top-right area */}
        <div className="hyper-hud-socials">
          <a href="https://github.com/eynmim" target="_blank" rel="noopener noreferrer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>
          <a href="https://www.linkedin.com/in/ali-mansouri-767b65235/" target="_blank" rel="noopener noreferrer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span>LinkedIn</span>
          </a>
        </div>

        <div className="hyper-hud-left">
          SCROLL_VEL // <strong ref={velRef} style={{ color: '#00f0ff' }}>0.00</strong>
        </div>

        <div className="hyper-hud-bottom">
          <span>Z_COORD: <strong ref={coordRef} style={{ color: '#00f0ff' }}>0</strong></span>
          <div className="hyper-hud-line" />
          <span>AM-SYS v2.0 [EMBEDDED]</span>
        </div>
      </div>

      {/* Center identity — FIX 5: better tagline and visibility */}
      <div className="hyper-center-id">
        <div className="hyper-center-name">ALI MANSOURI</div>
        <div className="hyper-center-title">EMBEDDED SYSTEMS ENGINEER</div>
        <div className="hyper-center-tagline">
          I design circuits. I write firmware. I build systems that work.
        </div>
      </div>

      {/* FIX 4: Animated scroll indicator */}
      <div className="hyper-scroll-hint">
        <div className="hyper-scroll-hint-text">SCROLL TO EXPLORE</div>
        <div className="hyper-scroll-hint-arrow">
          <svg width="20" height="30" viewBox="0 0 20 30">
            <rect x="7" y="0" width="6" height="20" rx="3" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
            <circle cx="10" cy="6" r="2" fill="#00f0ff" opacity="0.8">
              <animate attributeName="cy" values="6;14;6" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <path d="M 4 24 L 10 30 L 16 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.4">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
      </div>

      {/* FIX 2: Enter portfolio button — more prominent with neon pulse */}
      <button className="hyper-enter-btn" onClick={onEnterPortfolio}>
        <span className="hyper-enter-btn-icon">{'>'}</span>
        <span>ENTER PORTFOLIO</span>
        <span className="hyper-enter-btn-glow" />
      </button>

      {/* 3D Scene */}
      <div className="hyper-viewport" ref={viewportRef}>
        <div className="hyper-world" ref={worldRef} />
      </div>

      <div className="hyper-scroll-proxy" />
    </div>
  );
}
