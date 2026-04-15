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
      en: "IoT BLE Smart Device",
      it: "Dispositivo Smart IoT BLE",
    },
    company: "P2CAM",
    role: {
      en: "IoT Engineer",
      it: "Ingegnere IoT",
    },
    period: "Aug 2024 - Jan 2026",
    description: {
      en: "Designed custom PCBs integrating ESP32 microcontrollers for BLE communication. Programmed and tested algorithms for seamless mobile application connectivity. Performed image processing and object detection on microcontrollers with embedded AI accelerators.",
      it: "Progettato PCB custom con microcontrollori ESP32 per comunicazione BLE. Programmato e testato algoritmi per connettività mobile. Elaborazione immagini e rilevamento oggetti su microcontrollori con acceleratori AI.",
    },
    tags: ["ESP32", "BLE", "LVGL", "PCB Design", "AI/ML", "Python"],
    category: "firmware",
    highlights: {
      en: [
        "ESP32-based BLE communication stack",
        "Embedded AI object detection on MCU",
        "Custom LVGL UI for mobile integration",
      ],
      it: [
        "Stack comunicazione BLE basato su ESP32",
        "Rilevamento oggetti AI embedded su MCU",
        "UI LVGL custom per integrazione mobile",
      ],
    },
    image: null,
    github: null,
    badge: "Firmware",
    badgeColor: "cyan",
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
    image: null,
    github: "https://github.com/eynmim/Life_logger",
    badge: "Firmware + DSP",
    badgeColor: "green",
  },
];
