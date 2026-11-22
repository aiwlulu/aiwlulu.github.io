import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  name: '過鹿人部落格',
  author: '過鹿人',
  tagline: '喜歡閱讀和學習',
  description: '過鹿人的部落格，記錄閱讀、學習與好用工具的心得：讀書筆記、TED 演講整理、截圖工具推薦，還有關於開始寫作的故事。',
  url: 'https://aiwlulu.github.io',
  lang: 'zh-Hant-TW',
  github: 'https://github.com/aiwlulu',
  since: 2020,
};

export type Post = CollectionEntry<'blog'>;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Matches the old Hugo tag URLs: lowercase for Latin, unchanged for Chinese.
export const tagSlug = (tag: string) => tag.toLowerCase().replace(/\s+/g, '-');

export const formatDate = (d: Date) =>
  `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;

// Rough reading time: about 450 Chinese characters or 220 English words per minute.
export function readingMinutes(post: Post): number {
  const text = post.body ?? '';
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 450 + words / 220));
}

export function countBy(posts: Post[], pick: (p: Post) => string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const p of posts) for (const k of pick(p)) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'));
}
