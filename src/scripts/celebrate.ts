// Confetti poppers and a few fireworks, drawn on a temporary full-screen canvas.
// Loaded only when someone presses the celebrate button.
const COLORS = ['#ffcb3d', '#ef8f6b', '#a8c9a0', '#5aa9d6', '#ffffff', '#f49ac1', '#2f7fbd'];

interface Bit { x: number; y: number; vx: number; vy: number; size: number; color: string; spin: number; angle: number; life: number; max: number; kind: 'paper' | 'spark' | 'streamer'; }

let running: HTMLCanvasElement | null = null;

export function celebrate(origin: { x: number; y: number }) {
  if (running) running.remove();
  const canvas = document.createElement('canvas');
  running = canvas;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:60;pointer-events:none';
  document.body.append(canvas);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = innerWidth, H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const bits: Bit[] = [];
  const pick = () => COLORS[(Math.random() * COLORS.length) | 0];
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  // Two poppers: one from the button, one mirrored on the other side, both aimed up and inward.
  const popper = (x: number, y: number, dir: number) => {
    for (let i = 0; i < 110; i++) {
      const a = -Math.PI / 2 + dir * rand(0.1, 0.9);
      const speed = rand(9, 24);
      bits.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: rand(6, 12), color: pick(), spin: rand(-0.3, 0.3), angle: rand(0, 6.28), life: 0, max: rand(130, 200), kind: Math.random() < 0.18 ? 'streamer' : 'paper' });
    }
  };
  const left = origin.x < W / 2;
  popper(origin.x, origin.y, left ? 1 : -1);
  popper(W - origin.x, origin.y, left ? -1 : 1);

  // Fireworks burst a little later, higher up.
  const firework = (x: number, y: number) => {
    const color = pick();
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      const speed = rand(3, 8.5);
      bits.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: rand(2, 3.6), color: Math.random() < 0.7 ? color : '#ffffff', spin: 0, angle: 0, life: 0, max: rand(55, 85), kind: 'spark' });
    }
  };
  const timers = [350, 750, 1150, 1600].map((ms, i) => setTimeout(() => firework(W * (0.2 + 0.2 * i + rand(-0.05, 0.05)), H * rand(0.16, 0.42)), ms));

  const started = performance.now();
  const frame = (now: number) => {
    if (running !== canvas) { timers.forEach(clearTimeout); return; }
    ctx.clearRect(0, 0, W, H);
    for (const b of bits) {
      b.life++;
      if (b.kind === 'spark') { b.vx *= 0.955; b.vy = b.vy * 0.955 + 0.06; }
      else { b.vx *= 0.975; b.vy = b.vy * 0.975 + 0.42; b.vx += Math.sin(b.life * 0.1 + b.angle) * 0.12; }
      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.spin;
      const fade = Math.max(0, 1 - b.life / b.max);
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      ctx.fillStyle = b.color;
      if (b.kind === 'spark') {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * (0.5 + fade), 0, 6.283);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        // Flipping paper: the width breathes as it tumbles.
        const w = b.kind === 'streamer' ? b.size * 2.6 : b.size * Math.abs(Math.cos(b.life * 0.14 + b.angle));
        ctx.fillRect(-w / 2, -b.size / 4, w, b.kind === 'streamer' ? b.size / 3 : b.size / 1.6);
        ctx.restore();
      }
    }
    const alive = bits.some((b) => b.life < b.max && b.y < H + 40);
    if (alive || now - started < 1800) requestAnimationFrame(frame);
    else { canvas.remove(); if (running === canvas) running = null; }
  };
  requestAnimationFrame(frame);
}
