import { useEffect, useRef } from 'react';

/* Subtle ambient PCB circuit-trace background — orange, reacts to mouse + scroll.
   Sits behind all content (below the hero, which paints its own layers on top). */
export default function SignalBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    let reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    const GROUND = null; // transparent — body bg shows
    const C_ORANGE = [255, 90, 31], C_AMBER = [255, 171, 64], C_NODE = [255, 138, 60], C_DEEP = [122, 26, 10];
    let W = 0, H = 0, dpr = 1, traces = [], GRID = 46, running = false, rafId = 0, lastT = 0;
    let mx = -9999, my = -9999, tmx = -9999, tmy = -9999, haveMouse = false;
    const MRAD = 150;
    let scrollY = 0, lastScrollY = 0, scrollVel = 0, scrollProg = 0;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const rand = (a, b) => a + Math.random() * (b - a);
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const mix = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];

    function build() {
      traces = [];
      if (W <= 0 || H <= 0) return;
      const count = Math.round(clamp((W * H) / 130000, 7, 16)), marginY = Math.max(120, H * 0.25);
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (let i = 0; i < count; i++) {
        const pts = []; let gx = Math.round(rand(0, W) / GRID) * GRID, gy = Math.round(rand(-marginY, H + marginY) / GRID) * GRID;
        let d = dirs[(Math.random() * 4) | 0]; const steps = rand(4, 8) | 0;
        pts.push({ x: gx, y: gy });
        for (let s = 0; s < steps; s++) {
          const len = GRID * ((rand(1, 4) | 0) || 1), nx = gx + d[0] * len, ny = gy + d[1] * len;
          if (nx < -GRID * 2 || nx > W + GRID * 2 || ny < -marginY - GRID || ny > H + marginY + GRID) {
            d = d[0] !== 0 ? [0, Math.random() < 0.5 ? 1 : -1] : [Math.random() < 0.5 ? 1 : -1, 0]; continue;
          }
          gx = nx; gy = ny; pts.push({ x: gx, y: gy });
          d = d[0] !== 0 ? [0, Math.random() < 0.5 ? 1 : -1] : [Math.random() < 0.5 ? 1 : -1, 0];
        }
        if (pts.length < 2) continue;
        const seg = []; let total = 0;
        for (let k = 0; k < pts.length - 1; k++) { const L = Math.abs(pts[k + 1].x - pts[k].x) + Math.abs(pts[k + 1].y - pts[k].y); seg.push(L); total += L; }
        if (total < GRID) continue;
        const np = 1 + (Math.random() < 0.4 ? 1 : 0), pulses = [];
        for (let p = 0; p < np; p++) pulses.push({ pos: Math.random() * total, spd: rand(24, 42) * rand(0.85, 1.15) });
        traces.push({ pts, seg, total, depth: rand(0.35, 1), pulses, baseA: rand(0.05, 0.09), glow: 0 });
      }
    }
    function pointAt(tr, dist) {
      let total = tr.total; dist = ((dist % total) + total) % total;
      const pts = tr.pts, seg = tr.seg;
      for (let i = 0; i < seg.length; i++) { if (dist <= seg[i]) { const t = seg[i] === 0 ? 0 : dist / seg[i], a = pts[i], b = pts[i + 1]; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; } dist -= seg[i]; }
      const last = pts[pts.length - 1]; return { x: last.x, y: last.y };
    }
    function resize() {
      const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      dpr = Math.min(devicePixelRatio || 1, 2); W = w; H = h;
      canvas.width = Math.max(1, w * dpr | 0); canvas.height = Math.max(1, h * dpr | 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build(); if (reduce) draw(0, false);
    }
    function influence(tr, ox, oy) {
      if (!haveMouse) return 0; let best = 1e9;
      for (let i = 0; i < tr.pts.length; i++) { const dx = tr.pts[i].x + ox - mx, dy = tr.pts[i].y + oy - my, dd = dx * dx + dy * dy; if (dd < best) best = dd; }
      best = Math.sqrt(best); return best > MRAD ? 0 : 1 - best / MRAD;
    }
    function draw(t, animate) {
      ctx.clearRect(0, 0, W, H);
      if (W <= 0 || traces.length === 0) return;
      if (haveMouse && mx > -9000) {
        const gr = 190, gi = 0.05 * (1 - 0.35 * clamp(scrollProg, 0, 1));
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, gr);
        g.addColorStop(0, rgba(C_ORANGE, gi)); g.addColorStop(0.5, rgba(C_DEEP, gi * 0.4)); g.addColorStop(1, rgba(C_DEEP, 0));
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, gr, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      }
      const pmx = haveMouse ? mx - W / 2 : 0, pmy = haveMouse ? my - H / 2 : 0;
      const pColor = mix(C_ORANGE, C_AMBER, clamp(scrollProg, 0, 1)), velBoost = clamp(Math.abs(scrollVel) * 0.9, 0, 1.3);
      for (let i = 0; i < traces.length; i++) {
        const tr = traces[i];
        const ox = -scrollY * 0.04 * tr.depth + pmx * 0.01 * tr.depth, oy = -scrollY * 0.11 * tr.depth + pmy * 0.01 * tr.depth;
        const infl = influence(tr, ox, oy); tr.glow += (infl - tr.glow) * (animate ? 0.12 : 1);
        ctx.save(); ctx.translate(ox, oy);
        ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 1; ctx.lineJoin = 'miter';
        ctx.strokeStyle = rgba(mix(C_ORANGE, C_AMBER, 0.15), tr.baseA + tr.glow * 0.25);
        ctx.beginPath(); ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
        for (let k = 1; k < tr.pts.length; k++) ctx.lineTo(tr.pts[k].x, tr.pts[k].y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        const nodeA = 0.12 + tr.glow * 0.45;
        for (let v = 0; v < tr.pts.length; v++) { const isEnd = v === 0 || v === tr.pts.length - 1; ctx.fillStyle = rgba(C_NODE, nodeA); ctx.beginPath(); ctx.arc(tr.pts[v].x, tr.pts[v].y, isEnd ? 2 : 1.4, 0, 6.2832); ctx.fill(); }
        const speedMul = 1 + tr.glow * 1.4 + velBoost;
        for (let pi = 0; pi < tr.pulses.length; pi++) {
          const pu = tr.pulses[pi]; if (animate) pu.pos = (pu.pos + pu.spd * speedMul * (t ? 0.016 : 0)) % tr.total;
          const headA = 0.4 + tr.glow * 0.4, TRAIL = 5, step = 7;
          for (let t2 = TRAIL; t2 >= 0; t2--) {
            const pt = pointAt(tr, pu.pos - t2 * step), f = 1 - t2 / (TRAIL + 1), rr = (1.4 + f * 3) * (0.7 + tr.glow * 0.6), a = headA * f * f;
            const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, rr * 2.4);
            g.addColorStop(0, rgba(pColor, a)); g.addColorStop(0.5, rgba(pColor, a * 0.4)); g.addColorStop(1, rgba(pColor, 0));
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pt.x, pt.y, rr * 2.4, 0, 6.2832); ctx.fill();
          }
        }
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    function tick(now) {
      if (!running) return;
      lastT = now;
      if (haveMouse) { mx += (tmx - mx) * 0.12; my += (tmy - my) * 0.12; }
      scrollVel += ((scrollY - lastScrollY) - scrollVel) * 0.2; lastScrollY = scrollY;
      draw(now, true); rafId = requestAnimationFrame(tick);
    }
    function start() { if (running || reduce) return; running = true; lastT = 0; rafId = requestAnimationFrame(tick); }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
    const onMove = (e) => { tmx = e.clientX; tmy = e.clientY; if (!haveMouse) { mx = tmx; my = tmy; } haveMouse = true; };
    const onLeave = () => { haveMouse = false; tmx = tmy = -9999; };
    const onScroll = () => { scrollY = pageYOffset || document.documentElement.scrollTop || 0; const max = (document.documentElement.scrollHeight - innerHeight) || 1; scrollProg = clamp(scrollY / max, 0, 1); };
    const onVis = () => { document.hidden ? stop() : start(); };
    let rt = 0; const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 150); };

    resize(); onScroll();
    addEventListener('resize', onResize);
    addEventListener('scroll', onScroll, { passive: true });
    if (reduce) { draw(0, false); }
    else {
      addEventListener('mousemove', onMove, { passive: true });
      addEventListener('mouseout', onLeave);
      document.addEventListener('visibilitychange', onVis);
      start();
    }
    return () => {
      stop(); clearTimeout(rt);
      removeEventListener('resize', onResize); removeEventListener('scroll', onScroll);
      removeEventListener('mousemove', onMove); removeEventListener('mouseout', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="signal-bg" aria-hidden="true" />;
}
