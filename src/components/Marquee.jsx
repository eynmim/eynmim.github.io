const ITEMS = [
  "STM32", "ESP32", "FreeRTOS", "KiCAD", "Altium",
  "C/C++", "Python", "BLE", "CAN", "SPI",
  "PCB Design", "LVGL", "GNSS", "MPPT", "IoT",
  "Docker", "Git", "ARM Cortex-M",
];

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((text, i) => (
          <span key={i} className="marquee-item-wrap">
            <span className="marquee-item">{text}</span>
            <span className="marquee-sep">{'\u2726'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
