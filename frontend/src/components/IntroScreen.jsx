import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const IntroScreen = ({ onComplete }) => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const lineRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // GSAP text reveal timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Slide out fullscreen overlay
        gsap.to(containerRef.current, {
          yPercent: -100,
          opacity: 0,
          duration: 0.8,
          ease: 'power4.inOut',
          onComplete: () => {
            setVisible(false);
            if (onComplete) onComplete();
          }
        });
      }
    });

    tl.fromTo(titleRef.current, 
      { letterSpacing: '2px', opacity: 0, scale: 0.85 },
      { letterSpacing: '8px', opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }
    )
    .fromTo(lineRef.current,
      { width: '0%', opacity: 0 },
      { width: '120px', opacity: 1, duration: 0.6, ease: 'power2.inOut' },
      '-=0.4'
    )
    .to(titleRef.current, {
      opacity: 0,
      scale: 1.05,
      duration: 0.5,
      delay: 1.0, // Hold logo for 1 second
      ease: 'power3.in'
    })
    .to(lineRef.current, {
      width: '0%',
      opacity: 0,
      duration: 0.4,
      ease: 'power3.in'
    }, '-=0.5');

  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Background abstract neon laser video loop */}
      <video
        src="https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-45 pointer-events-none"
      />

      {/* Radial vignette mask overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,_transparent_40%,_#000000_90%)] opacity-85 pointer-events-none" />

      {/* Website logo intro content */}
      <div className="relative z-20 flex flex-col items-center text-center">
        <h1
          ref={titleRef}
          className="bg-gradient-neon bg-clip-text text-4xl font-extrabold tracking-[8px] text-transparent md:text-6xl font-gaming uppercase select-none drop-shadow-[0_0_15px_rgba(53,213,250,0.6)]"
        >
          FF <span className="text-white">ARENA</span>
        </h1>
        
        {/* Underline glow */}
        <div
          ref={lineRef}
          className="mt-3.5 h-1 rounded-full bg-gaming-accent shadow-[0_0_12px_#35D5FA]"
        />
      </div>
    </div>
  );
};

export default IntroScreen;
