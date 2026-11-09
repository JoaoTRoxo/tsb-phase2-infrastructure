// Checks on the finished static site in dist/, whichever content it was built from.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const dist = path.resolve('dist');
const read = (page) => readFileSync(path.join(dist, page), 'utf8');

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
const articlePages = (prefix) =>
  readdirSync(path.join(dist, prefix, 'articles')).filter((name) =>
    statSync(path.join(dist, prefix, 'articles', name)).isDirectory()
  );

/** Which file a site-internal URL resolves to, or undefined if there is none. */
function resolveLocal(url) {
  const clean = decodeURI(url.split(/[?#]/)[0]);
  return [clean, `${clean}/index.html`, `${clean}.html`]
    .map((candidate) => path.join(dist, candidate))
    .find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

test('every required page exists in both languages', () => {
  for (const prefix of ['', 'pt']) {
    for (const page of ['index.html', 'articles/index.html', 'gallery/index.html', 'team/index.html', 'rss.xml']) {
      assert.ok(existsSync(path.join(dist, prefix, page)), `${prefix}/${page} is missing`);
    }
  }
});

test('both languages have an article page for every article', () => {
  assert.ok(articlePages('').length > 0);
  assert.equal(articlePages('pt').length, articlePages('').length);
});

test('pages declare their language and link to their translation', () => {
  assert.match(read('index.html'), /<html lang="en"/);
  assert.match(read('pt/index.html'), /<html lang="pt-PT"/);
  assert.match(read('index.html'), /hreflang="pt-PT"/);
  assert.match(read('pt/index.html'), /hreflang="en"/);
});

test('the language switcher on an article goes to the translated article', () => {
  const [slug] = articlePages('');
  const page = read(`articles/${slug}/index.html`);
  const target = page.match(/<a href="([^"]+)"[^>]*hreflang="pt-PT"/)[1];
  assert.match(target, /^\/pt\/articles\/.+/);
  assert.ok(resolveLocal(target), `${target} does not exist`);
});

test('the landing page shows the most recent article', () => {
  const dates = [...read('articles/index.html').matchAll(/<time datetime="([\d-]+)"/g)].map((match) => match[1]);
  assert.ok(dates.length > 1);
  const newest = [...dates].sort().at(-1);
  assert.equal(dates[0], newest, 'the articles page should list newest first');
  assert.match(read('index.html'), new RegExp(`datetime="${newest}"`));
});

test('the articles page has a search box and the gallery has tag filters and a lightbox', () => {
  assert.match(read('articles/index.html'), /type="search"/);
  const gallery = read('gallery/index.html');
  assert.match(gallery, /data-tag="/);
  assert.match(gallery, /<dialog[^>]*data-lightbox/);
});

test('internal links and images all resolve', () => {
  const broken = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (url.startsWith('//') || resolveLocal(url)) continue;
      broken.push(`${path.relative(dist, file)} -> ${url}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('the published site does not depend on the CMS at runtime', () => {
  const cms = process.env.STRAPI_URL;
  if (!cms) return;
  for (const file of htmlFiles) {
    assert.ok(!readFileSync(file, 'utf8').includes(cms), `${file} refers to the CMS`);
  }
});

test('images are served in an optimised format', () => {
  const images = walk(path.join(dist, '_astro')).filter((file) => file.endsWith('.webp'));
  assert.ok(images.length > 10);
});
