// Sky and sea colours follow the visitor's local time. Each key time has a palette; the
// colours in between are blended. Add ?hour=18.5 to any URL to preview a time of day.
type RGB = [number, number, number];
interface Palette {
  zenith: RGB; mid: RGB; horizon: RGB; cloud: RGB; shade: RGB; glow: RGB;
  seaFar: RGB; seaMid: RGB; seaNear: RGB; seaLight: RGB; night: number;
}

const night: Palette = { zenith: [0.07, 0.11, 0.26], mid: [0.13, 0.2, 0.4], horizon: [0.27, 0.36, 0.56], cloud: [0.46, 0.54, 0.72], shade: [0.16, 0.22, 0.4], glow: [0.86, 0.91, 1], seaFar: [0.28, 0.38, 0.58], seaMid: [0.11, 0.19, 0.38], seaNear: [0.04, 0.08, 0.21], seaLight: [0.82, 0.89, 1], night: 1 };
const dawn: Palette = { zenith: [0.6, 0.7, 0.92], mid: [0.95, 0.78, 0.8], horizon: [1, 0.9, 0.78], cloud: [1, 0.96, 0.92], shade: [0.88, 0.72, 0.8], glow: [1, 0.84, 0.64], seaFar: [0.98, 0.86, 0.8], seaMid: [0.62, 0.68, 0.86], seaNear: [0.24, 0.38, 0.64], seaLight: [1, 0.96, 0.9], night: 0 };
const day: Palette = { zenith: [0.4, 0.69, 0.95], mid: [0.6, 0.81, 0.97], horizon: [0.88, 0.94, 0.99], cloud: [1, 1, 1], shade: [0.74, 0.83, 0.94], glow: [1, 0.96, 0.82], seaFar: [0.72, 0.87, 0.94], seaMid: [0.36, 0.67, 0.85], seaNear: [0.11, 0.4, 0.67], seaLight: [1, 1, 1], night: 0 };
const dusk: Palette = { zenith: [0.6, 0.6, 0.86], mid: [0.97, 0.7, 0.58], horizon: [1, 0.85, 0.58], cloud: [1, 0.9, 0.76], shade: [0.76, 0.54, 0.66], glow: [1, 0.78, 0.46], seaFar: [1, 0.8, 0.6], seaMid: [0.58, 0.5, 0.7], seaNear: [0.2, 0.25, 0.5], seaLight: [1, 0.93, 0.78], night: 0 };

const KEYS: [number, Palette][] = [[0, night], [4.6, night], [6, dawn], [8.5, day], [16, day], [18.2, dusk], [20.2, night], [24, night]];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function hourNow(): number {
  const forced = Number(new URLSearchParams(location.search).get('hour'));
  if (location.search.includes('hour=') && forced >= 0 && forced <= 24) return forced;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export function currentPalette(): Palette {
  const h = hourNow();
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
  const [h0, a] = KEYS[i];
  const [h1, b] = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (h - h0) / (h1 - h0)));
  const s = t * t * (3 - 2 * t);
  const out = {} as Record<string, RGB | number>;
  for (const k of Object.keys(a) as (keyof Palette)[]) {
    const x = a[k], y = b[k];
    out[k] = typeof x === 'number' ? mix(x, y as number, s) : (x.map((v, j) => mix(v, (y as RGB)[j], s)) as RGB);
  }
  return out as unknown as Palette;
}

// Shared by both canvases; recomputed twice a minute. Also tells the page whether the sky is
// dark, so text placed on it can switch to a light colour.
let cached: Palette | null = null;
let stamp = 0;
export function palette(): Palette {
  const now = performance.now();
  if (!cached || now - stamp > 30_000) {
    cached = currentPalette();
    stamp = now;
    document.documentElement.dataset.tone = cached.night > 0.5 ? 'dark' : 'light';
  }
  return cached;
}
