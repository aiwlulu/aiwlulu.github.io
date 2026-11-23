// Runs the 4-7-8 breathing guide on /breathe/. Set up again on every `astro:page-load`.
import { at, totalSeconds } from './breath-cycle.js';

type Phase = 'idle' | 'ready' | 'in' | 'hold' | 'out' | 'done';
type State = 'idle' | 'running' | 'paused' | 'done';

const WORD: Record<Phase, string> = { idle: '4 · 7 · 8', ready: '準備', in: '吸氣', hold: '停住', out: '吐氣', done: '完成' };
const HINT: Record<Phase, string> = {
  idle: '按「開始」，跟著圓圈呼吸',
  ready: '坐好，放鬆肩膀，先把氣吐完',
  in: '閉上嘴，用鼻子輕輕吸氣',
  hold: '停住，不用出力',
  out: '用嘴巴慢慢把氣吐完',
  done: '做完了，感覺一下現在的身體',
};
const SAY: Partial<Record<Phase, string>> = { ready: '準備開始', in: '吸氣 4 秒', hold: '停住 7 秒', out: '吐氣 8 秒', done: '練習完成' };
const TONE: Partial<Record<Phase, number>> = { in: 523.25, hold: 659.25, out: 392, done: 523.25 };
// The disc never shrinks to nothing: the phase name and the countdown sit inside it.
const SMALL = 0.54;

const store = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

function setup() {
  const root = document.querySelector<HTMLElement>('[data-breathe]');
  if (!root) return;
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const stage = $('.b-stage'), word = $('[data-word]'), count = $('[data-count]'), hint = $('[data-hint]');
  const say = $('[data-say]'), roundText = $('[data-round]'), dots = $('[data-dots]');
  const toggle = $<HTMLButtonElement>('[data-toggle]'), reset = $<HTMLButtonElement>('[data-reset]');
  const sound = $<HTMLButtonElement>('[data-sound]');
  const roundButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-rounds]')];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state: State = 'idle';
  let phase: Phase = 'idle';
  let rounds = Number(store.get('breathe-rounds')) === 8 ? 8 : 4;
  let elapsed = 0, last = 0, frame = 0, shown = '', round = '';
  let audio: AudioContext | undefined;
  let lock: WakeLockSentinel | undefined;

  const minutes = () => {
    const s = totalSeconds(rounds);
    return `約 ${Math.floor(s / 60)} 分 ${String(s % 60).padStart(2, '0')} 秒`;
  };

  function chime(freq: number) {
    if (sound.getAttribute('aria-checked') !== 'true') return;
    try {
      audio ??= new AudioContext();
      const now = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      osc.connect(gain).connect(audio.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch { /* no audio: the circle and the text still guide */ }
  }

  async function keepAwake(on: boolean) {
    try {
      if (on) lock = await navigator.wakeLock?.request('screen');
      else { await lock?.release(); lock = undefined; }
    } catch { /* not supported or not allowed */ }
  }

  function setState(next: State) {
    state = next;
    root!.dataset.state = next;
    reset.disabled = next === 'idle';
    void keepAwake(next === 'running');
  }

  function drawRounds() {
    for (const b of roundButtons) {
      const on = Number(b.dataset.rounds) === rounds;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    dots.replaceChildren(...Array.from({ length: rounds }, () => document.createElement('i')));
    round = '';
  }

  function draw() {
    const p = state === 'idle' ? { phase: 'idle' as Phase, round: 0, left: 0, progress: 0, fill: 0 } : at(elapsed, rounds);
    stage.style.setProperty('--s', String(still ? 0.86 : SMALL + (1 - SMALL) * p.fill));
    stage.style.setProperty('--p', String(p.progress));
    const text = p.phase === 'idle' || p.phase === 'done' ? '' : String(Math.ceil(p.left));
    if (text !== shown) { shown = text; count.textContent = text; }
    const key = `${p.round}/${p.phase === 'done'}`;
    if (key !== round) {
      round = key;
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i < p.round - (p.phase === 'done' ? 0 : 1)));
      [...dots.children].forEach((d, i) => d.classList.toggle('now', p.phase !== 'done' && i === p.round - 1));
      roundText.textContent = p.round === 0 || p.phase === 'done' ? `共 ${rounds} 輪，${minutes()}` : `第 ${p.round} 輪，共 ${rounds} 輪`;
    }
    if (p.phase !== phase) {
      phase = p.phase as Phase;
      root!.dataset.phase = phase;
      word.textContent = WORD[phase];
      hint.textContent = HINT[phase];
      if (state !== 'idle') {
        say.textContent = SAY[phase] ?? '';
        const tone = TONE[phase];
        if (tone) chime(tone);
      }
      if (phase === 'done') setState('done');
    }
  }

  function tick(now: number) {
    // A long gap means the tab was in the background; do not jump ahead.
    elapsed += Math.min(Math.max(now - last, 0) / 1000, 0.25);
    last = now;
    draw();
    if (state === 'running') frame = requestAnimationFrame(tick);
  }

  function run() {
    setState('running');
    last = performance.now();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  function pause() {
    cancelAnimationFrame(frame);
    setState('paused');
    hint.textContent = '已暫停，準備好再繼續';
    say.textContent = '已暫停';
  }

  function restart() {
    cancelAnimationFrame(frame);
    elapsed = 0;
    round = '';
    setState('idle');
    say.textContent = '';
    draw();
  }

  const onToggle = () => {
    if (state === 'running') return pause();
    if (state === 'done') { elapsed = 0; round = ''; }
    if (state === 'paused') hint.textContent = HINT[phase];
    run();
  };
  const onSound = () => {
    const on = sound.getAttribute('aria-checked') !== 'true';
    sound.setAttribute('aria-checked', String(on));
    store.set('breathe-sound', on ? '1' : '0');
    if (on) chime(523.25);
  };
  const pick = (b: HTMLButtonElement) => {
    rounds = Number(b.dataset.rounds);
    store.set('breathe-rounds', String(rounds));
    drawRounds();
    draw();
  };
  const onRoundKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = roundButtons[(roundButtons.indexOf(e.currentTarget as HTMLButtonElement) + step + roundButtons.length) % roundButtons.length];
    pick(next);
    next.focus();
  };
  const onHide = () => { if (document.hidden && state === 'running') pause(); };

  toggle.addEventListener('click', onToggle);
  reset.addEventListener('click', restart);
  sound.addEventListener('click', onSound);
  for (const b of roundButtons) { b.addEventListener('click', () => pick(b)); b.addEventListener('keydown', onRoundKey); }
  document.addEventListener('visibilitychange', onHide);

  sound.setAttribute('aria-checked', String(store.get('breathe-sound') === '1'));
  drawRounds();
  draw();

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onHide);
    void keepAwake(false);
    void audio?.close();
  }, { once: true });
}

document.addEventListener('astro:page-load', setup);
