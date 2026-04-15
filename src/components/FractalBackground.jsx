import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const N = 60000; // particle count (reduced slightly for 5 formations)
const POINT_SIZE = 0.045;
const BLOW_RADIUS = 6;
const BLOW_FORCE = 0.8;
const SPRING = 0.018;
const FRICTION = 0.93;

// ── FORMATION GENERATORS ──
// Each returns a Float32Array of N*3 positions

function genJellyfish(n) {
  const pos = new Float32Array(n * 3);
  const a = -1.72, b = 1.16, c = -1.35, d = 0.66;
  let x = 0.1, y = 0.1, z = 0.1;
  const raw = [];
  for (let i = 0; i < n; i++) {
    const nx = Math.sin(a * y) + Math.cos(b * z) - Math.sin(c * x);
    const ny = Math.sin(a * z) + Math.cos(b * x) - Math.sin(c * y);
    const nz = Math.sin(a * x) + Math.cos(b * y) - Math.sin(d * z);
    x = nx; y = ny; z = nz;
    raw.push(x, y, z);
  }
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < raw.length; i += 3) { cx += raw[i]; cy += raw[i+1]; cz += raw[i+2]; }
  cx /= n; cy /= n; cz /= n;
  let mx = 0;
  for (let i = 0; i < raw.length; i += 3) {
    const dd = Math.sqrt((raw[i]-cx)**2 + (raw[i+1]-cy)**2 + (raw[i+2]-cz)**2);
    if (dd > mx) mx = dd;
  }
  const s = 14.0 / (mx || 1);
  for (let i = 0; i < raw.length; i += 3) {
    pos[i] = (raw[i]-cx)*s; pos[i+1] = (raw[i+1]-cy)*s; pos[i+2] = (raw[i+2]-cz)*s;
  }
  return pos;
}

function genCircuitTraces(n) {
  // Particles form right-angle PCB-like traces
  const pos = new Float32Array(n * 3);
  const traceCount = 20;
  const perTrace = Math.floor(n / traceCount);
  for (let t = 0; t < traceCount; t++) {
    const startX = (Math.random() - 0.5) * 24;
    const startY = (Math.random() - 0.5) * 16;
    const startZ = (Math.random() - 0.5) * 6;
    let cx = startX, cy = startY, cz = startZ;
    const segments = 3 + Math.floor(Math.random() * 4);
    const pointsPerSeg = Math.floor(perTrace / segments);

    for (let seg = 0; seg < segments; seg++) {
      const dir = Math.floor(Math.random() * 4); // 0=right 1=left 2=up 3=down
      const len = 2 + Math.random() * 6;
      for (let p = 0; p < pointsPerSeg; p++) {
        const idx = (t * perTrace + seg * pointsPerSeg + p) * 3;
        if (idx >= n * 3) break;
        const prog = p / pointsPerSeg;
        const jitter = (Math.random() - 0.5) * 0.15;
        if (dir === 0)      { pos[idx] = cx + prog * len; pos[idx+1] = cy + jitter; }
        else if (dir === 1) { pos[idx] = cx - prog * len; pos[idx+1] = cy + jitter; }
        else if (dir === 2) { pos[idx] = cx + jitter; pos[idx+1] = cy + prog * len; }
        else                { pos[idx] = cx + jitter; pos[idx+1] = cy - prog * len; }
        pos[idx+2] = cz + (Math.random() - 0.5) * 0.3;
      }
      if (dir === 0) cx += len;
      else if (dir === 1) cx -= len;
      else if (dir === 2) cy += len;
      else cy -= len;
    }
  }
  return pos;
}

function genOrbitRings(n) {
  // 3 concentric rings of orbiting particles
  const pos = new Float32Array(n * 3);
  const rings = [
    { r: 5, tilt: 0.3, particles: Math.floor(n * 0.3) },
    { r: 9, tilt: -0.5, particles: Math.floor(n * 0.35) },
    { r: 13, tilt: 0.2, particles: n - Math.floor(n * 0.65) },
  ];
  let idx = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.particles; i++) {
      const angle = (i / ring.particles) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const r = ring.r + (Math.random() - 0.5) * 1.5;
      const i3 = idx * 3;
      pos[i3]     = Math.cos(angle) * r;
      pos[i3 + 1] = Math.sin(angle) * r * Math.cos(ring.tilt) + (Math.random()-0.5) * 0.5;
      pos[i3 + 2] = Math.sin(angle) * r * Math.sin(ring.tilt) + (Math.random()-0.5) * 0.5;
      idx++;
    }
  }
  return pos;
}

function genTimelineRiver(n) {
  // Horizontal flowing streams — like a river of data
  const pos = new Float32Array(n * 3);
  const streams = 8;
  const perStream = Math.floor(n / streams);
  for (let s = 0; s < streams; s++) {
    const baseY = (s / streams - 0.5) * 20;
    const waveAmp = 1 + Math.random() * 2;
    const waveFreq = 0.3 + Math.random() * 0.4;
    const zOff = (Math.random() - 0.5) * 8;
    for (let i = 0; i < perStream; i++) {
      const idx = (s * perStream + i) * 3;
      if (idx >= n * 3) break;
      const prog = (i / perStream) * 30 - 15;
      pos[idx]     = prog;
      pos[idx + 1] = baseY + Math.sin(prog * waveFreq) * waveAmp + (Math.random()-0.5) * 0.4;
      pos[idx + 2] = zOff + Math.cos(prog * waveFreq * 0.7) * 1.5 + (Math.random()-0.5) * 0.3;
    }
  }
  return pos;
}

function genConvergeStar(n) {
  // All particles spiral inward to a bright core
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    const t = i / n;
    const spiralAngle = t * Math.PI * 12;
    const r = (1 - t * t) * 14; // spiral inward
    pos[i3]     = Math.cos(spiralAngle) * r + (Math.random()-0.5) * 0.3;
    pos[i3 + 1] = Math.sin(spiralAngle) * r + (Math.random()-0.5) * 0.3;
    pos[i3 + 2] = (t - 0.5) * 6 + (Math.random()-0.5) * 0.3;
  }
  return pos;
}

// ── SECTION COLORS ──
const SECTION_COLORS = [
  { c1: '#ff0055', c2: '#4422ff', c3: '#00ffff' },  // Hero: magenta→blue→cyan
  { c1: '#00f0ff', c2: '#39ff14', c3: '#ffbe0b' },  // Projects: cyan→green→amber
  { c1: '#39ff14', c2: '#00f0ff', c3: '#b537f2' },  // Skills: green→cyan→purple
  { c1: '#ffbe0b', c2: '#ff0055', c3: '#4422ff' },  // Experience: amber→magenta→blue
  { c1: '#b537f2', c2: '#00f0ff', c3: '#ffffff' },  // Contact: purple→cyan→white
];

function computeColors(colorSet, n) {
  const cols = new Float32Array(n * 3);
  const c1 = new THREE.Color(colorSet.c1);
  const c2 = new THREE.Color(colorSet.c2);
  const c3 = new THREE.Color(colorSet.c3);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const col = new THREE.Color();
    if (t < 0.5) col.copy(c1).lerp(c2, t * 2);
    else col.copy(c2).lerp(c3, (t - 0.5) * 2);
    cols[i*3] = col.r; cols[i*3+1] = col.g; cols[i*3+2] = col.b;
  }
  return cols;
}

function createCircleTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.8,'rgba(255,255,255,1)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}

// ── MAIN COMPONENT ──
export default function FractalBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020205, 0.01);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 28);
    camera.lookAt(0,0,0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Pre-generate all 5 formations
    const formations = [
      genJellyfish(N),
      genCircuitTraces(N),
      genOrbitRings(N),
      genTimelineRiver(N),
      genConvergeStar(N),
    ];
    const formationColors = SECTION_COLORS.map((cs) => computeColors(cs, N));

    // Current particle state
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);

    // Spawn from outside
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 30;
      positions[i3] = Math.sin(ph)*Math.cos(th)*r;
      positions[i3+1] = Math.sin(ph)*Math.sin(th)*r;
      positions[i3+2] = Math.cos(ph)*r;
    }
    // Init colors from first formation
    colors.set(formationColors[0]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: POINT_SIZE, vertexColors: true, transparent: true, opacity: 0.85,
      map: createCircleTexture(), alphaTest: 0.01,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    const pts = new THREE.Points(geometry, material);
    scene.add(pts);

    // Intro
    const introStart = performance.now();
    const INTRO_DUR = 3500;

    // Mouse
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(999,999);
    const mPlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
    const mWorld = new THREE.Vector3();
    let isDown = false, msx = 0, msy = 0;

    const onResize = () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight); };
    const onMouse = (e) => { msx = (e.clientX/window.innerWidth-0.5)*2; msy = (e.clientY/window.innerHeight-0.5)*2; mouseNDC.set(msx,-msy); };
    const onDown = () => { isDown = true; };
    const onUp = () => { isDown = false; };

    let scrollProg = 0;
    const onScroll = () => {
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      scrollProg = dh > 0 ? window.scrollY / dh : 0;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });

    let rafId;
    function animate() {
      const time = performance.now() * 0.001;
      const now = performance.now();
      const p = geometry.attributes.position.array;
      const c = geometry.attributes.color.array;

      // Intro
      const introElapsed = now - introStart;
      const introActive = introElapsed < INTRO_DUR;

      // Which formation? Map scroll to 0-4
      const sp = scrollProg;
      const sectionF = sp * 4; // 0.0 → 4.0
      const fromIdx = Math.min(4, Math.floor(sectionF));
      const toIdx = Math.min(4, fromIdx + 1);
      const blend = sectionF - fromIdx; // 0→1 within each section transition

      // Get the two formations to blend between
      const fromPos = formations[fromIdx];
      const toPos = formations[toIdx];
      const fromCol = formationColors[fromIdx];
      const toCol = formationColors[toIdx];

      // Mouse in 3D
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(mPlane, mWorld);
      const inv = new THREE.Matrix4().copy(pts.matrixWorld).invert();
      const lm = mWorld.clone().applyMatrix4(inv);

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;

        // Target = lerp between two formations
        const tx = fromPos[i3]   + (toPos[i3]   - fromPos[i3])   * blend;
        const ty = fromPos[i3+1] + (toPos[i3+1] - fromPos[i3+1]) * blend;
        const tz = fromPos[i3+2] + (toPos[i3+2] - fromPos[i3+2]) * blend;

        // Add gentle breathing drift
        const dx = tx + Math.sin(time * 0.25 + ty) * 0.15;
        const dy = ty + Math.cos(time * 0.28 + tz) * 0.15;
        const dz = tz + Math.sin(time * 0.22 + tx) * 0.1;

        if (introActive) {
          // Fly in from outside
          const delay = (i / N) * 0.4;
          const prog = Math.max(0, Math.min(1, (introElapsed / INTRO_DUR - delay) / (1 - delay)));
          const ease = 1 - Math.pow(1 - prog, 2.5);
          p[i3]   += (dx - p[i3])   * ease * 0.06;
          p[i3+1] += (dy - p[i3+1]) * ease * 0.06;
          p[i3+2] += (dz - p[i3+2]) * ease * 0.06;
        } else {
          // Spring toward target
          velocities[i3]   += (dx - p[i3])   * SPRING;
          velocities[i3+1] += (dy - p[i3+1]) * SPRING;
          velocities[i3+2] += (dz - p[i3+2]) * SPRING;

          // Mouse blow / hover push
          const mdx = p[i3] - lm.x, mdy = p[i3+1] - lm.y, mdz = p[i3+2] - lm.z;
          const md = Math.sqrt(mdx*mdx + mdy*mdy + mdz*mdz);
          if (md < BLOW_RADIUS && md > 0.01) {
            const f = (BLOW_RADIUS - md) / BLOW_RADIUS;
            const id = 1.0 / md;
            const pw = isDown ? f * f * BLOW_FORCE : f * 0.08;
            velocities[i3]   += mdx * id * pw;
            velocities[i3+1] += mdy * id * pw;
            velocities[i3+2] += mdz * id * pw;
          }

          velocities[i3]   *= FRICTION;
          velocities[i3+1] *= FRICTION;
          velocities[i3+2] *= FRICTION;
          p[i3]   += velocities[i3];
          p[i3+1] += velocities[i3+1];
          p[i3+2] += velocities[i3+2];
        }

        // Blend colors between sections
        c[i3]   = fromCol[i3]   + (toCol[i3]   - fromCol[i3])   * blend;
        c[i3+1] = fromCol[i3+1] + (toCol[i3+1] - fromCol[i3+1]) * blend;
        c[i3+2] = fromCol[i3+2] + (toCol[i3+2] - fromCol[i3+2]) * blend;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      // Rotation
      pts.rotation.y += 0.0012;
      pts.rotation.x += 0.0002;

      // Camera parallax
      camera.position.x += (msx * 3 - camera.position.x) * 0.02;
      camera.position.y += (8 + msy * 2 - camera.position.y) * 0.02;
      camera.lookAt(0,0,0);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      renderer.dispose(); geometry.dispose(); material.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fractal-bg" />;
}
