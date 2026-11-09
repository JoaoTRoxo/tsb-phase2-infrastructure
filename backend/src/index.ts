import type { Core } from '@strapi/strapi';

import { ensureLocales } from './bootstrap/locales';
import { openPublicReadAccess } from './bootstrap/public-access';
import { startRebuildNotifier } from './bootstrap/rebuild';
import { ensureRoles } from './bootstrap/roles';

export default {
  register() {},

  /**
   * Everything the CMS needs that would otherwise be clicked together in the
   * admin panel. It runs on every start and is idempotent, so a fresh server
   * comes up fully configured.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureLocales(strapi);
    await ensureRoles(strapi);
    await openPublicReadAccess(strapi);
    startRebuildNotifier(strapi);
  },
};
