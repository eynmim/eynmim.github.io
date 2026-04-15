const ITEMS = [
  "STM32", "ESP32", "FreeRTOS", "KiCAD", "Altium",
  "C/C++", "Python", "BLE", "CAN", "SPI",
  "PCB Design", "LVGL", "GNSS", "MPPT", "IoT",
  "Docker", "Git", "ARM Cortex-M",
];

export default function Marquee() {
  const content = ITEMS.map(
    (t, i) => `<span class="marquee-item">${t}</span><span class="marquee-sep">\u2726</span>`
  ).join('');

  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div
        className="marquee-track"
        dangerouslySetInnerHTML={{ __html: content + content }}
      />
    </div>
  );
}
