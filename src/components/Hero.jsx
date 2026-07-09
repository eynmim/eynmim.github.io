import { useEffect, useRef } from 'react';

/* Kept — used by other sections for scroll-in reveals */
function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('in-view'); },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
export { ScrollReveal };

/* ──────────────────────────────────────────────────────────────
   SIGNAL HERO — scroll dives into the eye (scrubbed Kling video),
   through the pupil into black, then signal particles are born
   and morph: eclipse ring → helix → Gaussian "Wow!" (6EQUJ5).
   ────────────────────────────────────────────────────────────── */
export default function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = (s) => root.querySelector(s);
    const cv = q('.sh-canvas'), dive = q('.sh-dive'), pupil = q('.sh-pupil');
    const heroText = q('.sh-text'), layers = q('.sh-layers');
    const head = q('.sh-head'), hh = q('.sh-hh'), hp = q('.sh-hp');
    const readout = q('.sh-readout'), elSnr = q('.sh-snr'), wowbox = q('.sh-wowbox'), hint = q('.sh-hint');
    const ctx = cv.getContext('2d');
    let reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

    // ── particle formations ──
    const N = 5200;
    const ecl = new Float32Array(N * 3), hel = new Float32Array(N * 3), wav = new Float32Array(N * 3), seed = new Float32Array(N);
    const rnd = Math.random;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3; seed[i] = rnd();
      let a = rnd() * 6.2832, rr = 1.12 + (rnd() + rnd() + rnd() - 1.5) * 0.05; if (rnd() < 0.13) rr *= rnd() * 0.9;
      ecl[i3] = Math.cos(a) * rr; ecl[i3 + 1] = Math.sin(a) * rr; ecl[i3 + 2] = (rnd() - 0.5) * 0.16;
      const ty = (rnd() - 0.5) * 2.7, st = (i & 1) ? Math.PI : 0.0, hpp = ty * 3.1 + st;
      hel[i3] = Math.cos(hpp) * 0.55; hel[i3 + 1] = ty; hel[i3 + 2] = Math.sin(hpp) * 0.55;
      const wx = (rnd() - 0.5) * 3.0, gg = Math.exp(-Math.pow(wx * 1.45, 2.0)) * 1.3 - 0.35;
      wav[i3] = wx; wav[i3 + 1] = gg + (rnd() - 0.5) * 0.05; wav[i3 + 2] = (rnd() - 0.5) * 0.55;
    }
    // additive glow sprite
    const spr = document.createElement('canvas'); spr.width = spr.height = 48;
    const scx = spr.getContext('2d');
    const g = scx.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255,225,190,1)'); g.addColorStop(0.25, 'rgba(255,150,70,0.85)');
    g.addColorStop(0.6, 'rgba(255,90,30,0.28)'); g.addColorStop(1, 'rgba(255,90,30,0)');
    scx.fillStyle = g; scx.fillRect(0, 0, 48, 48);

    let W = 0, H = 0, dpr = 1, scale = 1, base = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); scale = Math.min(W, H) * 0.46; base = Math.min(W, H) * 0.020;
    };
    resize();
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const onMove = (e) => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; };
    const progress = () => {
      const f = parseFloat(new URLSearchParams(location.search).get('p')); // QA override
      if (!isNaN(f)) return clamp(f, 0, 1);
      const r = root.getBoundingClientRect(); const total = root.offsetHeight - innerHeight;
      return clamp((-r.top) / (total || 1), 0, 1);
    };
    let maxSnr = 0, curH = '';
    const FOCAL = 1.9, CAM = 3.25;
    const setHead = (h, p) => { if (curH === h) return; curH = h; hh.innerHTML = h; hp.textContent = p; };

    let raf = 0;
    const frame = (t) => {
      const s = progress(); mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      // fixed layers fade out at the very end so the next section shows through
      const layersOp = 1 - smooth(clamp((s - 0.94) / 0.06, 0, 1));
      layers.style.opacity = layersOp; layers.style.pointerEvents = layersOp < 0.05 ? 'none' : '';
      // scrub the dive video with scroll
      const diveT = clamp(s / 0.44, 0, 1);
      if (dive.duration && isFinite(dive.duration)) {
        const tt = diveT * (dive.duration - 0.06);
        if (Math.abs(dive.currentTime - tt) > 0.015) { try { dive.currentTime = tt; } catch (e) {} }
      }
      heroText.style.opacity = 1 - smooth(clamp((s - 0.02) / 0.08, 0, 1));
      pupil.style.opacity = smooth(clamp((s - 0.40) / 0.06, 0, 1));
      // particles emerge from within the pupil
      const vis = smooth(clamp((s - 0.46) / 0.15, 0, 1));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (vis > 0.01) {
        const ry = mx * 0.9 + 0.22 * Math.sin(t * 0.0002) + (s - 0.46) * 0.5, rx = my * 0.5 + 0.08, rz = t * 0.00003 * (s < 0.74 ? 1 : 0.2);
        const cy_ = Math.cos(ry), sy_ = Math.sin(ry), cx_ = Math.cos(rx), sx_ = Math.sin(rx), cz_ = Math.cos(rz), sz_ = Math.sin(rz);
        let m1, m2, t1;
        if (s < 0.76) { m1 = ecl; m2 = hel; t1 = smooth(clamp((s - 0.58) / 0.18, 0, 1)); }
        else { m1 = hel; m2 = wav; t1 = smooth(clamp((s - 0.76) / 0.18, 0, 1)); }
        ctx.globalCompositeOperation = 'lighter';
        const cxp = W / 2, cyp = H / 2, tm = t * 0.001;
        for (let i = 0; i < N; i++) {
          const i3 = i * 3, sd = seed[i];
          let x = m1[i3] + (m2[i3] - m1[i3]) * t1, y = m1[i3 + 1] + (m2[i3 + 1] - m1[i3 + 1]) * t1, z = m1[i3 + 2] + (m2[i3 + 2] - m1[i3 + 2]) * t1;
          const ph = tm * 0.6 + sd * 40.0; x += 0.018 * Math.sin(ph); y += 0.018 * Math.cos(ph * 1.1); z += 0.018 * Math.sin(ph * 0.7);
          const x1 = x * cy_ + z * sy_, z1 = -x * sy_ + z * cy_;
          const y2 = y * cx_ - z1 * sx_, z2 = y * sx_ + z1 * cx_;
          let zz = z2 + CAM; if (zz < 0.15) zz = 0.15; const pr = FOCAL / zz;
          const px = x1 * pr, py = y2 * pr;
          const sxp = cxp + (px * cz_ - py * sz_) * scale, syp = cyp - (px * sz_ + py * cz_) * scale;
          let sz3 = base * pr * (0.5 + sd); if (sz3 < 1) sz3 = 1;
          ctx.globalAlpha = clamp(pr * 0.55, 0.10, 0.9) * vis;
          ctx.drawImage(spr, sxp - sz3, syp - sz3, sz3 * 2, sz3 * 2);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      const snr = Math.round(30 * smooth(clamp((s - 0.58) / 0.32, 0, 1))); if (snr > maxSnr) maxSnr = snr;
      elSnr.textContent = Math.max(1, maxSnr);
      head.style.opacity = s > 0.54 ? 1 : 0;
      readout.style.opacity = s > 0.58 && s < 0.94 ? 1 : 0;
      wowbox.style.opacity = s > 0.90 ? 1 : 0;
      hint.style.opacity = s < 0.05 ? 0.7 : 0;
      if (s < 0.80) setHead('Beyond<br>the <b>noise.</b>', 'A signal rises from the static — to 30× the background.');
      else setHead('6EQUJ5.<br><b>“Wow!”</b>', 'The signal in the noise. Detected once, in 1977.');
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    addEventListener('resize', resize);
    addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div className="signal-hero" id="home" ref={rootRef}>
      <div className="sh-layers">
        <video className="sh-dive" muted playsInline preload="auto" poster="/hero-dive-poster.jpg">
          <source src="/hero-dive.mp4" type="video/mp4" />
        </video>
        <div className="sh-pupil" />
        <canvas className="sh-canvas" />
        <div className="sh-text">
          <span className="sh-kick">Embedded Systems Engineer · Turin</span>
          <h1>I make<br />hardware <b>think.</b></h1>
          <p className="sh-sub">PCB, firmware, DSP — and the last 1% that makes hardware reliable in the field.</p>
        </div>
        <div className="sh-ov">
          <div className="sh-head">
            <h1 className="sh-hh">Beyond<br />the <b>noise.</b></h1>
            <p className="sh-hp">A signal rises from the static.</p>
          </div>
          <div className="sh-readout">
            <div className="sh-lab">signal-to-noise</div>
            <div className="sh-big">×<b className="sh-snr">1</b></div>
          </div>
          <div className="sh-wowbox">
            <div className="sh-code"><span className="sh-ell" /><span className="sh-wow">Wow!</span>6EQUJ5</div>
            <div className="sh-cap"><b>×30</b> · 1420 MHz · narrowband · never repeated</div>
          </div>
        </div>
        <div className="sh-hint">scroll ↓</div>
      </div>
      <div className="sh-spacer" />
    </div>
  );
}
