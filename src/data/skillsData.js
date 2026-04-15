export const skillCategories = [
  {
    id: "firmware",
    label: { en: "Firmware & Embedded", it: "Firmware & Embedded" },
    icon: "cpu",
    color: "#00f0ff",
    skills: [
      { name: "C/C++", level: 90 },
      { name: "FreeRTOS", level: 85 },
      { name: "STM32", level: 85 },
      { name: "ESP32 / ESP-IDF", level: 80 },
      { name: "Arduino", level: 85 },
      { name: "USART / SPI / CAN", level: 80 },
    ],
  },
  {
    id: "hardware",
    label: { en: "Hardware Design", it: "Progettazione Hardware" },
    icon: "pcb",
    color: "#ffbe0b",
    skills: [
      { name: "KiCAD", level: 85 },
      { name: "Altium Designer", level: 70 },
      { name: "PCB Layout", level: 85 },
      { name: "Schematic Design", level: 90 },
      { name: "Power Electronics", level: 75 },
      { name: "Signal Integrity", level: 70 },
    ],
  },
  {
    id: "software",
    label: { en: "Software & Tools", it: "Software & Strumenti" },
    icon: "code",
    color: "#39ff14",
    skills: [
      { name: "Python", level: 85 },
      { name: "Git / GitHub", level: 80 },
      { name: "Docker", level: 65 },
      { name: "Linux / RPi", level: 75 },
      { name: "LVGL", level: 70 },
      { name: "STM32CubeIDE", level: 85 },
    ],
  },
];
