import React, { useEffect, useRef } from 'react';

const SparkParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    const maxParticles = 40;

    // Resize canvas
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Particle blueprint
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 80;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedY = -(Math.random() * 1.5 + 0.5);
        this.speedX = Math.random() * 0.8 - 0.4;
        this.alpha = Math.random() * 0.7 + 0.3;
        // Ember gradient colors (fire theme)
        this.hue = Math.random() > 0.4 ? 15 : 40; // orange vs gold/yellow
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.alpha -= 0.003; // Fade out slowly as they rise

        // Reset if drifted off screen or fully faded
        if (this.y < -10 || this.alpha <= 0) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = this.size * 3;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 55%, 0.8)`;
        ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, 1)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Populate initial particles
    for (let i = 0; i < maxParticles; i++) {
      const p = new Particle();
      // Distribute them vertically on startup so they don't all rise from bottom together
      p.y = Math.random() * canvas.height;
      particles.push(p);
    }

    // Animation runner loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-45"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default SparkParticles;
