import type { Core } from '@strapi/strapi';

import { LOCALES } from './locales';

const ARTICLE = 'api::article.article';
const GALLERY = 'api::gallery-image.gallery-image';
const AUTHOR = 'api::author.author';
const TAG = 'api::tag.tag';

const OWN_ONLY = ['admin::is-creator'];
const ALL_VERBS = ['create', 'read', 'update', 'delete', 'publish'];

type Rule = { subject: string; verbs: string[]; ownOnly: boolean };
type RoleSpec = {
  code: string;
  name: string;
  description: string;
  rules: Rule[];
  ownMediaOnly: boolean;
};

/** Tags and team members need to be readable by everyone who writes content. */
const SHARED_READ: Rule[] = [
  { subject: TAG, verbs: ['create', 'read'], ownOnly: false },
  { subject: AUTHOR, verbs: ['read'], ownOnly: false },
];

/**
 * The roles required by the project. The Admin role is Strapi's built-in Super
 * Admin, the only one with access to users, roles and settings.
 */
const ROLES: RoleSpec[] = [
  {
    code: 'tsb-writer',
    name: 'Writer',
    description: 'Publishes articles and manages their own articles.',
    ownMediaOnly: true,
    rules: [{ subject: ARTICLE, verbs: ALL_VERBS, ownOnly: true }, ...SHARED_READ],
  },
  {
    code: 'tsb-traveller',
    name: 'Traveller',
    description: 'Publishes articles and gallery images and manages their own content.',
    ownMediaOnly: true,
    rules: [
      { subject: ARTICLE, verbs: ALL_VERBS, ownOnly: true },
      { subject: GALLERY, verbs: ALL_VERBS, ownOnly: true },
      ...SHARED_READ,
    ],
  },
  {
    code: 'tsb-moderator',
    name: 'Moderator',
    description: "Manages everyone's content, but not the backend configuration.",
    ownMediaOnly: false,
    rules: [
      { subject: ARTICLE, verbs: ALL_VERBS, ownOnly: false },
      { subject: GALLERY, verbs: ALL_VERBS, ownOnly: false },
      { subject: AUTHOR, verbs: ['create', 'read', 'update', 'delete'], ownOnly: false },
      { subject: TAG, verbs: ['create', 'read', 'update', 'delete'], ownOnly: false },
    ],
  },
];

/** Media library permissions, mirroring Strapi's own Editor and Author roles. */
function mediaPermissions(ownOnly: boolean) {
  const conditions = ownOnly ? OWN_ONLY : [];
  return [
    { action: 'plugin::upload.read', subject: null, conditions },
    { action: 'plugin::upload.configure-view', subject: null, conditions: [] },
    { action: 'plugin::upload.assets.create', subject: null, conditions: [] },
    { action: 'plugin::upload.assets.update', subject: null, conditions },
    { action: 'plugin::upload.assets.download', subject: null, conditions: [] },
    { action: 'plugin::upload.assets.copy-link', subject: null, conditions: [] },
  ];
}

/** Turn a role's rules into concrete permissions covering every field and locale. */
function buildPermissions(strapi: Core.Strapi, spec: RoleSpec) {
  const permissionService = strapi.service('admin::permission') as any;
  const contentTypeService = strapi.service('admin::content-type') as any;

  const contentActions = permissionService.actionProvider
    .values()
    .filter((action: { section: string }) => action.section === 'contentTypes');
  const allPermissions: any[] = contentTypeService.getPermissionsWithNestedFields(contentActions);

  const granted = spec.rules.flatMap((rule) => {
    const actions = rule.verbs.map((verb) => `plugin::content-manager.explorer.${verb}`);
    const localized = (strapi.contentType(rule.subject as any) as any).pluginOptions?.i18n?.localized === true;
    return allPermissions
      .filter((permission) => permission.subject === rule.subject && actions.includes(permission.action))
      .map((permission) => ({
        action: permission.action,
        subject: permission.subject,
        conditions: rule.ownOnly ? OWN_ONLY : [],
        properties: localized ? { ...permission.properties, locales: LOCALES } : permission.properties,
      }));
  });

  return [...granted, ...mediaPermissions(spec.ownMediaOnly)];
}

/**
 * Create the project's roles and sync their permissions from this file. Syncing
 * on every start means that new content-type fields are picked up automatically,
 * and that the roles are reviewed like code. Additional roles created in the admin
 * panel are left alone.
 */
export async function ensureRoles(strapi: Core.Strapi) {
  const roleService = strapi.service('admin::role') as any;

  for (const spec of ROLES) {
    let role = await roleService.findOne({ code: spec.code });
    if (!role) {
      role = await roleService.create({ code: spec.code, name: spec.name, description: spec.description });
      strapi.log.info(`Created the ${spec.name} role`);
    }
    await roleService.assignPermissions(role.id, buildPermissions(strapi, spec));
  }

  const superAdmin = await roleService.getSuperAdmin();
  if (superAdmin && superAdmin.name !== 'Admin') {
    await roleService.update({ id: superAdmin.id }, { name: 'Admin', description: "Manages anyone's content and the backend configuration." });
  }

  // Strapi's sample roles would only confuse the role list. Keep one if it is in use.
  for (const code of ['strapi-editor', 'strapi-author']) {
    const role = await roleService.findOne({ code });
    if (role && (await roleService.getUsersCount(role.id)) === 0) {
      await roleService.deleteByIds([role.id]);
    }
  }
}
