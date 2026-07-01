import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EmotionType, EmotionPalette, Bands } from '../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  decay: number;
  hueOff: number;
}

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  mode: string;
  emotion: EmotionType;
  customJsCode: string;
  isCustomCodeActive: boolean;
  onEmotionChange: (emotion: EmotionType) => void;
}

export interface VisualizerHandle {
  setBeatFlash: () => void;
  getAnalyseData: () => Bands;
}

const EMOTION_PALETTES: Record<EmotionType, EmotionPalette> = {
  serene: { h: 174, s: 100, l: 45, rgb: [0, 229, 204] },
  energized: { h: 43, s: 90, l: 55, rgb: [240, 180, 41] },
  tender: { h: 340, s: 100, l: 65, rgb: [255, 107, 157] },
  focused: { h: 258, s: 85, l: 68, rgb: [167, 139, 250] },
};

export const VisualizerCanvas = forwardRef<VisualizerHandle, VisualizerCanvasProps>(
  ({ analyser, mode, emotion, customJsCode, isCustomCodeActive }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Particle system state
    const particlesRef = useRef<Particle[]>([]);
    const maxParticles = 120;

    // Beat analysis variables
    const lastEnergyRef = useRef<number>(0);
    const beatCooldownRef = useRef<number>(0);
    const beatFlashRef = useRef<number>(0);

    // Dynamic HSL interpolation
    const currentHueRef = useRef<number>(EMOTION_PALETTES[emotion].h);

    // Cached custom code function
    const compiledCodeRef = useRef<Function | null>(null);
    const lastCompiledCodeRef = useRef<string>('');

    // Matrix Rain State
    const matrixState = useRef<{ drops: number[]; colW: number } | null>(null);

    // Track active emotion to update colors
    useEffect(() => {
      const palette = EMOTION_PALETTES[emotion];
      if (palette) {
        // Automatically set theme colors in CSS variables
        const color = `hsl(${palette.h}, ${palette.s}%, ${palette.l}%)`;
        const glow = `rgba(${palette.rgb[0]},${palette.rgb[1]},${palette.rgb[2]},0.4)`;
        const dim = `rgba(${palette.rgb[0]},${palette.rgb[1]},${palette.rgb[2]},0.13)`;

        document.documentElement.style.setProperty('--emotion-color', color);
        document.documentElement.style.setProperty('--emotion-glow', glow);
        document.documentElement.style.setProperty('--emotion-dim', dim);
      }
    }, [emotion]);

    // Handle component mount and resizing
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      // Setup initial particles
      particlesRef.current = [];
      for (let i = 0; i < maxParticles; i++) {
        particlesRef.current.push(createParticle(true));
      }

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    // Create single particles
    const createParticle = (isRandom: boolean): Particle => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const angle = Math.random() * Math.PI * 2;
      const radius = isRandom ? Math.random() * Math.max(w, h) * 0.65 : 0;
      return {
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        size: Math.random() * 2.4 + 0.5,
        opacity: Math.random() * 0.55 + 0.15,
        life: Math.random(),
        decay: Math.random() * 0.0035 + 0.001,
        hueOff: (Math.random() - 0.5) * 45,
      };
    };

    // Public controller endpoints
    useImperativeHandle(ref, () => ({
      setBeatFlash: () => {
        beatFlashRef.current = 0.65;
        beatCooldownRef.current = 15;
      },
      getAnalyseData: () => {
        return getBands();
      },
    }));

    // Analyze byte frequencies
    const getBands = (): Bands => {
      if (!analyser) {
        return { low: 0.2, mid: 0.2, high: 0.2, energy: 0.2 };
      }
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      let low = 0;
      let mid = 0;
      let high = 0;
      const n = dataArray.length;

      for (let i = 0; i < n; i++) {
        const val = dataArray[i] / 255;
        if (i < n * 0.15) low += val;
        else if (i < n * 0.5) mid += val;
        else high += val;
      }

      const nL = Math.max(1, Math.round(n * 0.15));
      const nM = Math.max(1, Math.round(n * 0.35));
      const nH = Math.max(1, n - nL - nM);

      low /= nL;
      mid /= nM;
      high /= nH;

      return {
        low,
        mid,
        high,
        energy: (low * 0.5 + mid * 0.3 + high * 0.2),
      };
    };

    // Core Drawing loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawLoop = () => {
        const W = canvas.width;
        const H = canvas.height;
        const time = performance.now() * 0.001;

        // Collect current audio signals
        const bands = getBands();
        const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 128);
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
        } else {
          // generate slight static wave if paused
          for (let i = 0; i < dataArray.length; i++) {
            dataArray[i] = 20 + Math.sin(time * 3 + i * 0.1) * 12;
          }
        }

        // Beat detection logic
        beatCooldownRef.current = Math.max(0, beatCooldownRef.current - 1);
        beatFlashRef.current = Math.max(0, beatFlashRef.current - 0.045);
        
        const delta = bands.energy - lastEnergyRef.current;
        if (delta > 0.13 && beatCooldownRef.current === 0) {
          beatCooldownRef.current = 16;
          beatFlashRef.current = 0.6;
        }
        lastEnergyRef.current = bands.energy * 0.8 + lastEnergyRef.current * 0.2;

        // Smooth color morphing to destination emotion Hues
        const targetHue = EMOTION_PALETTES[emotion].h;
        currentHueRef.current += (targetHue - currentHueRef.current) * 0.024;

        if (isCustomCodeActive && customJsCode) {
          renderCustomCode(ctx, W, H, time, bands, dataArray);
        } else {
          renderScene(ctx, W, H, time, bands, dataArray);
        }

        animationFrameRef.current = requestAnimationFrame(drawLoop);
      };

      animationFrameRef.current = requestAnimationFrame(drawLoop);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [analyser, mode, emotion, isCustomCodeActive, customJsCode]);

    // Renders custom evaluated user Javascript code
    const renderCustomCode = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      time: number,
      bands: Bands,
      dataArray: Uint8Array
    ) => {
      // Clear frame
      ctx.fillStyle = 'rgba(5, 5, 8, 0.1)';
      ctx.fillRect(0, 0, W, H);

      try {
        // Compile only if code changed
        if (compiledCodeRef.current === null || lastCompiledCodeRef.current !== customJsCode) {
          compiledCodeRef.current = new Function(
            'ctx', 'W', 'H', 'time', 'low', 'mid', 'high', 'energy', 'data', 'hue', 'flash',
            customJsCode
          );
          lastCompiledCodeRef.current = customJsCode;
        }

        // Expose variables for users to manipulate!
        const hue = currentHueRef.current;
        const low = bands.low;
        const mid = bands.mid;
        const high = bands.high;
        const energy = bands.energy;
        const flash = beatFlashRef.current;

        // Execute cached custom code
        compiledCodeRef.current(ctx, W, H, time, low, mid, high, energy, dataArray, hue, flash);
      } catch (err: any) {
        // Red error line indicators
        ctx.fillStyle = '#ff3b30';
        ctx.font = '12px monospace';
        ctx.fillText(`Evaluation Error: ${err.message}`, 20, 40);
      }
    };

    // Renders active predefined creative scenes
    const renderScene = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      time: number,
      bands: Bands,
      dataArray: Uint8Array
    ) => {
      const hue = currentHueRef.current;
      const { low, mid, high, energy } = bands;

      switch (mode) {
        case 'aurora': {
          ctx.fillStyle = `rgba(5, 5, 8, ${0.05 + energy * 0.02})`;
          ctx.fillRect(0, 0, W, H);

          const layers = 5;
          for (let l = 0; l < layers; l++) {
            const lFrac = l / (layers - 1);
            const lHue = (hue + l * 15 + time * 10) % 360;
            const yBase = H * (0.2 + lFrac * 0.38) + Math.sin(time * 0.5 + l) * H * 0.05;
            const amp = H * (0.13 + low * 0.25 + l * 0.02);

            ctx.beginPath();
            ctx.moveTo(0, H);

            for (let x = 0; x <= W; x += 6) {
              const nx = x / W;
              const idx = Math.floor(nx * dataArray.length * 0.7);
              const dv = dataArray[idx] / 255;
              const wave =
                Math.sin(nx * 4.5 + time * 0.8 + l * 0.85) * amp +
                Math.sin(nx * 8 + time * 1.3 + l * 0.4) * amp * 0.35 +
                dv * amp * 0.45;
              ctx.lineTo(x, yBase + wave);
            }

            ctx.lineTo(W, H);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp * 1.8);
            const alpha = 0.045 + energy * 0.075 + lFrac * 0.02;
            grad.addColorStop(0, `hsla(${lHue}, 90%, 65%, ${alpha * 2})`);
            grad.addColorStop(0.45, `hsla(${(lHue + 35) % 360}, 80%, 50%, ${alpha})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fill();
          }

          drawParticles(ctx, W, H, energy, hue);
          break;
        }

        case 'nebula': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.06)';
          ctx.fillRect(0, 0, W, H);

          // Render three layered interstellar dust pockets
          const clouds = [
            { x: W * 0.35, y: H * 0.4, r: W * 0.4, hOff: 0 },
            { x: W * 0.65, y: H * 0.6, r: W * 0.35, hOff: 40 },
            { x: W * 0.5, y: H * 0.5, r: W * 0.45, hOff: 80 },
          ];

          clouds.forEach((c, idx) => {
            const cHue = (hue + c.hOff + time * 4) % 360;
            const cr = c.r * (0.8 + energy * 0.28 + low * 0.1);
            const cx = c.x + Math.sin(time * 0.18 + idx) * W * 0.04;
            const cy = c.y + Math.cos(time * 0.14 + idx * 1.2) * H * 0.04;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
            const alpha = (energy * 0.35 + 0.06) / 3;
            grad.addColorStop(0, `hsla(${cHue}, 80%, 60%, ${alpha * 3})`);
            grad.addColorStop(0.4, `hsla(${(cHue + 25) % 360}, 75%, 45%, ${alpha * 1.5})`);
            grad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
          });

          drawParticles(ctx, W, H, energy * 0.4, hue);
          break;
        }

        case 'liquid': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.08)';
          ctx.fillRect(0, 0, W, H);

          const waves = 4;
          for (let wIdx = 0; wIdx < waves; wIdx++) {
            const ratio = wIdx / (waves - 1);
            const wHue = (hue + wIdx * 25) % 360;
            const cy = H * (0.35 + ratio * 0.4);
            const amp = H * (0.07 + energy * 0.14 + wIdx * 0.015);
            const speed = 0.45 + wIdx * 0.12;

            ctx.beginPath();
            ctx.moveTo(0, H);

            for (let x = 0; x <= W; x += 4) {
              const nx = x / W;
              const val = dataArray[Math.floor(nx * dataArray.length)] / 255;
              const y =
                cy +
                Math.sin(nx * 4.8 + time * speed) * amp +
                Math.cos(nx * 8.5 + time * speed * 1.3) * amp * 0.3 +
                val * amp * 0.55;
              ctx.lineTo(x, y);
            }

            ctx.lineTo(W, H);
            ctx.closePath();

            const grd = ctx.createLinearGradient(0, cy - amp, 0, cy + amp * 2);
            const alpha = 0.035 + energy * 0.05;
            grd.addColorStop(0, `hsla(${wHue}, 100%, 72%, ${alpha * 2.5})`);
            grd.addColorStop(0.5, `hsla(${(wHue + 30) % 360}, 85%, 52%, ${alpha})`);
            grd.addColorStop(1, 'transparent');

            ctx.fillStyle = grd;
            ctx.fill();
          }

          drawParticles(ctx, W, H, energy * 0.4, hue);
          break;
        }

        case 'flow': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
          ctx.fillRect(0, 0, W, H);

          const lines = 35;
          for (let i = 0; i < lines; i++) {
            const seed = i * 183.4;
            const startX = (((seed * 5.7 + time * 12) % W) + W) % W;
            const startY = ((seed * 3.9) % H + H) % H;
            const lHue = (hue + i * 5 + time * 6) % 360;
            const dv = dataArray[i % dataArray.length] / 255;
            const alpha = 0.08 + dv * 0.25 + energy * 0.08;

            ctx.beginPath();
            ctx.moveTo(startX, startY);

            let x = startX;
            let y = startY;
            for (let step = 0; step < 26; step++) {
              const nx = x / W;
              const ny = y / H;
              const angle =
                Math.sin(nx * 3.5 + time * 0.4) * Math.PI +
                Math.cos(ny * 2.8 + time * 0.3) * Math.PI +
                (dataArray[Math.floor(nx * dataArray.length)] / 255) * Math.PI * 0.45;

              const velocity = 3.5 + energy * 6.5;
              x += Math.cos(angle) * velocity;
              y += Math.sin(angle) * velocity;

              if (x < 0 || x > W || y < 0 || y > H) break;
              ctx.lineTo(x, y);
            }

            ctx.strokeStyle = `hsla(${lHue}, 80%, 65%, ${alpha})`;
            ctx.lineWidth = 0.7 + dv * 1.5;
            ctx.stroke();
          }
          break;
        }

        case 'bloom': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.09)';
          ctx.fillRect(0, 0, W, H);

          const cx = W / 2;
          const cy = H / 2;
          const petals = 8;
          const radius = Math.min(W, H) * (0.16 + mid * 0.28);
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(time * 0.12);

          for (let pIdx = 0; pIdx < petals; pIdx++) {
            const angle = (pIdx / petals) * Math.PI * 2;
            const rOffset = radius * (1.0 + Math.sin(time * 1.5 + pIdx * 0.8) * 0.12 + mid * 0.1);
            
            const px = Math.cos(angle) * rOffset;
            const py = Math.sin(angle) * rOffset;

            const petHue = (hue + pIdx * 15 + time * 12) % 360;
            const grad = ctx.createRadialGradient(0, 0, 10, px, py, rOffset);
            grad.addColorStop(0, `hsla(${petHue}, 90%, 65%, 0.35)`);
            grad.addColorStop(0.5, `hsla(${(petHue + 30) % 360}, 75%, 52%, 0.1)`);
            grad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(px * 0.5 - py * 0.3, py * 0.5 + px * 0.3, px * 0.8, py * 0.8, px, py);
            ctx.bezierCurveTo(px * 0.8, py * 0.8, px * 0.5 + py * 0.3, py * 0.5 - px * 0.3, 0, 0);
            ctx.fillStyle = grad;
            ctx.fill();
            
            // outline stroke
            ctx.strokeStyle = `hsla(${petHue}, 80%, 75%, ${0.1 + energy * 0.25})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.restore();

          drawParticles(ctx, W, H, energy * 0.35, hue);
          break;
        }

        case 'spectrum': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.15)';
          ctx.fillRect(0, 0, W, H);

          // Giant glowing backdrop
          const bgGrd = ctx.createRadialGradient(W / 2, H, 0, W / 2, H * 0.4, H * 0.85);
          bgGrd.addColorStop(0, `hsla(${hue}, 70%, 15%, 0.4)`);
          bgGrd.addColorStop(1, 'transparent');
          ctx.fillStyle = bgGrd;
          ctx.fillRect(0, 0, W, H);

          const barCount = Math.min(64, Math.floor(W / 12));
          const colW = W / barCount;
          const barW = colW * 0.65;
          const gap = colW * 0.35;
          const step = Math.floor(dataArray.length / barCount);

          for (let i = 0; i < barCount; i++) {
            let val = 0;
            for (let j = 0; j < step; j++) {
              val += dataArray[i * step + j] / 255;
            }
            val /= step;

            const barH = val * H * 0.6 + 6;
            const x = i * colW + gap / 2;
            const barHue = (hue + (i / barCount) * 80) % 360;
            const alpha = 0.55 + val * 0.45;

            // Neon glowing columns
            const grad = ctx.createLinearGradient(0, H, 0, H - barH);
            grad.addColorStop(0, `hsla(${barHue}, 92%, 55%, ${alpha})`);
            grad.addColorStop(1, `hsla(${(barHue + 40) % 360}, 92%, 75%, ${alpha * 0.4})`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, H - barH, barW, barH, 4);
            } else {
              ctx.rect(x, H - barH, barW, barH);
            }
            ctx.fill();

            // Symmetrical drop refraction reflection on water level
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, H, barW, barH * 0.28, 4);
            } else {
              ctx.rect(x, H, barW, barH * 0.28);
            }
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
          break;
        }

        case 'pulse': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.12)';
          ctx.fillRect(0, 0, W, H);

          const cx = W / 2;
          const cy = H / 2;
          const maxR = Math.min(W, H) * 0.38;

          // Beat flashes expanding radial ripples
          if (beatFlashRef.current > 0) {
            const radGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * (1.1 + beatFlashRef.current));
            radGrd.addColorStop(0, `hsla(${hue}, 92%, 70%, ${beatFlashRef.current * 0.25})`);
            radGrd.addColorStop(1, 'transparent');
            ctx.fillStyle = radGrd;
            ctx.fillRect(0, 0, W, H);
          }

          const rays = 72;
          for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2 - Math.PI / 2;
            const dv = dataArray[Math.floor((i * dataArray.length) / rays)] / 255;
            const r0 = maxR * 0.35 + low * maxR * 0.05;
            const r1 = r0 + dv * maxR * 0.72;
            const rayHue = (hue + i * 2.5 + time * 12) % 360;
            const alpha = 0.5 + dv * 0.5;

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
            ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
            ctx.strokeStyle = `hsla(${rayHue}, 90%, 65%, ${alpha})`;
            ctx.lineWidth = 2 + dv * 1.5;
            ctx.stroke();
          }

          // Central core sphere
          const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.32);
          coreGrd.addColorStop(0, `hsla(${hue}, 90%, 70%, ${0.2 + energy * 0.4})`);
          coreGrd.addColorStop(1, 'transparent');
          ctx.fillStyle = coreGrd;
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * 0.32, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'vortex': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.07)';
          ctx.fillRect(0, 0, W, H);

          const cx = W / 2;
          const cy = H / 2;
          const arms = 3;

          for (let a = 0; a < arms; a++) {
            const armHue = (hue + a * 120 + time * 6) % 360;
            ctx.beginPath();
            const points = 180;

            for (let p = 0; p < points; p++) {
              const frac = p / points;
              const r = frac * Math.min(W, H) * 0.45;
              const idx = Math.floor(frac * dataArray.length * 0.6);
              const dv = dataArray[idx] / 255;
              
              const angle =
                frac * Math.PI * 6.5 +
                (a * Math.PI * 2) / arms +
                time * (0.45 + energy * 0.75) +
                dv * 0.4;
              
              const wobble = 1.0 + Math.sin(frac * 15 + time * 2) * 0.12 + dv * 0.22;
              const x = cx + Math.cos(angle) * r * wobble;
              const y = cy + Math.sin(angle) * r * wobble;

              if (p === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }

            const alpha = 0.22 + energy * 0.38;
            ctx.strokeStyle = `hsla(${armHue}, 90%, 65%, ${alpha})`;
            ctx.lineWidth = 1.6 + energy * 2.4;
            ctx.stroke();
          }
          break;
        }

        case 'flame': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.12)';
          ctx.fillRect(0, 0, W, H);

          const layers = 4;
          const scaleX = W / 100;
          
          for (let l = 0; l < layers; l++) {
            const lHue = (hue - 24 + l * 18 + time * 12) % 360;
            const alpha = 0.045 + energy * 0.08 - l * 0.005;
            
            ctx.beginPath();
            ctx.moveTo(0, H);

            for (let x = 0; x <= 100; x += 3) {
              const nx = x / 100;
              const sampleIdx = Math.floor(nx * dataArray.length * 0.45);
              const val = dataArray[sampleIdx] / 255;
              
              const yBase = H * (0.85 - l * 0.1) - Math.abs(Math.sin(nx * Math.PI)) * H * 0.12;
              const heightOffset = val * H * (0.28 + l * 0.04);
              const noiseY = Math.sin(nx * 14 + time * (2 + l) + l) * H * 0.035;

              ctx.lineTo(x * scaleX, yBase - heightOffset + noiseY);
            }

            ctx.lineTo(W, H);
            ctx.closePath();

            const grad = ctx.createLinearGradient(W / 2, H, W / 2, H * 0.1);
            grad.addColorStop(0, `hsla(${lHue}, 90%, 60%, ${alpha * 2.4})`);
            grad.addColorStop(0.35, `hsla(${(lHue + 25) % 360}, 90%, 48%, ${alpha * 1.5})`);
            grad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad;
            ctx.fill();
          }

          drawParticles(ctx, W, H, energy * 0.7, hue);
          break;
        }

        case 'cosmic': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.08)';
          ctx.fillRect(0, 0, W, H);

          const starCount = 80;
          for (let i = 0; i < starCount; i++) {
            const seed = i * 142.115;
            const sx = (((seed * 13.5 + time * 0.35) % W) + W) % W;
            const sy = (((seed * 7.7 + time * 0.15) % H) + H) % H;
            const sr = 0.8 + (i % 6) * 0.35 + (dataArray[i % dataArray.length] / 255) * 2.2;
            const sa = 0.35 + (dataArray[i % dataArray.length] / 255) * 0.65;
            const sHue = (hue - 30 + i * 4) % 360;

            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${sHue}, 80%, 82%, ${sa})`;
            ctx.fill();
          }

          // Cosmic portal swirl
          const cx = W / 2;
          const cy = H / 2;
          const zoomR = Math.min(W, H) * (0.26 + mid * 0.08);

          const portalGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, zoomR);
          portalGrd.addColorStop(0, `hsla(${hue}, 85%, 60%, ${0.12 + energy * 0.28})`);
          portalGrd.addColorStop(1, 'transparent');
          ctx.fillStyle = portalGrd;
          ctx.beginPath();
          ctx.arc(cx, cy, zoomR, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'neural': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.09)';
          ctx.fillRect(0, 0, W, H);

          const nodeCount = 20;
          const nodes: any[] = [];
          for (let i = 0; i < nodeCount; i++) {
            const seed = i * 131.551;
            const angle = (seed * 2.6 + time * 0.095) % (Math.PI * 2);
            const distLimit = Math.min(W, H) * (0.16 + (i % 4) * 0.11 + Math.sin(seed) * 0.08);
            const val = dataArray[i % dataArray.length] / 255;
            nodes.push({
              x: W / 2 + Math.cos(angle) * distLimit,
              y: H / 2 + Math.sin(angle) * distLimit,
              r: 3 + val * 6,
              nHue: (hue + i * 15) % 360,
              alpha: 0.45 + val * 0.55,
            });
          }

          // Compute neural synapsis connections
          for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
              const dx = nodes[j].x - nodes[i].x;
              const dy = nodes[j].y - nodes[i].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const limit = Math.min(W, H) * 0.28;

              if (dist < limit) {
                const alphaStr = (1 - dist / limit) * 0.14 * (1.0 + energy);
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `hsla(${nodes[i].nHue}, 75%, 62%, ${alphaStr})`;
                ctx.lineWidth = 0.55;
                ctx.stroke();
              }
            }
          }

          // Node circles
          nodes.forEach(nd => {
            const nodGrd = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, nd.r * 2.8);
            nodGrd.addColorStop(0, `hsla(${nd.nHue}, 92%, 68%, ${nd.alpha})`);
            nodGrd.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(nd.x, nd.y, nd.r * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = nodGrd;
            ctx.fill();
          });
          break;
        }

        case 'crystal': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.12)';
          ctx.fillRect(0, 0, W, H);

          const cx = W / 2;
          const cy = H / 2;
          const rings = 6;

          for (let ring = 0; ring < rings; ring++) {
            const sides = 6;
            const r = Math.min(W, H) * 0.052 * (ring + 1) * (1.0 + low * 0.38);
            const rHue = (hue + ring * 22 + time * 5) % 360;
            const rotation = time * 0.12 * (ring % 2 === 0 ? 1 : -1) + ring * 0.12;
            const alpha = Math.max(0.01, 0.16 + energy * 0.12 - ring * 0.024);

            ctx.beginPath();
            for (let s = 0; s <= sides; s++) {
              const angle = (s / sides) * Math.PI * 2 + rotation;
              const px = cx + Math.cos(angle) * r;
              const py = cy + Math.sin(angle) * r;
              if (s === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();

            ctx.strokeStyle = `hsla(${rHue}, 85%, 65%, ${alpha})`;
            ctx.lineWidth = 1.0 + ring * 0.35;
            ctx.stroke();

            if (ring === 0) {
              const fillGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
              fillGrd.addColorStop(0, `hsla(${rHue}, 90%, 70%, ${energy * 0.35})`);
              fillGrd.addColorStop(1, 'transparent');
              ctx.fillStyle = fillGrd;
              ctx.fill();
            }
          }

          drawParticles(ctx, W, H, energy * 0.45, hue);
          break;
        }

        case 'matrix': {
          ctx.fillStyle = 'rgba(5, 5, 8, 0.075)';
          ctx.fillRect(0, 0, W, H);

          // Build matrix columns on the fly
          const colW = 18;
          const colsCount = Math.floor(W / colW);
          if (!matrixState.current || matrixState.current.drops.length !== colsCount) {
            const drops: number[] = [];
            for (let dIdx = 0; dIdx < colsCount; dIdx++) {
              drops[dIdx] = Math.random() * H;
            }
            matrixState.current = { drops, colW };
          }

          const { drops } = matrixState.current;
          ctx.font = '13px monospace';

          for (let colIdx = 0; colIdx < drops.length; colIdx++) {
            const dv = dataArray[colIdx % dataArray.length] / 255;
            const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
            const colHue = (hue + dv * 60) % 360;

            // Radiant neon key head
            ctx.fillStyle = `hsla(${colHue}, 85%, 85%, ${0.7 + dv * 0.3})`;
            ctx.fillText(char, colIdx * colW, drops[colIdx]);

            // Ghostly matrix trails
            const tailChar = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
            ctx.fillStyle = `hsla(${colHue}, 75%, 52%, ${0.22 + dv * 0.42})`;
            ctx.fillText(tailChar, colIdx * colW, drops[colIdx] - colW);

            // Flow rates linked to speed of beats
            const speed = 1.2 + dv * 2.8 + energy * 2.2;
            drops[colIdx] += speed;

            if (drops[colIdx] > H && Math.random() > 0.985) {
              drops[colIdx] = 0;
            }
          }
          break;
        }

        default: {
          // Standard placeholder
          ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
          ctx.fillRect(0, 0, W, H);
          drawParticles(ctx, W, H, energy, hue);
        }
      }
    };

    // Particles loop
    const drawParticles = (ctx: CanvasRenderingContext2D, W: number, H: number, energy: number, hue: number) => {
      const ps = particlesRef.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.life -= p.decay;

        if (p.life <= 0) {
          ps[i] = createParticle(false);
          continue;
        }

        const force = 1.0 + energy * 2.6;
        p.x += p.vx * force;
        p.y += p.vy * force;

        const pHue = (hue + p.hueOff + performance.now() * 0.02) % 360;
        const opacityVal = p.opacity * p.life;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pHue}, 80%, 70%, ${opacityVal})`;
        ctx.fill();
      }
    };

    return (
      <div className="absolute inset-0 overflow-hidden bg-[#050508] transition-all duration-1000">
        <canvas id="visualizer" ref={canvasRef} className="absolute inset-0 block w-full h-full mix-blend-screen scale-[1.01]" />
        {/* Layered cinema vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,transparent_0%,rgba(5,5,8,0.55)_100%)] bg-gradient-to-b from-[rgba(5,5,8,0.4)] via-transparent to-[rgba(5,5,8,0.85)] z-2" />
      </div>
    );
  }
);
VisualizerCanvas.displayName = 'VisualizerCanvas';
