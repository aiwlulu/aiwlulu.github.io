// Share image for each post, 1200x630, built with the site: the same cut-paper sky and sea as
// /og.png, the post title in the site's rounded font. satori turns the text into SVG paths with
// the font cut from node_modules, so the build needs no system fonts; sharp makes the PNG.
import fs from 'node:fs';
import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import { getPosts, SITE, type Post } from '../../site';
import { staticFonts } from '../../../scripts/font-subset.mjs';
import { cloud, cutFilter, wave } from '../../../scripts/paper-art.mjs';

const W = 1200, H = 630;
const INK = '#22313f';

export const getStaticPaths: GetStaticPaths = async () => (await getPosts()).map((post) => ({ params: { slug: post.id }, props: { post } }));

// Sky, sun, clouds and a low sea; the text goes on top.
const art = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${cutFilter}</defs>
  <rect width="${W}" height="${H}" fill="#cfe6f5"/>
  <g filter="url(#cut)">
    <circle cx="1080" cy="96" r="52" fill="#ffcb3d"/>
    <g fill="#fffdf6">
      <path d="${cloud}" transform="translate(850 40) scale(0.9)"/>
    </g>
  </g>
  <path d="M1056 214q14-22 28 0t28 0 28 0" fill="none" stroke="#ef8f6b" stroke-width="8" stroke-linecap="round"/>
  <g stroke="#fff" stroke-opacity="0.5" stroke-width="3">
    <path d="${wave(150, 16)}" fill="#b5ddec" transform="translate(0 500)"/>
    <path d="${wave(200, 20)}" fill="#86c5e2" transform="translate(-60 530)"/>
    <path d="${wave(120, 14)}" fill="#57a5d3" transform="translate(-30 562)"/>
    <path d="${wave(150, 18)}" fill="#2f7fbd" transform="translate(-90 594)"/>
  </g>
</svg>`;
const background = `data:image/png;base64,${(await sharp(Buffer.from(art)).png().toBuffer()).toString('base64')}`;
const logo = `data:image/svg+xml;base64,${fs.readFileSync('src/assets/logo.svg').toString('base64')}`;

// Long titles step down in size so they stay within three lines above the sea.
const titleSize = (title: string) => (title.length <= 14 ? 78 : title.length <= 26 ? 66 : 56);

const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle, category } = (props as { post: Post }).post.data;
  const bold = `${SITE.name}${category}${subtitle ?? ''}`;
  // satori takes one font per name, so each cut gets its own name and the family list walks them.
  const fonts = [
    ...(await staticFonts(title, 900)).map((data, i) => ({ name: `c${i}`, data, weight: 900 as const })),
    ...(await staticFonts(bold, 700)).map((data, i) => ({ name: `c${i}`, data, weight: 700 as const })),
  ];
  const family = [...new Set(fonts.map((f) => f.name))].join(', ');
  const card = h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', padding: '56px 80px', backgroundImage: `url(${background})`, fontFamily: family, color: INK }, [
    h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
      { type: 'img', props: { src: logo, width: 64, height: 64 } },
      h('div', { fontSize: 30, fontWeight: 700, letterSpacing: 2 }, SITE.name),
    ]),
    // Category, title and subtitle sit in the middle of the sky, above the sea.
    h('div', { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 96 }, [
      h('div', { display: 'flex' }, [
        h('div', { fontSize: 24, fontWeight: 700, padding: '6px 20px', borderRadius: 999, background: '#fde3d8', color: '#b4532f' }, category),
      ]),
      h('div', { marginTop: 22, maxWidth: 960, fontSize: titleSize(title), fontWeight: 900, lineHeight: 1.22, letterSpacing: 1 }, title),
      subtitle
        ? h('div', { display: 'flex', marginTop: 22 }, [
            h('div', { fontSize: 30, fontWeight: 700, padding: '0 6px', backgroundImage: 'linear-gradient(transparent 58%, #ffcb3d 58%, #ffcb3d 92%, transparent 92%)' }, subtitle),
          ])
        : null,
    ].filter(Boolean)),
  ]);
  const svg = await satori(card as never, { width: W, height: H, fonts });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
