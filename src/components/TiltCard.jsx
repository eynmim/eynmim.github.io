import { memo, useEffect, useRef } from 'react';

function TiltCard({ children, color }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
    };
    const onLeave = () => {
      card.style.transition = 'transform .6s cubic-bezier(.23,1,.32,1), box-shadow .4s';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 600);
    };
    const onEnter = () => {
      card.style.transition = 'transform .12s ease, box-shadow .4s';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('mouseenter', onEnter);
    return () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
      card.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <div ref={cardRef} className="glass-card" style={{ '--card-accent': color }}>
      {children}
    </div>
  );
}

export default memo(TiltCard);
