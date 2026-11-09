// Behaviour the project statement requires of the backend: who can do what, what
// the public can see, and that publishing triggers a rebuild of the site.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { client, pngForm, startFakeGitHub, startStrapi } from './helpers.mjs';

const ARTICLES = '/content-manager/collection-types/api::article.article';
const GALLERY = '/content-manager/collection-types/api::gallery-image.gallery-image';
const AUTHORS = '/content-manager/collection-types/api::author.author';
const PASSWORD = 'Test-password-1';
const DEBOUNCE_SECONDS = 2;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let github;
let strapi;
let admin;
let anonymous;
const people = {};
let imageId;

/** Admin-API tokens are named `token` or `accessToken` depending on the route. */
const tokenOf = (response) => response.body.data.token ?? response.body.data.accessToken;

async function createPerson(name, roleId) {
  const created = await admin.post('/admin/users', {
    firstname: name,
    lastname: 'Test',
    email: `${name}@example.com`,
    roles: [roleId],
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const registered = await anonymous.post('/admin/register', {
    registrationToken: created.body.data.registrationToken,
    userInfo: { firstname: name, lastname: 'Test', password: PASSWORD },
  });
  assert.equal(registered.status, 200, JSON.stringify(registered.body));
  return client(strapi.base, tokenOf(registered));
}

const articleData = (title) => ({
  title,
  slug: title.toLowerCase().replaceAll(' ', '-'),
  excerpt: 'An excerpt',
  body: [{ type: 'paragraph', children: [{ type: 'text', text: 'Some text' }] }],
  cover: imageId,
  date: '2026-01-15',
});

const newArticle = async (who, title) => {
  const response = await who.post(`${ARTICLES}?locale=en`, articleData(title));
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.data.documentId;
};

const publish = (who, base, id) => who.post(`${base}/${id}/actions/publish?locale=en`);

before(async () => {
  github = await startFakeGitHub();
  strapi = await startStrapi({ port: 13370, githubPort: github.port, debounceSeconds: DEBOUNCE_SECONDS });
  anonymous = client(strapi.base);

  const registered = await anonymous.post('/admin/register-admin', {
    email: 'admin@example.com',
    firstname: 'Admin',
    lastname: 'Test',
    password: PASSWORD,
  });
  assert.equal(registered.status, 200, JSON.stringify(registered.body));
  admin = client(strapi.base, tokenOf(registered));

  const roles = (await admin.get('/admin/roles')).body.data;
  const id = (code) => roles.find((role) => role.code === code).id;
  people.writer = await createPerson('writer', id('tsb-writer'));
  people.otherWriter = await createPerson('otherwriter', id('tsb-writer'));
  people.traveller = await createPerson('traveller', id('tsb-traveller'));
  people.otherTraveller = await createPerson('othertraveller', id('tsb-traveller'));
  people.moderator = await createPerson('moderator', id('tsb-moderator'));

  const uploaded = await admin.upload(pngForm('cover.png'));
  assert.equal(uploaded.status, 201, JSON.stringify(uploaded.body));
  imageId = uploaded.body[0].id;
});

after(() => {
  strapi?.stop();
  github?.close();
});

test('the four required roles exist, and the sample roles are gone', async () => {
  const roles = (await admin.get('/admin/roles')).body.data.map((role) => role.name).sort();
  assert.deepEqual(roles, ['Admin', 'Moderator', 'Traveller', 'Writer']);
});

test('both locales exist', async () => {
  const locales = (await admin.get('/i18n/locales')).body.map((locale) => locale.code).sort();
  assert.deepEqual(locales, ['en', 'pt']);
});

test('a writer can publish, edit and delete their own article', async () => {
  const id = await newArticle(people.writer, 'Writer own article');
  assert.equal((await publish(people.writer, ARTICLES, id)).status, 200);
  const updated = await people.writer.put(`${ARTICLES}/${id}?locale=en`, { title: 'Edited title' });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal((await people.writer.delete(`${ARTICLES}/${id}?locale=en`)).status, 200);
});

test("a writer cannot see or change someone else's article", async () => {
  const id = await newArticle(people.writer, 'Private to the writer');
  const other = people.otherWriter;
  assert.equal((await other.get(`${ARTICLES}/${id}?locale=en`)).status, 403);
  assert.equal((await other.put(`${ARTICLES}/${id}?locale=en`, { title: 'Hijacked' })).status, 403);
  assert.equal((await other.delete(`${ARTICLES}/${id}?locale=en`)).status, 403);
  assert.equal((await publish(other, ARTICLES, id)).status, 403);
  const listed = (await other.get(`${ARTICLES}?locale=en`)).body.results.map((entry) => entry.documentId);
  assert.ok(!listed.includes(id));
});

test('a writer cannot publish to the gallery', async () => {
  const response = await people.writer.post(`${GALLERY}?locale=en`, { title: 'Not allowed', image: imageId });
  assert.equal(response.status, 403);
});

test('a traveller can publish articles and gallery images, and manage only their own', async () => {
  const article = await newArticle(people.traveller, 'Traveller article');
  assert.equal((await publish(people.traveller, ARTICLES, article)).status, 200);

  const image = await people.traveller.post(`${GALLERY}?locale=en`, { title: 'A view', image: imageId });
  assert.equal(image.status, 201, JSON.stringify(image.body));
  const id = image.body.data.documentId;
  assert.equal((await publish(people.traveller, GALLERY, id)).status, 200);

  assert.equal((await people.otherTraveller.put(`${GALLERY}/${id}?locale=en`, { title: 'Hijacked' })).status, 403);
  assert.equal((await people.otherTraveller.delete(`${GALLERY}/${id}?locale=en`)).status, 403);
});

test("a moderator can manage anyone's content", async () => {
  const id = await newArticle(people.writer, 'Needs moderating');
  assert.equal((await publish(people.moderator, ARTICLES, id)).status, 200);
  const updated = await people.moderator.put(`${ARTICLES}/${id}?locale=en`, { title: 'Moderated' });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal((await people.moderator.post(`${ARTICLES}/${id}/actions/unpublish?locale=en`)).status, 200);
  assert.equal((await people.moderator.delete(`${ARTICLES}/${id}?locale=en`)).status, 200);
});

test('a moderator cannot reach the backend configuration', async () => {
  for (const url of ['/admin/users', '/admin/roles', '/admin/api-tokens', '/admin/webhooks']) {
    assert.equal((await people.moderator.get(url)).status, 403, url);
  }
});

test('writers and travellers cannot edit the team', async () => {
  for (const who of [people.writer, people.traveller]) {
    const response = await who.post(AUTHORS, { name: 'Impostor', role: 'x', bio: 'x' });
    assert.equal(response.status, 403);
  }
});

test('an admin can manage the backend configuration', async () => {
  for (const url of ['/admin/users', '/admin/roles', '/admin/api-tokens', '/admin/webhooks']) {
    assert.equal((await admin.get(url)).status, 200, url);
  }
});

test('the public API serves published content and hides drafts', async () => {
  const draft = await newArticle(people.writer, 'Still a draft');
  const published = await newArticle(people.writer, 'Out in the open');
  assert.equal((await publish(people.writer, ARTICLES, published)).status, 200);

  const response = await anonymous.get('/api/articles?locale=en&pagination[pageSize]=100');
  assert.equal(response.status, 200);
  const ids = response.body.data.map((entry) => entry.documentId);
  assert.ok(ids.includes(published));
  assert.ok(!ids.includes(draft));
});

test('the public API is read-only and has no sign-up', async () => {
  assert.notEqual((await anonymous.post('/api/articles', { data: { title: 'Spam' } })).status, 201);
  const signUp = await anonymous.post('/api/auth/local/register', {
    username: 'spammer',
    email: 'spam@example.com',
    password: PASSWORD,
  });
  assert.notEqual(signUp.status, 200);
});

test('publishing requests one rebuild per batch, and saving a draft requests none', async () => {
  // Let anything from the earlier tests drain first.
  await sleep((DEBOUNCE_SECONDS + 1) * 1000);
  github.requests.length = 0;

  const draft = await newArticle(people.writer, 'Only a draft save');
  await people.writer.put(`${ARTICLES}/${draft}?locale=en`, { title: 'Draft edited' });
  await sleep((DEBOUNCE_SECONDS + 1) * 1000);
  assert.equal(github.requests.length, 0, 'a draft must not rebuild the site');

  for (const title of ['Batch one', 'Batch two', 'Batch three']) {
    const id = await newArticle(people.writer, title);
    assert.equal((await publish(people.writer, ARTICLES, id)).status, 200);
  }
  await sleep((DEBOUNCE_SECONDS + 1) * 1000);

  assert.equal(github.requests.length, 1, 'three publications should share one rebuild');
  assert.deepEqual(github.requests[0], {
    url: '/repos/owner/site/dispatches',
    authorization: 'Bearer test-token',
    body: { event_type: 'content-updated' },
  });
});
