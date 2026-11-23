// Timing of the 4-7-8 breathing exercise. Pure functions, shared by the page and its tests.

export const PHASES = [
  { id: 'in', seconds: 4 },
  { id: 'hold', seconds: 7 },
  { id: 'out', seconds: 8 },
];
// Seconds of "get ready" before the first breath.
export const LEAD = 3;
export const CYCLE = PHASES.reduce((n, p) => n + p.seconds, 0);

const ease = (x) => (1 - Math.cos(Math.PI * x)) / 2;

/**
 * Where the exercise is after `t` seconds of running time.
 * `fill` is how full the lungs are, 0 to 1; `left` is the seconds left in the phase.
 */
export function at(t, rounds) {
  if (t < LEAD) return { phase: 'ready', round: 0, left: LEAD - t, progress: t / LEAD, fill: 0 };
  let rest = t - LEAD;
  if (rest >= rounds * CYCLE) return { phase: 'done', round: rounds, left: 0, progress: 1, fill: 0 };
  const round = Math.floor(rest / CYCLE) + 1;
  rest %= CYCLE;
  for (const p of PHASES) {
    if (rest < p.seconds) {
      const progress = rest / p.seconds;
      const fill = p.id === 'in' ? ease(progress) : p.id === 'hold' ? 1 : 1 - ease(progress);
      return { phase: p.id, round, left: p.seconds - rest, progress, fill };
    }
    rest -= p.seconds;
  }
  // Unreachable: rest is always below CYCLE here.
  return { phase: 'done', round: rounds, left: 0, progress: 1, fill: 0 };
}

export const totalSeconds = (rounds) => LEAD + rounds * CYCLE;
