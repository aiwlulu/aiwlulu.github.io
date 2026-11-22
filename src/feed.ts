import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, getPosts } from './site';

export async function feed(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site!,
    customData: `<language>zh-TW</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category, ...post.data.tags],
      link: `/blog/${post.id}/`,
    })),
  });
}
