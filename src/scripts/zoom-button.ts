// The button that opens a diagram larger. The figure itself stays a plain figure, so screen
// readers still reach the diagram's own title and description; a mouse click anywhere on it
// also opens it (src/scripts/interactions.ts).
import zoomIn from 'lucide-static/icons/zoom-in.svg?raw';

const icon = zoomIn.replace(/<!--[\s\S]*?-->/, '').replace('<svg', '<svg aria-hidden="true" width="18" height="18"').replace(/\s(width|height)="24"/g, '');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export const zoomButton = (title: string) =>
  `<button class="post-diagram-zoom" type="button" aria-label="${esc(`放大圖表${title ? '：' + title : ''}`)}">${icon.trim()}</button>`;
