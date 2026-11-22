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
fs.writeFileSync('public/apple-touch-icon.png', await sharp(await png(square, 180)).flatten({ background: '#2f80d0' }).png().toBuffer());

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

// Share image, 1200x630.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aaef3"/><stop offset="0.55" stop-color="#a9d4f8"/><stop offset="0.75" stop-color="#e3f1fd"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8e8"/><stop offset="0.45" stop-color="#3a94d6"/><stop offset="1" stop-color="#164f86"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="halo"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  <g fill="#fff" filter="url(#soft)">
    <ellipse cx="170" cy="150" rx="210" ry="46"/><ellipse cx="280" cy="112" rx="110" ry="50"/><ellipse cx="90" cy="118" rx="90" ry="40"/>
    <ellipse cx="1060" cy="250" rx="190" ry="40"/><ellipse cx="980" cy="218" rx="100" ry="44"/><ellipse cx="1130" cy="214" rx="80" ry="36"/>
    <ellipse cx="640" cy="405" rx="420" ry="26" opacity="0.8"/>
  </g>
  <rect y="455" width="1200" height="175" fill="url(#sea)"/>
  <path d="M0 470 Q150 452 300 470 T600 470 T900 470 T1200 470 V500 H0Z" fill="#fff" opacity="0.28"/>
  <path d="M0 520 Q200 500 400 520 T800 520 T1200 520 V545 H0Z" fill="#fff" opacity="0.12"/>
  <rect x="250" y="205" width="700" height="190" rx="95" fill="#fff" opacity="0.55" filter="url(#halo)"/>
  <text x="600" y="310" text-anchor="middle" font-family="PingFang TC, Noto Sans TC, sans-serif" font-weight="800" font-size="104" letter-spacing="6" fill="#20344b">過鹿人部落格</text>
  <text x="600" y="382" text-anchor="middle" font-family="PingFang TC, Noto Sans TC, sans-serif" font-weight="600" font-size="38" letter-spacing="10" fill="#20344b">喜歡閱讀和學習</text>
</svg>`;
await sharp(Buffer.from(og)).composite([{ input: await png(logo, 120), left: 540, top: 62 }]).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote favicon.svg, favicon.png, favicon.ico, icon-192.png, apple-touch-icon.png, og.png');
