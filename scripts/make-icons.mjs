// Builds every icon and the share image from src/assets/logo.svg. Run: node scripts/make-icons.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const logo = fs.readFileSync('src/assets/logo.svg', 'utf8');
const png = (svg, size) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

fs.writeFileSync('public/favicon.svg', logo);
fs.writeFileSync('public/favicon.png', await png(logo, 512));
fs.writeFileSync('public/icon-192.png', await png(logo, 192));

// iOS rounds the corners itself, so the touch icon fills the whole square.
const square = logo.replace(' clip-path="url(#c)"', '');
fs.writeFileSync('public/apple-touch-icon.png', await sharp(await png(square, 180)).flatten({ background: '#57a5d3' }).png().toBuffer());

// favicon.ico: an ICO container holding 16, 32 and 48px PNGs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(logo, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(s, at);
  header.writeUInt8(s, at + 1);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(images[i].length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += images[i].length;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...images]));

// Share image, 1200x630, in the same cut-paper style as the site.
const cloud = 'M32 88a27 27 0 0 1 2-54 38 38 0 0 1 70-16 30 30 0 0 1 54 14 27 27 0 0 1 10 56z';
const wave = (half, amp) => { let d = `M0 30Q${half / 2} ${30 - amp} ${half} 30`; for (let x = half * 2; x <= 1500; x += half) d += `T${x} 30`; return `${d}V300H0z`; };
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><filter id="cut"><feDropShadow dx="0" dy="4" stdDeviation="0" flood-color="#22313f" flood-opacity="0.09"/></filter></defs>
  <rect width="1200" height="630" fill="#cfe6f5"/>
  <g filter="url(#cut)">
    <circle cx="1030" cy="130" r="58" fill="#ffcb3d"/>
    <g fill="#fffdf6">
      <path d="${cloud}" transform="translate(70 70) scale(1.5)"/>
      <path d="${cloud}" transform="translate(860 250) scale(1.15)"/>
      <path d="${cloud}" transform="translate(470 40) scale(0.8)"/>
    </g>
  </g>
  <path d="M90 330q16-26 32 0t32 0 32 0" fill="none" stroke="#ef8f6b" stroke-width="8" stroke-linecap="round"/>
  <g stroke="#fff" stroke-opacity="0.5" stroke-width="3">
    <path d="${wave(150, 20)}" fill="#b5ddec" transform="translate(0 430)"/>
    <path d="${wave(200, 26)}" fill="#86c5e2" transform="translate(-60 470)"/>
    <path d="${wave(120, 18)}" fill="#57a5d3" transform="translate(-30 515)"/>
    <path d="${wave(150, 24)}" fill="#2f7fbd" transform="translate(-90 560)"/>
  </g>
  <text x="600" y="330" text-anchor="middle" font-family="PingFang TC, Noto Sans TC, sans-serif" font-weight="800" font-size="108" letter-spacing="8" fill="#22313f">過鹿人部落格</text>
  <rect x="452" y="372" width="296" height="20" rx="6" fill="#ffcb3d"/>
  <text x="600" y="390" text-anchor="middle" font-family="PingFang TC, Noto Sans TC, sans-serif" font-weight="600" font-size="38" letter-spacing="10" fill="#22313f">喜歡閱讀和學習</text>
</svg>`;
await sharp(Buffer.from(og)).composite([{ input: await png(logo, 120), left: 540, top: 96 }]).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote favicon.svg, favicon.png, favicon.ico, icon-192.png, apple-touch-icon.png, og.png');
