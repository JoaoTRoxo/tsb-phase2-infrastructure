/**
 * The site's only source of content. With STRAPI_URL set, content comes from the
 * CMS's public API at build time. Without it, the build uses the demo content in
 * backend/seed, so pull requests can be built and tested with no CMS or secrets.
 *
 * Both paths produce the same model, and nothing else in the site knows the difference.
 */
import type { ImageMetadata } from 'astro';

import { LOCALES, type Locale } from '../i18n/ui';

export interface Picture {
  src: string | ImageMetadata;
  width: number;
  height: number;
  alt: string;
}

export interface Tag {
  slug: string;
  name: string;
}

export interface Person {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar?: Picture;
  homeBase?: string;
  website?: string;
}

export interface Block {
  type: string;
  [key: string]: any;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: Block[];
  cover: Picture;
  date: string;
  location?: string;
  author?: Person;
  tags: Tag[];
  /** The slug of this article in every language it exists in. */
  translations: Partial<Record<Locale, string>>;
}

export interface GalleryImage {
  id: string;
  title: string;
  caption?: string;
  image: Picture;
  takenOn?: string;
  location?: string;
  author?: Person;
  tags: Tag[];
}

interface Content {
  articles: Article[];
  gallery: GalleryImage[];
  team: Person[];
}

const CMS_URL = process.env.STRAPI_URL?.replace(/\/$/, '');

const localizedTag = (raw: any, locale: Locale): Tag => ({
  slug: raw.slug,
  name: locale === 'pt' && raw.namePt ? raw.namePt : raw.name,
});

const localizedPerson = (raw: any, locale: Locale, avatar?: Picture): Person => ({
  slug: raw.slug,
  name: raw.name,
  role: locale === 'pt' && raw.rolePt ? raw.rolePt : raw.role,
  bio: locale === 'pt' && raw.bioPt ? raw.bioPt : raw.bio,
  avatar,
  homeBase: raw.homeBase ?? undefined,
  website: raw.website ?? undefined,
});

const newestFirst = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

/* ---------------------------------- CMS ---------------------------------- */

async function fetchAll(path: string, query: Record<string, string>) {
  const results: any[] = [];
  for (let page = 1; ; page++) {
    const params = new URLSearchParams({ ...query, 'pagination[page]': String(page), 'pagination[pageSize]': '100' });
    const url = `${CMS_URL}${path}?${params}`;
    const response = await fetch(url);
    // A failed build is much better than publishing a site with missing content.
    if (!response.ok) throw new Error(`The CMS answered ${response.status} for ${url}`);
    const { data, meta } = await response.json();
    results.push(...data);
    if (page >= meta.pagination.pageCount) return results;
  }
}

function cmsPicture(media: any, fallbackAlt: string): Picture {
  return {
    src: media.url.startsWith('http') ? media.url : `${CMS_URL}${media.url}`,
    width: media.width,
    height: media.height,
    alt: media.alternativeText || fallbackAlt,
  };
}

/** Images inside the rich text carry relative URLs too. */
function absolutizeBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) =>
    block.type === 'image' && !block.image.url.startsWith('http')
      ? { ...block, image: { ...block.image, url: `${CMS_URL}${block.image.url}` } }
      : block
  );
}

async function loadFromCms(locale: Locale, slugsByDocument: Map<string, Article['translations']>): Promise<Content> {
  const relations = {
    'populate[author][populate]': 'avatar',
    'populate[tags]': 'true',
    locale,
  };
  const person = (raw: any) =>
    raw ? localizedPerson(raw, locale, raw.avatar ? cmsPicture(raw.avatar, raw.name) : undefined) : undefined;

  const [rawArticles, rawGallery, rawTeam] = await Promise.all([
    fetchAll('/api/articles', { ...relations, 'populate[cover]': 'true', sort: 'date:desc' }),
    fetchAll('/api/gallery-images', { ...relations, 'populate[image]': 'true', sort: 'takenOn:desc' }),
    fetchAll('/api/authors', { populate: 'avatar', sort: 'order:asc' }),
  ]);

  return {
    articles: rawArticles.map((raw) => ({
      id: raw.documentId,
      slug: raw.slug,
      title: raw.title,
      excerpt: raw.excerpt,
      body: absolutizeBlocks(raw.body),
      cover: cmsPicture(raw.cover, raw.title),
      date: raw.date,
      location: raw.location ?? undefined,
      author: person(raw.author),
      tags: (raw.tags ?? []).map((tag: any) => localizedTag(tag, locale)),
      translations: slugsByDocument.get(raw.documentId) ?? {},
    })),
    gallery: rawGallery.map((raw) => ({
      id: raw.documentId,
      title: raw.title,
      caption: raw.caption ?? undefined,
      image: cmsPicture(raw.image, raw.title),
      takenOn: raw.takenOn ?? undefined,
      location: raw.location ?? undefined,
      author: person(raw.author),
      tags: (raw.tags ?? []).map((tag: any) => localizedTag(tag, locale)),
    })),
    team: rawTeam.map((raw) => person(raw)!),
  };
}

/** Which slug each article has in each language, so the language switcher can link directly. */
async function loadSlugs() {
  const slugs = new Map<string, Article['translations']>();
  for (const locale of LOCALES) {
    for (const raw of await fetchAll('/api/articles', { locale, 'fields[0]': 'slug' })) {
      slugs.set(raw.documentId, { ...slugs.get(raw.documentId), [locale]: raw.slug });
    }
  }
  return slugs;
}

/* --------------------------------- Fixtures ------------------------------- */

const seedImages = import.meta.glob<{ default: ImageMetadata }>('../../../backend/seed/images/*.jpg');

async function seedPicture(name: string, alt: string): Promise<Picture> {
  const loader = seedImages[`../../../backend/seed/images/${name}.jpg`];
  if (!loader) throw new Error(`There is no seed image called ${name}`);
  const { default: src } = await loader();
  return { src, width: src.width, height: src.height, alt };
}

async function loadFromSeed(locale: Locale): Promise<Content> {
  const seed = await import('../../../backend/seed/content.mjs');
  const tagBySlug = new Map(seed.tags.map((tag: any) => [tag.slug, localizedTag(tag, locale)]));
  const team: Person[] = await Promise.all(
    seed.authors.map(async (raw: any) => localizedPerson(raw, locale, await seedPicture(raw.avatar, raw.name)))
  );
  const person = (slug: string) => team.find((member) => member.slug === slug);

  const articles = await Promise.all(
    seed.articles.map(
      async (raw: any): Promise<Article> => ({
        id: raw.en.slug,
        slug: raw[locale].slug,
        title: raw[locale].title,
        excerpt: raw[locale].excerpt,
        body: raw[locale].body,
        cover: await seedPicture(raw.cover, raw[locale].title),
        date: raw.date,
        location: raw.location,
        author: person(raw.author),
        tags: raw.tags.map((slug: string) => tagBySlug.get(slug)),
        translations: { en: raw.en.slug, pt: raw.pt.slug },
      })
    )
  );

  const gallery = await Promise.all(
    seed.gallery.map(
      async (raw: any): Promise<GalleryImage> => ({
        id: raw.image,
        title: raw[locale].title,
        caption: raw[locale].caption,
        image: await seedPicture(raw.image, raw[locale].title),
        takenOn: raw.takenOn,
        location: raw.location,
        author: person(raw.author),
        tags: raw.tags.map((slug: string) => tagBySlug.get(slug)),
      })
    )
  );

  return { articles: articles.sort(newestFirst), gallery, team };
}

/* ---------------------------------- API ----------------------------------- */

// Every page asks for the same data, and the CMS should only be asked once per build.
const cache = new Map<Locale, Promise<Content>>();
let slugs: ReturnType<typeof loadSlugs> | undefined;

export function getContent(locale: Locale): Promise<Content> {
  let content = cache.get(locale);
  if (!content) {
    content = CMS_URL
      ? (slugs ??= loadSlugs()).then((map) => loadFromCms(locale, map))
      : loadFromSeed(locale);
    cache.set(locale, content);
  }
  return content;
}

/* -------------------------------- Helpers --------------------------------- */

/** All the plain text in some rich text, for search and reading time. */
export function blocksToText(blocks: Block[]): string {
  return blocks.map((block) => (block.children ? blocksToText(block.children) : (block.text ?? ''))).join(' ');
}

export function readingMinutes(blocks: Block[]) {
  return Math.max(1, Math.round(blocksToText(blocks).split(/\s+/).length / 200));
}

/** Every tag used by a list of items, sorted by name. */
export function tagsOf(items: { tags: Tag[] }[], locale: Locale) {
  const unique = new Map(items.flatMap((item) => item.tags.map((tag) => [tag.slug, tag])));
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, locale));
}
