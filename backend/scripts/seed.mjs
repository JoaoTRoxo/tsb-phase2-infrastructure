// Fills an empty CMS with the demo content. Safe to run again: it does nothing when
// articles already exist. Needs a build: npm run build && npm run seed
import { statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { articles, authors, gallery, tags } from '../seed/content.mjs';

// Strapi's ES module entry point does not load under plain Node, its CommonJS one does.
const { createStrapi } = createRequire(import.meta.url)('@strapi/strapi');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imagePath = (name) => path.join(root, 'seed', 'images', `${name}.jpg`);

// The demo import must not start a site rebuild.
delete process.env.GITHUB_DISPATCH_REPO;

const strapi = await createStrapi({ appDir: root, distDir: path.join(root, 'dist') }).load();
strapi.log.level = 'warn';

const uploads = new Map();
async function upload(name, alt) {
  if (uploads.has(name)) return uploads.get(name);
  const filepath = imagePath(name);
  const [file] = await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: `${name}.jpg`, alternativeText: alt } },
    files: { filepath, originalFilename: `${name}.jpg`, mimetype: 'image/jpeg', size: statSync(filepath).size },
  });
  uploads.set(name, file.id);
  return file.id;
}

const existing = await strapi.documents('api::article.article').count({});
if (existing > 0) {
  console.log('The CMS already has content, nothing to do.');
} else {
  const tagIds = {};
  for (const tag of tags) {
    const created = await strapi.documents('api::tag.tag').create({ data: tag });
    tagIds[tag.slug] = created.documentId;
  }

  const authorIds = {};
  for (const { avatar, ...author } of authors) {
    const created = await strapi.documents('api::author.author').create({
      data: { ...author, avatar: await upload(avatar, author.name) },
    });
    authorIds[author.slug] = created.documentId;
  }

  const links = (entry) => ({
    author: authorIds[entry.author],
    tags: entry.tags.map((slug) => tagIds[slug]),
  });

  for (const article of articles) {
    const shared = {
      date: article.date,
      location: article.location,
      cover: await upload(article.cover, article.en.title),
      ...links(article),
    };
    const documents = strapi.documents('api::article.article');
    const created = await documents.create({ locale: 'en', status: 'published', data: { ...shared, ...article.en } });
    await documents.update({
      documentId: created.documentId,
      locale: 'pt',
      status: 'published',
      data: { ...shared, ...article.pt },
    });
  }

  for (const item of gallery) {
    const shared = {
      takenOn: item.takenOn,
      location: item.location,
      image: await upload(item.image, item.en.title),
      ...links(item),
    };
    const documents = strapi.documents('api::gallery-image.gallery-image');
    const created = await documents.create({ locale: 'en', status: 'published', data: { ...shared, ...item.en } });
    await documents.update({
      documentId: created.documentId,
      locale: 'pt',
      status: 'published',
      data: { ...shared, ...item.pt },
    });
  }
  console.log(`Seeded ${articles.length} articles and ${gallery.length} gallery images in two languages.`);
}

await strapi.destroy();
process.exit(0);
