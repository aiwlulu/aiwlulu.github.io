// Small page behaviours. The site uses client-side navigation, so anything tied to page
// content is set up again on every `astro:page-load` (which also fires on first load).

import { codeBar, joinLines } from './code-block.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- once per visit ------------------------------------------------------------------

// Loading bar while the next page is fetched, so a click never feels dead.
document.addEventListener('astro:before-preparation', (e) => {
  document.querySelector('.loadbar')?.classList.remove('is-done');
  document.documentElement.classList.add('is-loading');
  // Each page carries its own small font (scripts/page-fonts.mjs). Load it before the swap so the
  // new text does not flash in a fallback face; give up after 800ms and let font-display swap.
  const load = e.loader;
  e.loader = async () => {
    await load();
    for (const face of pageFaces) document.fonts.delete(face);
    const css = e.newDocument.querySelector('style[data-page-fonts]')?.textContent ?? '';
    pageFaces = [...css.matchAll(/font-family:'([^']+)'[^}]*?src:url\(([^)]+)\)[^}]*?unicode-range:([^}]+)/g)].map(
      ([, family, url, range]) => new FontFace(family, `url(${url})`, { weight: '400 900', display: 'swap', unicodeRange: range }),
    );
    for (const face of pageFaces) document.fonts.add(face);
    if (pageFaces.length) await Promise.race([Promise.allSettled(pageFaces.map((f) => f.load())), new Promise((r) => setTimeout(r, 800))]);
  };
});
let pageFaces: FontFace[] = [];
// Navigation replaces the attributes on <html>, so the sky choice and tone are carried over.
let carried: { skyMode?: string; theme?: string } = {};
document.addEventListener('astro:before-swap', () => {
  const d = document.documentElement.dataset;
  carried = { skyMode: d.skyMode, theme: d.theme };
});
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.remove('is-loading');
  document.documentElement.classList.add('js');
  if (carried.skyMode) document.documentElement.dataset.skyMode = carried.skyMode;
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

// Theme button: one press flips between light and dark. Until it is pressed the page follows
// the device setting and the local time.
document.addEventListener('click', async (e) => {
  if (!(e.target as Element).closest?.('[data-theme-toggle]')) return;
  const { toggleTheme } = await import('./palette');
  toggleTheme();
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
  box.addEventListener('click', (e) => {
    if (e.target instanceof Node && box.querySelector('figcaption')?.contains(e.target)) return;
    box.close();
  });
  document.addEventListener('click', (e) => {
    const img = (e.target as Element).closest?.<HTMLImageElement>('img[data-zoom]');
    if (img) return openZoom(img);
    const diagram = (e.target as Element).closest?.<HTMLElement>('[data-zoom-diagram]');
    const svg = diagram?.querySelector<SVGSVGElement>(':scope > svg');
    if (diagram && svg) openZoom(svg, diagram.dataset.zoomDiagram);
  });
  document.addEventListener('keydown', (e) => {
    const img = (e.target as Element).closest?.<HTMLImageElement>('img[data-zoom]');
    if (img && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openZoom(img); }
  });
}
function openZoom(source: HTMLImageElement | SVGSVGElement, caption = '') {
  if (!box) return;
  const figure = box.querySelector('figure')!;
  figure.querySelectorAll('img, svg').forEach((el) => el.remove());
  let media: Element;
  if (source instanceof HTMLImageElement) {
    const big = new Image();
    big.src = source.currentSrc || source.src;
    big.alt = source.alt;
    caption ||= source.alt;
    media = big;
  } else {
    media = source.cloneNode(true) as Element;
    media.removeAttribute('style');
    media.removeAttribute('id');
  }
  figure.prepend(media);
  box.querySelector('figcaption')!.textContent = caption;
  box.showModal();
}

// Code blocks: the wrap switch and the copy button.
document.addEventListener('click', async (e) => {
  const target = e.target as Element;
  const wrap = target.closest?.<HTMLElement>('[data-code-wrap]');
  if (wrap) {
    const on = wrap.getAttribute('aria-checked') !== 'true';
    wrap.setAttribute('aria-checked', String(on));
    wrap.closest('.post-code')?.classList.toggle('no-wrap', !on);
    return;
  }
  const copy = target.closest?.<HTMLElement>('[data-code-copy]');
  if (!copy) return;
  // Line by line, so the copied text keeps its real line breaks whether or not it is wrapped.
  const lines = [...(copy.closest('.post-code')?.querySelectorAll('.line') ?? [])].map((l) => l.textContent ?? '');
  const label = copy.querySelector<HTMLElement>('[data-copy-label]');
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    copy.classList.add('is-done');
    if (label) label.textContent = '已複製';
  } catch {
    if (label) label.textContent = '無法複製';
  }
  setTimeout(() => { copy.classList.remove('is-done'); if (label) label.textContent = '複製'; }, 2000);
});

// ---- on every page -------------------------------------------------------------------

function setupPage() {
  // Code blocks are wrapped by the build step; in `astro dev` it has not run, so do it here.
  document.querySelectorAll<HTMLPreElement>('.prose pre[data-language]:not([data-language="mermaid"])').forEach((pre) => {
    if (pre.parentElement?.classList.contains('post-code')) return;
    const block = document.createElement('div');
    block.className = 'post-code';
    block.innerHTML = codeBar(pre.dataset.language ?? '');
    pre.innerHTML = joinLines(pre.innerHTML);
    pre.before(block);
    block.append(pre);
  });
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
