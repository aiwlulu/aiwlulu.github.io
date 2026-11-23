// llms.txt: a plain-text map of the site for AI assistants (an emerging AEO convention).
import type { APIContext } from 'astro';
import { SITE, getPosts } from '../site';

export async function GET({ site }: APIContext) {
  const posts = await getPosts();
  const url = (p: string) => new URL(p, site).href;
  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}作者：${SITE.author}。語言：正體中文。`,
    '',
    '## 文章',
    '',
    ...posts.map((p) => `- [${p.data.title}](${url(`/blog/${p.id}/`)})：${p.data.description}`),
    '',
    '## 其他',
    '',
    `- [關於](${url('/about/')})：作者介紹`,
    `- [About (English)](${url('/en/about/')}): who writes this blog`,
    `- [4-7-8 放鬆呼吸](${url('/breathe/')})：跟著圓圈做的呼吸練習`,
    `- [RSS](${url('/rss.xml')})：文章更新`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
