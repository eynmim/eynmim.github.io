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
];
