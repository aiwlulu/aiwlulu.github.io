// Cut-paper shapes shared by the site share image (make-icons.mjs) and the per-post share
// images (src/pages/og/[slug].png.ts).
export const cloud = 'M32 88a27 27 0 0 1 2-54 38 38 0 0 1 70-16 30 30 0 0 1 54 14 27 27 0 0 1 10 56z';
export const wave = (half, amp) => {
  let d = `M0 30Q${half / 2} ${30 - amp} ${half} 30`;
  for (let x = half * 2; x <= 1500; x += half) d += `T${x} 30`;
  return `${d}V300H0z`;
};
/** A flat paper shadow under each cut-out. */
export const cutFilter = '<filter id="cut"><feDropShadow dx="0" dy="4" stdDeviation="0" flood-color="#22313f" flood-opacity="0.09"/></filter>';
