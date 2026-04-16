export const projects = [
  {
    id: 1,
    title: {
      en: "UAV Power Distribution System",
      it: "Sistema di Distribuzione Energetica UAV",
    },
    company: "Stratobotic",
    role: {
      en: "On-Board Electronics Engineer",
      it: "Ingegnere Elettronico di Bordo",
    },
    period: "Sep 2024 - Dec 2024",
    description: {
      en: "Designed and optimized PCB schematics and layouts for UAV power distribution using KiCAD. Enhanced energy efficiency with Maximum Power Point Tracking (MPPT) circuits and programmed Arduino-based GNSS tracking systems for precise positioning.",
      it: "Progettato e ottimizzato schemi PCB e layout per la distribuzione di potenza UAV usando KiCAD. Migliorata l'efficienza energetica con circuiti MPPT e programmati sistemi di tracciamento GNSS basati su Arduino.",
    },
    tags: ["KiCAD", "MPPT", "GNSS", "Arduino", "PCB Design"],
    category: "hardware",
    highlights: {
      en: [
        "Custom MPPT circuit design for solar-powered UAV",
        "GNSS tracking with sub-meter accuracy",
        "4-layer PCB with optimized power planes",
      ],
      it: [
        "Progettazione circuito MPPT per UAV solare",
        "Tracciamento GNSS con precisione sub-metrica",
        "PCB 4 strati con piani di potenza ottimizzati",
      ],
    },
    image: null, // placeholder for future image
    github: null,
    badge: "Hardware",
    badgeColor: "amber",
  },
  {
    id: 2,
    title: {
      en: "P2CAM Smart Charging Station",
      it: "Stazione di Ricarica Intelligente P2CAM",
    },
    company: "P2CAM",
    role: {
      en: "Embedded IoT Engineer",
      it: "Ingegnere IoT Embedded",
    },
    period: "Aug 2024 - Mar 2026",
    description: {
      en: "Designed a smart Li-ion charging station with RISC-V MCU (CH32X035), CN3702/CN3705 charge management ICs, 12-bit ADC voltage/temperature monitoring, addressable SK6812 RGB LEDs, and USB-PD. Engineered bulletproof EMI shielding with via fencing, guard traces, and multi-layer PCB isolation.",
      it: "Progettato una stazione di ricarica intelligente Li-ion con MCU RISC-V (CH32X035), IC di gestione carica CN3702/CN3705, monitoraggio tensione/temperatura ADC 12-bit, LED RGB SK6812 indirizzabili e USB-PD. Ingegnerizzata schermatura EMI con via fencing, guard traces e isolamento PCB multi-layer.",
    },
    tags: ["RISC-V", "PCB Design", "USB-PD", "ADC", "EMI", "KiCAD", "FreeRTOS"],
    category: "hardware",
    highlights: {
      en: [
        "RISC-V CH32X035 MCU at 48MHz with 12-bit ADC (14 channels)",
        "CN3702/CN3705 smart charge management up to 3A input",
        "Via fencing + guard traces for USB D+/D- EMI shielding",
        "SK6812 addressable RGB LEDs with 47\u03A9 termination resistor",
        "2-layer PCB with dedicated ground plane for thermal + shielding",
      ],
      it: [
        "MCU RISC-V CH32X035 a 48MHz con ADC 12-bit (14 canali)",
        "Gestione carica intelligente CN3702/CN3705 fino a 3A",
        "Via fencing + guard traces per schermatura EMI USB D+/D-",
        "LED RGB SK6812 indirizzabili con resistenza terminazione 47\u03A9",
        "PCB 2 strati con piano di massa dedicato per termico + schermatura",
      ],
    },
    images: [
      { src: "/projects/p2cam-charging-station/p2cam-3d-back.png", label: "3D Render — Top (Components)" },
      { src: "/projects/p2cam-charging-station/p2cam-3d-front.png", label: "3D Render — Bottom" },
      { src: "/projects/p2cam-charging-station/p2cam-pcb-layout.png", label: "PCB Layout (KiCAD)" },
      { src: "/projects/p2cam-charging-station/Schematic.pdf", label: "Full Schematic (PDF)", isPdf: true },
    ],
    image: "/projects/p2cam-charging-station/p2cam-3d-back.png",
    glb: "/projects/p2cam-charging-station/p2cam-pcb.glb",
    github: null,
    badge: "Hardware + PCB",
    badgeColor: "amber",
  },
  {
    id: 3,
    title: {
      en: "Autonomous Robot Control System",
      it: "Sistema di Controllo Robot Autonomo",
    },
    company: "Politecnico di Torino Robotic Team",
    role: {
      en: "Embedded Software Developer",
      it: "Sviluppatore Software Embedded",
    },
    period: "Nov 2023 - Sep 2024",
    description: {
      en: "Developed robotic functionalities using C and Python under competition constraints. Implemented real-time operating systems (RTOS) on STM32 microcontrollers and configured communication protocols (USART, CAN, SPI) for robust data exchange.",
      it: "Sviluppato funzionalità robotiche in C e Python sotto vincoli di competizione. Implementato RTOS su microcontrollori STM32 e configurato protocolli di comunicazione (USART, CAN, SPI).",
    },
    tags: ["STM32", "FreeRTOS", "C", "Python", "CAN", "SPI"],
    category: "firmware",
    highlights: {
      en: [
        "FreeRTOS task management on STM32",
        "Multi-protocol communication (CAN, SPI, USART)",
        "Competition-grade real-time performance",
      ],
      it: [
        "Gestione task FreeRTOS su STM32",
        "Comunicazione multi-protocollo (CAN, SPI, USART)",
        "Prestazioni real-time da competizione",
      ],
    },
    image: null,
    github: null,
    badge: "Firmware",
    badgeColor: "cyan",
  },
  {
    id: 4,
    title: {
      en: "Dual-Mic Neural Noise Reduction System",
      it: "Sistema di Riduzione Rumore Neurale a Doppio Microfono",
    },
    company: "Personal Project",
    role: {
      en: "Embedded DSP Engineer",
      it: "Ingegnere DSP Embedded",
    },
    period: "2025 - Present",
    description: {
      en: "Real-time voice extraction system using two INMP441 MEMS microphones with beamforming and hardware-accelerated FFT spectral subtraction on ESP32-S3. Features NSNet neural noise suppression via ESP-SR, VAD-based voice detection, live dashboard with SNR metrics, and a Python WAV recorder.",
      it: "Sistema di estrazione vocale in tempo reale con due microfoni MEMS INMP441, beamforming e sottrazione spettrale FFT accelerata in hardware su ESP32-S3. Include soppressione rumore neurale NSNet tramite ESP-SR, rilevamento vocale VAD, dashboard live con metriche SNR e registratore WAV Python.",
    },
    tags: ["ESP32-S3", "ESP-IDF", "DSP", "FreeRTOS", "Python", "AI/ML", "I2S"],
    category: "firmware",
    highlights: {
      en: [
        "Hardware-accelerated 512-point FFT via esp-dsp vector DSP extensions",
        "Dual-mic beamforming for +3 dB SNR improvement",
        "NSNet1 neural noise suppression running on-device",
        "CD-quality 44.1 kHz 16-bit PCM audio pipeline",
        "A/B comparison framework for quality validation",
      ],
      it: [
        "FFT 512-point accelerata in hardware tramite estensioni DSP esp-dsp",
        "Beamforming a doppio microfono per +3 dB di miglioramento SNR",
        "Soppressione rumore neurale NSNet1 on-device",
        "Pipeline audio PCM 16-bit a 44.1 kHz qualit\u00e0 CD",
        "Framework di confronto A/B per validazione qualit\u00e0",
      ],
    },
    images: [
      { src: "/projects/dual-mic-noise-reduction/3d-front.png", label: "3D Render — Front (Components)" },
      { src: "/projects/dual-mic-noise-reduction/3d-back.png", label: "3D Render — Back" },
      { src: "/projects/dual-mic-noise-reduction/layout-front.png", label: "PCB Layout — Front (KiCAD)" },
      { src: "/projects/dual-mic-noise-reduction/layout-back.png", label: "PCB Layout — Back (KiCAD)" },
    ],
    image: "/projects/dual-mic-noise-reduction/3d-front.png",
    glb: "/projects/dual-mic-noise-reduction/mic-proj.glb",
    github: "https://github.com/eynmim/Life_logger",
    badge: "Firmware + DSP",
    badgeColor: "green",
  },
];
