// Party poppers and fireworks on a temporary full-screen canvas.
// Loaded only when someone presses a celebrate button.
//
// Poppers: paper is blasted out in a cone, slows quickly in the air, then flutters down. Each
// piece tumbles in 3D (it thins to a line as it turns edge-on, and shows a darker back), and
// drifts sideways as it tumbles. Streamers are ribbons that uncurl along their own path.
// Fireworks: a rocket climbs with a spark trail, bursts with a flash, and each star leaves a
// fading trail, falls under gravity, cools from white-hot to its colour and flickers out.

const PAPER = ['#ffcb3d', '#ef8f6b', '#a8c9a0', '#5aa9d6', '#ffffff', '#f49ac1', '#2f7fbd', '#ffd9a0'];
const SHELLS = [[255, 203, 61], [239, 143, 107], [120, 200, 255], [255, 120, 170], [170, 230, 150], [255, 245, 220]];

interface Paper { x: number; y: number; vx: number; vy: number; w: number; h: number; color: string; tilt: number; spin: number; turn: number; turnRate: number; round: boolean; age: number; life: number; }
interface Ribbon { pts: { x: number; y: number }[]; x: number; y: number; vx: number; vy: number; color: string; phase: number; age: number; life: number; }
interface Rocket { x: number; y: number; vx: number; vy: number; fuse: number; rgb: number[]; kind: number; }
interface Star { x: number; y: number; vx: number; vy: number; px: number; py: number; rgb: number[]; age: number; life: number; size: number; drag: number; crackle: boolean; }

let running: HTMLCanvasElement | null = null;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: T[]) => list[(Math.random() * list.length) | 0];

export function celebrate(origin: { x: number; y: number }) {
  running?.remove();
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

  const papers: Paper[] = [];
  const ribbons: Ribbon[] = [];
  const rockets: Rocket[] = [];
  const stars: Star[] = [];
  let flash = 0;

  // ---- poppers ----
  const popper = (x: number, y: number, aim: number) => {
    for (let i = 0; i < 130; i++) {
      // Most of the charge goes straight along the aim; the cone thins toward its edge.
      const a = aim + (Math.random() + Math.random() - 1) * 0.55;
      const speed = rand(14, 48) * (0.55 + Math.random() * 0.45);
      papers.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, w: rand(6, 12), h: rand(8, 16), color: pick(PAPER), tilt: rand(0, 6.28), spin: rand(-0.25, 0.25), turn: rand(0, 6.28), turnRate: rand(0.12, 0.34), round: Math.random() < 0.18, age: 0, life: rand(170, 280) });
    }
    for (let i = 0; i < 9; i++) {
      const a = aim + rand(-0.4, 0.4);
      const speed = rand(22, 40);
      ribbons.push({ pts: [], x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color: pick(PAPER), phase: rand(0, 6.28), age: 0, life: rand(190, 260) });
    }
  };
  // One popper at the button and its mirror image, both aimed up and toward the middle.
  const left = origin.x < W / 2;
  const up = -Math.PI / 2;
  popper(origin.x, origin.y, up + (left ? 0.5 : -0.5));
  popper(W - origin.x, origin.y, up + (left ? -0.5 : 0.5));

  // ---- fireworks ----
  const launch = (x: number, kind: number) => {
    const target = H * rand(0.14, 0.4);
    const vy = -Math.sqrt(2 * 0.13 * (H - target)) * 1.04;
    rockets.push({ x, y: H + 6, vx: rand(-0.7, 0.7), vy, fuse: Math.abs(vy / 0.13) * 0.94, rgb: pick(SHELLS), kind });
  };
  const burst = (r: Rocket) => {
    flash = 1;
    const n = r.kind === 2 ? 70 : 120;
    for (let i = 0; i < n; i++) {
      // Points spread evenly over a sphere, seen from the side, give a round, full shell.
      const u = Math.random() * 2 - 1, t = Math.random() * 6.283, s = Math.sqrt(1 - u * u);
      let speed = (r.kind === 1 ? rand(2.2, 6.2) : rand(4.6, 7.4)) * (r.kind === 2 ? 0.9 : 1);
      if (r.kind === 0) speed *= 0.86 + Math.random() * 0.28;
      const rgb = Math.random() < 0.12 ? [255, 250, 235] : r.rgb;
      stars.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: s * Math.cos(t) * speed + r.vx * 0.3, vy: u * speed + r.vy * 0.2, rgb, age: 0, life: r.kind === 1 ? rand(95, 150) : rand(60, 95), size: r.kind === 1 ? 1.5 : rand(1.6, 2.4), drag: r.kind === 1 ? 0.972 : 0.957, crackle: r.kind === 2 || Math.random() < 0.15 });
    }
  };
  const order = [0, 1, 0, 2, 0];
  const timers = order.map((kind, i) => setTimeout(() => launch(W * (0.16 + 0.17 * i + rand(-0.04, 0.04)), kind), 250 + i * 380 + rand(0, 160)));

  const started = performance.now();
  let last = started;
  const frame = (now: number) => {
    if (running !== canvas) { timers.forEach(clearTimeout); return; }
    // Step in 60ths of a second so the motion is the same on fast and slow screens.
    const dt = Math.min(2.5, (now - last) / 16.67);
    last = now;
    ctx.clearRect(0, 0, W, H);

    // A brief flash lights the page when a shell opens.
    if (flash > 0.02) { ctx.fillStyle = `rgba(255,250,235,${flash * 0.10})`; ctx.fillRect(0, 0, W, H); flash *= Math.pow(0.82, dt); }

    // Fireworks glow, so they are added to what is behind them.
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const r of rockets) {
      r.fuse -= dt;
      r.vy += 0.13 * dt;
      r.x += (r.vx + Math.sin(r.fuse * 0.5) * 0.25) * dt;
      r.y += r.vy * dt;
      ctx.strokeStyle = 'rgba(255,225,170,0.9)';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * 3, r.y - r.vy * 3); ctx.stroke();
      // Sparks shed behind the rocket.
      if (Math.random() < 0.8) stars.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: rand(-0.5, 0.5), vy: rand(0.4, 1.6), rgb: [255, 200, 120], age: 0, life: rand(12, 26), size: 1, drag: 0.93, crackle: false });
      if (r.fuse <= 0) burst(r);
    }
    for (let i = rockets.length - 1; i >= 0; i--) if (rockets[i].fuse <= 0) rockets.splice(i, 1);

    for (const s of stars) {
      s.age += dt;
      s.px = s.x; s.py = s.y;
      const drag = Math.pow(s.drag, dt);
      s.vx *= drag;
      s.vy = s.vy * drag + 0.055 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = s.age / s.life;
      if (k >= 1) continue;
      // White-hot at first, then the shell colour, then dimming; crackling stars flicker.
      const heat = Math.max(0, 1 - k * 3.2);
      let alpha = k < 0.7 ? 1 : (1 - k) / 0.3;
      if (s.crackle && k > 0.55) alpha *= Math.random() < 0.5 ? 0.15 : 1;
      const c = s.rgb.map((v) => Math.round(v + (255 - v) * heat));
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
      ctx.lineWidth = s.size * (1 - k * 0.5);
      ctx.beginPath(); ctx.moveTo(s.px - s.vx * 2.2, s.py - s.vy * 2.2); ctx.lineTo(s.x, s.y); ctx.stroke();
      if (heat > 0.2) { ctx.fillStyle = `rgba(255,255,255,${heat * alpha})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 0.9, 0, 6.283); ctx.fill(); }
    }
    for (let i = stars.length - 1; i >= 0; i--) if (stars[i].age >= stars[i].life) stars.splice(i, 1);
    ctx.globalCompositeOperation = 'source-over';

    // Streamers: the ribbon is the trail of where its head has been.
    for (const r of ribbons) {
      r.age += dt;
      const drag = Math.pow(0.955, dt);
      r.vx *= drag;
      r.vy = r.vy * drag + 0.16 * dt;
      r.x += r.vx * dt + Math.sin(r.age * 0.16 + r.phase) * 1.3 * dt;
      r.y += r.vy * dt;
      r.pts.push({ x: r.x, y: r.y });
      if (r.pts.length > 26) r.pts.shift();
      const fade = Math.min(1, (r.life - r.age) / 40);
      if (fade <= 0 || r.pts.length < 3) continue;
      ctx.globalAlpha = fade;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      r.pts.forEach((p, i) => {
        // A curl that tightens toward the tail.
        const curl = Math.sin(i * 0.75 + r.phase + r.age * 0.1) * (r.pts.length - i) * 0.32;
        if (i) ctx.lineTo(p.x + curl, p.y); else ctx.moveTo(p.x + curl, p.y);
      });
      ctx.stroke();
    }

    for (const p of papers) {
      p.age += dt;
      // Heavy drag: the blast is fast but paper stops within a second, then drifts.
      const drag = Math.pow(0.935, dt);
      p.vx *= drag;
      p.vy = p.vy * drag + 0.19 * dt;
      p.turn += p.turnRate * dt;
      p.tilt += p.spin * dt;
      // A piece falling flat is pushed sideways by the air as it rocks.
      const face = Math.cos(p.turn);
      p.vx += Math.sin(p.turn) * 0.22 * dt;
      p.vy -= Math.abs(face) * 0.05 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const fade = Math.min(1, (p.life - p.age) / 35);
      if (fade <= 0 || p.y > H + 30) continue;
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      ctx.scale(1, Math.max(0.08, Math.abs(face)));
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.55, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      // The back of the paper is in shade.
      if (face < 0) { ctx.fillStyle = 'rgba(20,30,50,0.28)'; if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.55, 0, 6.283); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    const busy = rockets.length || stars.length || now - started < 2600 || papers.some((p) => p.age < p.life && p.y < H + 30) || ribbons.some((r) => r.age < r.life);
    if (busy && now - started < 12000) requestAnimationFrame(frame);
    else { canvas.remove(); if (running === canvas) running = null; }
  };
  requestAnimationFrame(frame);
}
