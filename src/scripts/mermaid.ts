const sourceSelector = '.prose pre[data-language="mermaid"]';
const root = document.documentElement;
const renderedTheme = new WeakMap<HTMLPreElement, string>();
let diagramId = 0;
let rendering = false;
let renderQueued = false;

async function renderDiagrams() {
  if (rendering) {
    renderQueued = true;
    return;
  }

  const theme = root.dataset.theme === 'dark' ? 'dark' : 'neutral';
  const sources = [...document.querySelectorAll<HTMLPreElement>(sourceSelector)]
    .filter((source) => renderedTheme.get(source) !== theme);
  if (!sources.length) return;

  rendering = true;
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      theme,
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      htmlLabels: false,
      fontFamily: getComputedStyle(root).getPropertyValue('--font').trim(),
    });
    await document.fonts.ready;

    for (const source of sources) {
      if (!source.isConnected) continue;
      try {
        const { svg } = await mermaid.render(`post-diagram-${++diagramId}`, source.textContent ?? '');
        if (!source.isConnected) continue;
        const diagram = source.nextElementSibling?.classList.contains('post-diagram')
          ? source.nextElementSibling
          : document.createElement('div');
        diagram.className = 'post-diagram';
        diagram.innerHTML = svg;
        if (!diagram.isConnected) source.after(diagram);
        source.hidden = true;
        renderedTheme.set(source, theme);
      } catch (error) {
        console.warn('Mermaid diagram could not be rendered.', error);
      }
    }
  } catch (error) {
    console.warn('Mermaid could not be loaded.', error);
  } finally {
    rendering = false;
    if (renderQueued) {
      renderQueued = false;
      void renderDiagrams();
    }
  }
}

document.addEventListener('astro:page-load', renderDiagrams);
new MutationObserver(renderDiagrams).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
void renderDiagrams();
