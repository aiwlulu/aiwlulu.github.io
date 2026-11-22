// Draws the default social share image (public/og.png, 1200x630). Run: node scripts/make-og.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d4f7"/><stop offset="0.7" stop-color="#e3f1fd"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8e8"/><stop offset="0.45" stop-color="#3a94d6"/><stop offset="1" stop-color="#164f86"/></linearGradient>
    <radialGradient id="sun"><stop offset="0" stop-color="#fffdf2"/><stop offset="0.35" stop-color="#fff3d4" stop-opacity="0.9"/><stop offset="1" stop-color="#fff3d4" stop-opacity="0"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  <circle cx="940" cy="150" r="170" fill="url(#sun)"/>
  <g fill="#fff" filter="url(#soft)" opacity="0.92">
    <ellipse cx="210" cy="120" rx="170" ry="38"/><ellipse cx="300" cy="96" rx="90" ry="40"/>
    <ellipse cx="1040" cy="270" rx="150" ry="30"/><ellipse cx="980" cy="250" rx="80" ry="32"/>
    <ellipse cx="620" cy="70" rx="120" ry="24"/>
  </g>
  <rect y="455" width="1200" height="175" fill="url(#sea)"/>
  <path d="M0 470 Q150 452 300 470 T600 470 T900 470 T1200 470 V500 H0Z" fill="#fff" opacity="0.28"/>
  <path d="M0 520 Q200 500 400 520 T800 520 T1200 520 V545 H0Z" fill="#fff" opacity="0.12"/>
  <text x="600" y="300" text-anchor="middle" font-family="PingFang TC, Noto Sans TC, sans-serif" font-weight="800" font-size="104" letter-spacing="6" fill="#20344b">過鹿人部落格</text>
  <text x="600" y="375" text-anchor="middle" font-family="PingFang TC, Noto Sans TC, sans-serif" font-size="38" letter-spacing="10" fill="#20344b">喜歡閱讀和學習</text>
</svg>`;

const deer = await sharp('src/assets/deer.png').resize(112, 112).toBuffer();
await sharp(Buffer.from(svg)).composite([{ input: deer, left: 544, top: 62 }]).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote public/og.png');
