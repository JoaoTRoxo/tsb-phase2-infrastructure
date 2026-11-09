/** The languages the site is published in. To add one, also add it to astro.config.mjs and the CMS. */
export const LOCALES = ['en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', pt: 'Português' };
export const LOCALE_TAGS: Record<Locale, string> = { en: 'en', pt: 'pt-PT' };

const strings = {
  en: {
    'site.name': 'Far Enough',
    'site.tagline': 'Stories and photographs from the long way round.',
    'nav.home': 'Home',
    'nav.articles': 'Stories',
    'nav.gallery': 'Gallery',
    'nav.team': 'Team',
    'nav.skip': 'Skip to content',
    'theme.toggle': 'Switch between light and dark',
    'home.latest': 'Latest story',
    'home.read': 'Read the story',
    'home.more': 'More stories',
    'home.all': 'All stories',
    'home.gallery': 'From the gallery',
    'home.galleryAll': 'Open the gallery',
    'articles.title': 'Stories',
    'articles.intro': 'Everything we have written so far, newest first.',
    'articles.search': 'Search by place, title or anything in the text',
    'articles.searchLabel': 'Search stories',
    'articles.empty': 'Nothing matches that. Try a different word or remove a tag.',
    'articles.count.one': '1 story',
    'articles.count.other': '{n} stories',
    'articles.prev': 'Newer',
    'articles.next': 'Older',
    'articles.page': 'Page {n} of {total}',
    'article.minutes': '{n} min read',
    'article.by': 'By',
    'article.back': 'All stories',
    'article.next': 'Next story',
    'article.tags': 'Filed under',
    'gallery.title': 'Gallery',
    'gallery.intro': 'Pictures from the trips. Choose some tags to narrow them down.',
    'gallery.all': 'All',
    'gallery.empty': 'No pictures with those tags.',
    'gallery.close': 'Close',
    'gallery.prev': 'Previous picture',
    'gallery.next': 'Next picture',
    'gallery.open': 'Enlarge {title}',
    'gallery.by': 'Photo by',
    'team.title': 'The team',
    'team.intro': 'Five boots, three passports and one shared spreadsheet of terrible hostels.',
    'team.stories.one': '1 story',
    'team.stories.other': '{n} stories',
    'team.base': 'Based in',
    'footer.rss': 'RSS feed',
    'notfound.title': 'Off the map',
    'notfound.text': 'That page is not here, or has moved on.',
    'notfound.home': 'Back to the start',
  },
  pt: {
    'site.name': 'Far Enough',
    'site.tagline': 'Histórias e fotografias do caminho mais longo.',
    'nav.home': 'Início',
    'nav.articles': 'Histórias',
    'nav.gallery': 'Galeria',
    'nav.team': 'Equipa',
    'nav.skip': 'Saltar para o conteúdo',
    'theme.toggle': 'Alternar entre claro e escuro',
    'home.latest': 'História mais recente',
    'home.read': 'Ler a história',
    'home.more': 'Mais histórias',
    'home.all': 'Todas as histórias',
    'home.gallery': 'Da galeria',
    'home.galleryAll': 'Abrir a galeria',
    'articles.title': 'Histórias',
    'articles.intro': 'Tudo o que escrevemos até agora, das mais recentes para as mais antigas.',
    'articles.search': 'Pesquisar por lugar, título ou qualquer coisa no texto',
    'articles.searchLabel': 'Pesquisar histórias',
    'articles.empty': 'Não encontrámos nada. Experimente outra palavra ou retire uma etiqueta.',
    'articles.count.one': '1 história',
    'articles.count.other': '{n} histórias',
    'articles.prev': 'Mais recentes',
    'articles.next': 'Mais antigas',
    'articles.page': 'Página {n} de {total}',
    'article.minutes': '{n} min de leitura',
    'article.by': 'Por',
    'article.back': 'Todas as histórias',
    'article.next': 'História seguinte',
    'article.tags': 'Arquivado em',
    'gallery.title': 'Galeria',
    'gallery.intro': 'Imagens das viagens. Escolha algumas etiquetas para filtrar.',
    'gallery.all': 'Todas',
    'gallery.empty': 'Não há imagens com essas etiquetas.',
    'gallery.close': 'Fechar',
    'gallery.prev': 'Imagem anterior',
    'gallery.next': 'Imagem seguinte',
    'gallery.open': 'Ampliar {title}',
    'gallery.by': 'Fotografia de',
    'team.title': 'A equipa',
    'team.intro': 'Cinco botas, três passaportes e uma folha de cálculo partilhada com péssimos hostels.',
    'team.stories.one': '1 história',
    'team.stories.other': '{n} histórias',
    'team.base': 'Reside em',
    'footer.rss': 'Feed RSS',
    'notfound.title': 'Fora do mapa',
    'notfound.text': 'Essa página não existe, ou já seguiu viagem.',
    'notfound.home': 'Voltar ao início',
  },
} as const;

export type StringKey = keyof (typeof strings)['en'];

/** Look up a string, filling {placeholders} from `values`. */
export function t(locale: Locale, key: StringKey, values: Record<string, string | number> = {}) {
  return strings[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
}

/** Pick the singular or plural form of a counted string. */
export function count(locale: Locale, base: 'articles.count' | 'team.stories', n: number) {
  return t(locale, `${base}.${n === 1 ? 'one' : 'other'}` as StringKey, { n });
}

/** The URL of an internal path in a given language. */
export function localePath(locale: Locale, path = '/') {
  const clean = path === '/' ? '' : path;
  return locale === DEFAULT_LOCALE ? clean || '/' : `/${locale}${clean}`;
}

/** Static paths for pages that exist once per language, under src/pages/[...locale]. */
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}

export function formatDate(locale: Locale, date: string) {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}
