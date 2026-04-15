import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let rx = 0, ry = 0, mx = 0, my = 0;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      // Use transform instead of left/top for GPU acceleration
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    };

    let rafId;
    function lerpRing() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      rafId = requestAnimationFrame(lerpRing);
    }

    document.addEventListener('mousemove', onMove);
    rafId = requestAnimationFrame(lerpRing);

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} id="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} id="cursor-ring" aria-hidden="true" />
    </>
  );
}
