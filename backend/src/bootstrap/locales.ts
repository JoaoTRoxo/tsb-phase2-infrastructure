import type { Core } from '@strapi/strapi';

/** Locales the site is published in. English is Strapi's default locale. */
export const LOCALES = ['en', 'pt'];

/** Create any missing locale. */
export async function ensureLocales(strapi: Core.Strapi) {
  const service = strapi.plugin('i18n').service('locales');
  const existing: { code: string }[] = await service.find();
  if (!existing.some((locale) => locale.code === 'pt')) {
    await service.create({ code: 'pt', name: 'Portuguese (pt)' });
    strapi.log.info('Created the pt locale');
  }
}
