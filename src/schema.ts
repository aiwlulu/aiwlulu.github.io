// JSON-LD builders. Structured data is what search engines and AI answer engines read to
// understand who wrote a page and what it is about.
import { SITE, type Post } from './site';

const abs = (path: string) => new URL(path, SITE.url).href;

export const person = {
  '@type': 'Person',
  '@id': abs('/about/#person'),
  name: SITE.author,
  alternateName: 'Lulu',
  url: abs('/about/'),
  description: '讀會計，但一路逃避做會計的軟體人。喜歡閱讀和學習。',
  image: abs('/favicon.png'),
  sameAs: [SITE.github],
};

export const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  name: SITE.name,
  url: abs('/'),
  description: SITE.description,
  inLanguage: SITE.lang,
  publisher: person,
};

export const breadcrumbs = (items: { name: string; href?: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    ...(item.href ? { item: abs(item.href) } : {}),
  })),
});

export const blogPosting = (post: Post, image: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  '@id': abs(`/blog/${post.id}/#article`),
  mainEntityOfPage: abs(`/blog/${post.id}/`),
  headline: post.data.title,
  description: post.data.description,
  datePublished: post.data.pubDate.toISOString(),
  dateModified: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
  inLanguage: SITE.lang,
  articleSection: post.data.category,
  keywords: post.data.tags.join(', '),
  image: abs(image),
  author: person,
  publisher: person,
  isPartOf: { '@id': abs('/#website') },
});

export const collectionPage = (name: string, path: string, posts: Post[]) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  url: abs(path),
  inLanguage: SITE.lang,
  isPartOf: { '@id': abs('/#website') },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/blog/${p.id}/`), name: p.data.title })),
  },
});
