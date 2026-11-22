const sourceSelector = '.prose pre[data-language="mermaid"]';
const root = document.documentElement;
const renderedTheme = new WeakMap<HTMLPreElement, string>();
let diagramId = 0;
let rendering = false;
let renderQueued = false;

function fitFlowchart(diagram: Element) {
  const svg = diagram.querySelector<SVGSVGElement>('svg.flowchart');
  if (!svg) return;

  // Measure the mounted SVG when Mermaid's initial viewBox clips the laid-out graph.
  const bounds = svg.getBBox();
  const view = svg.viewBox.baseVal;
  if (!bounds.width || !bounds.height) return;
  if (bounds.x >= view.x && bounds.y >= view.y
    && bounds.x + bounds.width <= view.x + view.width
    && bounds.y + bounds.height <= view.y + view.height) return;

  const padding = 10;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;
  svg.setAttribute('viewBox', `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`);
  if (svg.style.maxWidth) svg.style.maxWidth = `${width}px`;
}

async function renderDiagrams() {
  if (rendering) {
    renderQueued = true;
    return;
  }

  const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
  const sources = [...document.querySelectorAll<HTMLPreElement>(sourceSelector)]
    .filter((source) => renderedTheme.get(source) !== theme);
  if (!sources.length) return;

  rendering = true;
  try {
    const { default: mermaid } = await import('mermaid');
    const styles = getComputedStyle(root);
    const token = (name: string) => styles.getPropertyValue(name).trim();
    mermaid.initialize({
      theme: 'base',
      look: 'classic',
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      htmlLabels: false,
      fontFamily: token('--font'),
      themeVariables: {
        darkMode: theme === 'dark',
        background: token('--surface-2'),
        primaryColor: token('--surface'),
        primaryTextColor: token('--ink'),
        primaryBorderColor: token('--line-2'),
        lineColor: token('--accent'),
        edgeLabelBackground: token('--surface-2'),
        actorBkg: token('--sky-2'),
        actorBorder: token('--accent'),
        actorTextColor: token('--ink'),
        actorLineColor: token('--muted'),
        signalColor: token('--accent'),
        signalTextColor: token('--ink'),
        noteBkgColor: token('--sage-tint'),
        noteBorderColor: token('--line-2'),
        noteTextColor: token('--ink'),
      },
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
        fitFlowchart(diagram);
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
