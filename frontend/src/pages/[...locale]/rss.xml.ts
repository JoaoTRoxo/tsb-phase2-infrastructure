import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { localePath, localeStaticPaths, t, type Locale } from '../../i18n/ui';
import { getContent } from '../../lib/cms';

export const getStaticPaths = localeStaticPaths;

export async function GET(context: APIContext) {
  const locale = (context.props as { locale: Locale }).locale;
  const { articles } = await getContent(locale);
  return rss({
    title: t(locale, 'site.name'),
    description: t(locale, 'site.tagline'),
    site: context.site!,
    items: articles.map((article) => ({
      title: article.title,
      description: article.excerpt,
      pubDate: new Date(article.date),
      link: localePath(locale, `/articles/${article.slug}`),
    })),
  });
}
