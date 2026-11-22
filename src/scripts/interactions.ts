// Small page behaviours. The site uses client-side navigation, so anything tied to page
// content is set up again on every `astro:page-load` (which also fires on first load).

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- once per visit ------------------------------------------------------------------

// Loading bar while the next page is fetched, so a click never feels dead.
document.addEventListener('astro:before-preparation', () => {
  document.querySelector('.loadbar')?.classList.remove('is-done');
  document.documentElement.classList.add('is-loading');
});
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.remove('is-loading');
  document.documentElement.classList.add('js');
  document.querySelector('.loadbar')?.classList.add('is-done');
  // The sky element is carried over between pages; only its height changes.
  document.querySelector('.sky')?.classList.toggle('is-tall', document.body.dataset.sky === 'tall');
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

// ---- on every page -------------------------------------------------------------------

function setupPage() {
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
