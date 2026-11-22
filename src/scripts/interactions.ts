// Small page behaviours. The site uses client-side navigation, so anything tied to page
// content is set up again on every `astro:page-load` (which also fires on first load).

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- once per visit ------------------------------------------------------------------

// Loading bar while the next page is fetched, so a click never feels dead.
document.addEventListener('astro:before-preparation', () => {
  document.querySelector('.loadbar')?.classList.remove('is-done');
  document.documentElement.classList.add('is-loading');
});
// Navigation replaces the attributes on <html>, so the sky choice and tone are carried over.
let carried: { skyMode?: string; skyHue?: string; theme?: string } = {};
document.addEventListener('astro:before-swap', () => {
  const d = document.documentElement.dataset;
  carried = { skyMode: d.skyMode, skyHue: d.skyHue, theme: d.theme };
});
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.remove('is-loading');
  document.documentElement.classList.add('js');
  if (carried.skyMode) document.documentElement.dataset.skyMode = carried.skyMode;
  if (carried.skyHue) document.documentElement.dataset.skyHue = carried.skyHue;
  if (carried.theme) document.documentElement.dataset.theme = carried.theme;
  document.querySelector('.loadbar')?.classList.add('is-done');
});

// Pointer position drives the sky parallax and the cursor companion.
if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let x = 0, y = 0, cx = 0, cy = 0, moved = false, raf = 0;
  const tick = () => {
    const dot = document.querySelector<HTMLElement>('.cursor');
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    if (dot) dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    const dot = document.querySelector<HTMLElement>('.cursor');
    if (!moved) { moved = true; cx = x; cy = y; }
    dot?.classList.add('is-on');
    dot?.classList.toggle('is-hover', !!(e.target as Element).closest?.('a, button, summary, .card, [role="button"]'));
    const root = document.documentElement.style;
    root.setProperty('--mx', (x / innerWidth - 0.5).toFixed(3));
    root.setProperty('--my', (y / innerHeight - 0.5).toFixed(3));
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  addEventListener('pointerdown', () => document.querySelector('.cursor')?.classList.add('is-down'));
  addEventListener('pointerup', () => document.querySelector('.cursor')?.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => document.querySelector('.cursor')?.classList.remove('is-on'));
}

// The comment box is a frame from another site; it is told when the theme changes.
const commentsTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'photon-dark' : 'github-light');
function syncCommentsTheme() {
  document.querySelector<HTMLIFrameElement>('iframe.utterances-frame')?.contentWindow?.postMessage({ type: 'set-theme', theme: commentsTheme() }, 'https://utteranc.es');
}
// The device switching between light and dark also repaints, when the reader has not chosen.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
  const { refreshPalette } = await import('./palette');
  refreshPalette();
  syncCommentsTheme();
});

// Appearance menu: theme (automatic, light, dark) and, for the light theme, the sky colour.
function syncSkyMenu() {
  const d = document.documentElement.dataset;
  document.querySelectorAll<HTMLInputElement>('.sky-menu input').forEach((input) => {
    input.checked = (input.name === 'sky-mode' ? d.skyMode ?? 'auto' : d.skyHue ?? 'auto') === input.value;
  });
}
document.addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  if (!input.closest?.('.sky-menu')) return;
  const { setSky } = await import('./palette');
  setSky(input.name as 'sky-mode' | 'sky-hue', input.value);
  syncCommentsTheme();
});

// Celebrate button: the confetti code is fetched on first use.
document.addEventListener('click', async (e) => {
  const btn = (e.target as Element).closest?.('[data-celebrate]');
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  if (reduce) {
    // No flying confetti for people who asked for less motion: the label cheers instead.
    const old = btn.lastChild!.textContent;
    btn.lastChild!.textContent = document.documentElement.lang === 'en' ? 'Well done!' : '太棒了，恭喜！';
    setTimeout(() => { btn.lastChild!.textContent = old; }, 2200);
    return;
  }
  const { celebrate } = await import('./celebrate');
  celebrate({ x: r.left + r.width / 2, y: r.top });
});

// Image lightbox: one <dialog> shared by every page.
const box = document.querySelector<HTMLDialogElement>('dialog.lightbox');
if (box) {
  box.addEventListener('click', () => box.close());
  document.addEventListener('click', (e) => {
    const img = (e.target as Element).closest?.<HTMLImageElement>('img[data-zoom]');
    if (img) openZoom(img);
  });
  document.addEventListener('keydown', (e) => {
    const img = (e.target as Element).closest?.<HTMLImageElement>('img[data-zoom]');
    if (img && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openZoom(img); }
  });
}
function openZoom(img: HTMLImageElement) {
  if (!box) return;
  const big = box.querySelector('img') ?? box.querySelector('figure')!.insertBefore(new Image(), box.querySelector('figcaption'));
  big.src = img.currentSrc || img.src;
  big.alt = img.alt;
  box.querySelector('figcaption')!.textContent = img.alt;
  box.showModal();
}

// ---- on every page -------------------------------------------------------------------

function setupPage() {
  syncSkyMenu();
  // Rise-in on scroll.
  const items = document.querySelectorAll<HTMLElement>('.reveal:not(.in)');
  if (reduce || !('IntersectionObserver' in window)) items.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  }

  // Images drop their loading shimmer once decoded.
  document.querySelectorAll<HTMLImageElement>('.prose img').forEach((img) => {
    // Click or press Enter to see the image larger.
    img.dataset.zoom = '';
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `放大圖片：${img.alt}`);
    const done = () => img.classList.add('is-loaded');
    if (img.complete) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  // Table of contents: highlight the section being read.
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc a')];
  if (links.length) {
    const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const heads = [...byId.keys()].map((id) => document.getElementById(id)).filter((h): h is HTMLElement => !!h);
    const mark = () => {
      let current = heads[0];
      for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.3) current = h;
      links.forEach((a) => a.classList.toggle('is-active', a === byId.get(current?.id ?? '')));
    };
    mark();
    addEventListener('scroll', mark, { passive: true });
    document.addEventListener('astro:before-swap', () => removeEventListener('scroll', mark), { once: true });
  }

  // Copy link.
  const btn = document.querySelector<HTMLButtonElement>('[data-copy-link]');
  const label = btn?.querySelector<HTMLElement>('[data-copy-label]');
  btn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.origin + location.pathname);
      btn.classList.add('is-done');
      if (label) label.textContent = '已複製';
      setTimeout(() => { btn.classList.remove('is-done'); if (label) label.textContent = '複製連結'; }, 2000);
    } catch {
      if (label) label.textContent = '無法複製，請手動複製網址';
    }
  });

  // Comments (utterances): the script is added only when the box scrolls near the viewport.
  const comments = document.querySelector<HTMLElement>('[data-comments]');
  if (comments && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const s = document.createElement('script');
      s.src = 'https://utteranc.es/client.js';
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.setAttribute('repo', comments.dataset.repo!);
      s.setAttribute('issue-term', 'pathname');
      s.setAttribute('label', comments.dataset.label!);
      s.setAttribute('theme', commentsTheme());
      comments.append(s);
      // utterances replaces the script with its own frame once it is ready.
      new MutationObserver((_, mo) => {
        if (comments.querySelector('.utterances')) { comments.classList.add('is-loaded'); mo.disconnect(); }
      }).observe(comments, { childList: true });
    }, { rootMargin: '600px' });
    io.observe(comments);
  }

  // YouTube: load the player only when asked.
  document.querySelectorAll<HTMLElement>('.yt[data-yt]').forEach((box) => {
    box.querySelector('a')?.addEventListener('click', (e) => {
      e.preventDefault();
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1`;
      f.title = 'YouTube 影片';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      box.replaceChildren(f);
    });
  });
}
document.addEventListener('astro:page-load', setupPage);
