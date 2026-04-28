import { useEffect, useRef } from 'react';
import './PixelCard.css';

class Pixel {
  constructor(canvas, context, x, y, color, speed, delay) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }
  getRandomValue(min, max) { return Math.random() * (max - min) + min; }
  draw() { const offset = this.maxSizeInteger * 0.5 - this.size * 0.5; this.ctx.fillStyle = this.color; this.ctx.fillRect(this.x + offset, this.y + offset, this.size, this.size); }
  appear() {
    if (this.counter <= this.delay) { this.counter += this.counterStep; return; }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) { this.shimmer(); } else { this.size += this.sizeStep; }
    this.draw();
  }
  disappear() {
    this.isShimmer = false; this.counter = 0;
    if (this.size <= 0) { this.isIdle = true; return; }
    this.size -= 0.1; this.draw();
  }
  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true;
    else if (this.size <= this.minSize) this.isReverse = false;
    this.size += this.isReverse ? -this.speed : this.speed;
  }
}

function getEffectiveSpeed(value, reducedMotion) { const min = 0, max = 100, throttle = 0.001; const parsed = parseInt(value, 10);
  if (parsed <= min || reducedMotion) return min;
  if (parsed >= max) return max * throttle;
  return parsed * throttle; }

const VARIANTS = {
  default: { activeColor: null, gap: 5, speed: 35, colors: '#f8fafc,#f1f5f9,#cbd5e1', noFocus: false },
  blue: { activeColor: '#e0f2fe', gap: 10, speed: 25, colors: '#e0f2fe,#7dd3fc,#0ea5e9', noFocus: false },
  yellow: { activeColor: '#fef08a', gap: 3, speed: 20, colors: '#fef08a,#fde047,#eab308', noFocus: false },
  pink: { activeColor: '#fecdd3', gap: 6, speed: 80, colors: '#fecdd3,#fda4af,#e11d48', noFocus: true }
};

export default function PixelCard({ variant = 'default', gap, speed, colors, noFocus, className = '', children }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pixelsRef = useRef([]);
  const animationRef = useRef(null);
  const timePrevRef = useRef(performance.now());
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current;

  const cfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? cfg.gap;
  const finalSpeed = speed ?? cfg.speed;
  const finalColors = colors ?? cfg.colors;
  const finalNoFocus = noFocus ?? cfg.noFocus;

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = w; canvasRef.current.height = h;
    canvasRef.current.style.width = `${w}px`;
    canvasRef.current.style.height = `${h}px`;
    const colorsArr = finalColors.split(',');
    const pcs = [];
    for (let x = 0; x < w; x += parseInt(finalGap, 10)) {
      for (let y = 0; y < h; y += parseInt(finalGap, 10)) {
        const color = colorsArr[Math.floor(Math.random() * colorsArr.length)];
        const dx = x - w / 2, dy = y - h / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotion ? 0 : distance;
        pcs.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion), delay));
      }
    }
    pixelsRef.current = pcs;
  };

  const animate = fn => {
    animationRef.current = requestAnimationFrame(() => animate(fn));
    const now = performance.now();
    const elapsed = now - timePrevRef.current;
    const interval = 1000 / 60;
    if (elapsed < interval) return;
    timePrevRef.current = now - (elapsed % interval);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    let idleAll = true;
    for (const p of pixelsRef.current) { p[fn](); if (!p.isIdle) idleAll = false; }
    if (idleAll) cancelAnimationFrame(animationRef.current);
  };

  const handleAnim = name => { cancelAnimationFrame(animationRef.current); animationRef.current = requestAnimationFrame(() => animate(name)); };
  const onEnter = () => handleAnim('appear');
  const onLeave = () => handleAnim('disappear');
  const onFocus = e => { if (e.currentTarget.contains(e.relatedTarget)) return; handleAnim('appear'); };
  const onBlur = e => { if (e.currentTarget.contains(e.relatedTarget)) return; handleAnim('disappear'); };

  useEffect(() => { initPixels(); const ro = new ResizeObserver(() => initPixels()); if (containerRef.current) ro.observe(containerRef.current); return () => { ro.disconnect(); cancelAnimationFrame(animationRef.current); }; }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

  return (
    <div ref={containerRef} className={`pixel-card ${className}`} onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={finalNoFocus ? undefined : onFocus} onBlur={finalNoFocus ? undefined : onBlur} tabIndex={finalNoFocus ? -1 : 0}>
      <canvas className="pixel-canvas" ref={canvasRef} />
      {children}
    </div>
  );
}
