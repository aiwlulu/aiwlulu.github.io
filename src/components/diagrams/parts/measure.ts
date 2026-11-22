// Rough text width, enough to size a chip or a plate around its label.
// Full-width characters take one em; Latin letters about 0.56 em; monospace 0.6 em.
export function textWidth(text = '', size = 13, mono = false): number {
  let w = 0;
  for (const ch of text) {
    if (ch === ' ') w += size * 0.32;
    else if (ch.codePointAt(0)! > 0x2e7f) w += size;
    else w += size * (mono ? 0.6 : 0.56);
  }
  return w;
}
