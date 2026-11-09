# Project report

This report explains why the project is built the way it is, what each choice costs, what is
missing, and what would come next. The instructions for running it are in the
[README](README.md).

## The main idea

Writers need to publish without code, and visitors should get a fast static site. The two sides
are connected in only one direction: the site reads the CMS while it is being built, and never
afterwards. That choice explains most of what follows. A visitor's request never touches the
CMS, so the CMS can be slow, restarted or offline without the public site noticing.

## Repository

**One repository**, as the statement prefers. A change to a content type and the page that shows
it land in one pull request, and the demo content can be shared between both sides.

The workflows do not use path filters, although that means a backend-only change also rebuilds
the frontend. GitHub keeps a required check waiting forever if a path filter skips it, which would
block merging. A few wasted minutes of CI is the cheaper problem.

## Backend

### Why Strapi

It is what the statement recommends, and it covers the difficult requirements in the free
edition: custom roles, an ownership condition ("is the creator of this entry"), drafts and
per-language content. The alternatives considered were Payload and Directus. Payload is pleasant
but is built around Next.js, which adds an application framework the project does not otherwise
need. Directus has a strong permissions model, but its licence and data-first approach make it a
less natural fit for writers.

The costs are real. The production image is 829 MB, the admin panel takes a noticeable time to
build, and most configuration is designed to be done by clicking.

### Roles as code

Clicked configuration is the weak point of a CMS: it is not reviewed, and it is lost on a new
server. So `backend/src/bootstrap/roles.ts` creates the Writer, Traveller and Moderator roles on
every start, and Strapi's built-in Super Admin, renamed Admin, covers the fourth. A fresh server
is correct with no manual steps, and permissions are reviewed like any other code.

The cost is that changes to those three roles in the admin panel are reverted at the next restart.
Roles added in the panel are left alone.

"Their own content" uses Strapi's `admin::is-creator` condition, which means the person who created
the entry. If a Moderator creates an article on someone's behalf, that writer will not be able to
edit it. That was acceptable here, but a real newsroom would likely need an owner field.

Because getting permissions wrong fails silently, `backend/tests` starts a real server and tries
the forbidden actions over HTTP: a writer editing another writer's article, a writer posting to
the gallery, a moderator opening the user list, and so on.

### Content model and languages

Articles and gallery images are Strapi localised documents. Text is per language, while the cover,
date and place are shared and only set once.

Tags and team members are deliberately not localised documents. They use plain second fields such
as `namePt`. Relations between two localised types have to be set again for every language, which
is exactly the repetitive work non-technical writers should be spared. The cost is that a third
language would need a schema change for those two types.

Article bodies use Strapi's Blocks editor rather than Markdown, because the statement asks for no
code. It stores structured JSON, so the site renders it with a small component. Text passes through
Astro's escaping and links are limited to safe protocols, so no HTML sanitiser is needed.

### Reading the content

The public API is open for reading published content. The alternative was a read-only token in CI,
but it would protect nothing, since this content is public by definition, and would be one more
secret to manage. Write routes are not registered at all, public sign-up is off, and tests confirm
drafts never appear.

### Rebuilds when content changes

Strapi's built-in webhooks were the first option, but they send a fixed body, while GitHub's
dispatch API requires `{"event_type": ...}`. Cloudflare deploy hooks do accept an empty request,
but they only exist for projects built by Cloudflare from Git, which would move the build and its
tests out of the pipeline. So `backend/src/bootstrap/rebuild.ts` subscribes to Strapi's internal
events and calls GitHub directly.

- Only changes that alter the public site trigger it. Saving a draft does not.
- Changes are batched: the first starts a 60-second window, and publishing ten articles costs one
  deployment.
- A failed request is retried three times. If a build fails, the previous version stays online.

### Running it

The image is a multi-stage build that runs as a non-root user and has a health check. All state is
on volumes, and the persistence warning in the statement was tested directly: content, uploads and
logins survive deleting and recreating the containers.

Production uses Postgres, for concurrent writers and ordinary backups. SQLite stays for development
and the tests, where having no second service matters more. The same image handles both.

## Frontend

Astro and Tailwind were required. Beyond that, the guiding principle was to add as little as
possible. There is no UI framework, and the only JavaScript is two small files for search and the
gallery. Both only hide things, so with JavaScript off every article and picture is still there.

- **"It should enlarge."** Both enlargements are real morphs, using the View Transitions API: an
  article card grows into the article, and a thumbnail grows into the lightbox. Where the browser
  does not support them, the page simply changes.
- **Images.** Every image is downloaded and converted to responsive WebP during the build, so the
  site has no runtime dependency on the CMS. A test checks that the built pages never mention it.
  The cost is that build time grows with the number of images, and the CMS must be reachable from
  GitHub while a build runs.
- **Pull requests use demo content.** They need no CMS and no secrets, and cannot leak unpublished
  work. A single dataset, `backend/seed`, serves as both the CMS seed and this fixture.
- **A CMS failure fails the build.** Publishing a half-empty site would be worse than a stale one.
- **Search** is client-side with a small inline index, ignoring accents, so "sao miguel" finds
  "São Miguel". For a few dozen articles, this needs no extra tooling. At hundreds, Pagefind would
  be the right replacement.
- **Internationalisation** uses Astro's built-in routing, with English at the root and Portuguese
  under `/pt`. Slugs are per language, so the language switcher goes straight to the translated
  article by following the CMS's document ID.

Additions beyond the statement: light and dark themes, RSS per language, a sitemap, reading time, a
scroll progress bar, keyboard control of the lightbox, shareable filter URLs, a skip link and
support for reduced motion. The demo artwork is generated by `backend/seed/generate-images.mjs`, so
it has no licensing issues.

## Testing

| Layer | What is checked |
| --- | --- |
| Backend, 13 tests | Permissions for each role against a live server, public API, draft privacy, rebuild batching |
| Frontend, 9 tests | Every page in both languages, translated links, latest article first, broken links, no CMS dependency |
| Backend image | The real container starts, reports healthy, and serves the admin panel and API |
| Types | `astro check` on the site and the TypeScript build on the backend |

## Status at the time of writing, and what is missing

The whole system has been run locally: the production image with Postgres, a site built from that
CMS, and the rebuild request sent to a stand-in for GitHub's API. The workflows pass `actionlint`
and each of their steps has been run by hand.

**What had not yet happened is a live run of the three external steps**: pushing the image to the
registry, deploying to Cloudflare Pages, and a real GitHub dispatch. They need accounts and
credentials, and are described step by step in the README.

Known limits:

- There are no preview deployments for pull requests.
- Enforcing checks before merging needs a public repository or a paid GitHub plan.
- Uploads live on the server's disk. Object storage would be better for more than one server.
- Inviting a user relies on the Admin sharing the registration link, as no email is configured.
- The backend is updated by running a command on the server, rather than automatically.

## Future work

In rough order of value:

1. Automatic backend deployment on a new image, and scheduled backups of both volumes.
2. Preview deployments of pull requests, built from the CMS's draft content.
3. An "owner" field, so that a Moderator can hand an article over to a writer.
4. A page per place, with a map of the trips, using the location already stored.
5. Showing writers the state of the last rebuild inside the admin panel.
6. Pagefind for search once there are enough articles to need it.

AI assistance was used throughout this project, including for writing the code and this report.
