import type { Core } from '@strapi/strapi';

const PUBLIC_ACTIONS = ['article.article', 'gallery-image.gallery-image', 'author.author', 'tag.tag'].flatMap(
  (type) => [`api::${type}.find`, `api::${type}.findOne`]
);

/**
 * Let anonymous requests read published content, which is what the static site
 * build uses. Drafts and private fields are never returned by these routes, and
 * the blog has no public accounts, so self-registration is switched off.
 */
export async function openPublicReadAccess(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  const permissions = strapi.db.query('plugin::users-permissions.permission');

  for (const action of PUBLIC_ACTIONS) {
    const existing = await permissions.findOne({ where: { action, role: role.id } });
    if (!existing) {
      await permissions.create({ data: { action, role: role.id } });
    }
  }

  const store = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
  const advanced = (await store.get()) as Record<string, unknown>;
  if (advanced.allow_register !== false) {
    await store.set({ value: { ...advanced, allow_register: false } });
  }
}
