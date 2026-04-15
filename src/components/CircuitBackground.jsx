import { useEffect, useRef } from 'react';

export default function CircuitBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Grid of circuit nodes
    const gridSize = 80;
    const nodes = [];
    const traces = [];

    function buildGrid() {
      nodes.length = 0;
      traces.length = 0;
      const cols = Math.ceil(canvas.width / gridSize) + 1;
      const rows = Math.ceil(canvas.height / gridSize) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.3) continue;
          const x = c * gridSize + (Math.random() - 0.5) * 20;
          const y = r * gridSize + (Math.random() - 0.5) * 20;
          nodes.push({
            x, y,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.3 + 0.05,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            pulsePhase: Math.random() * Math.PI * 2,
            color: Math.random() > 0.7 ? '#39ff14' : Math.random() > 0.5 ? '#ffbe0b' : '#00f0ff',
          });
        }
      }

      // Connect some nodes with traces
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < gridSize * 1.8 && Math.random() > 0.7) {
            traces.push({
              from: nodes[i],
              to: nodes[j],
              opacity: Math.random() * 0.08 + 0.02,
              color: nodes[i].color,
              signalPos: Math.random(),
              signalSpeed: Math.random() * 0.003 + 0.001,
              hasSignal: Math.random() > 0.6,
            });
          }
        }
      }
    }
    buildGrid();

    // Floating particles
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.15 + 0.03,
        color: Math.random() > 0.6 ? '#39ff14' : '#00f0ff',
      });
    }

    let time = 0;

    function draw() {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw traces
      traces.forEach((trace) => {
        ctx.beginPath();
        // Right-angle traces (L-shaped)
        const midX = trace.to.x;
        const midY = trace.from.y;
        ctx.moveTo(trace.from.x, trace.from.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(trace.to.x, trace.to.y);
        ctx.strokeStyle = trace.color;
        ctx.globalAlpha = trace.opacity;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Signal traveling along trace
        if (trace.hasSignal) {
          trace.signalPos = (trace.signalPos + trace.signalSpeed) % 1;
          const p = trace.signalPos;
          let sx, sy;
          if (p < 0.5) {
            sx = trace.from.x + (midX - trace.from.x) * (p * 2);
            sy = trace.from.y;
          } else {
            sx = midX;
            sy = midY + (trace.to.y - midY) * ((p - 0.5) * 2);
          }
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = trace.color;
          ctx.globalAlpha = 0.6;
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.opacity + pulse * 0.15;
        ctx.fill();

        // Glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.globalAlpha = 0.03 + pulse * 0.04;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
