import type { Core } from '@strapi/strapi';

/** Content that only reaches the site once published. */
const PUBLISHED_TYPES = new Set(['api::article.article', 'api::gallery-image.gallery-image']);
/** Content that has no draft state and is live as soon as it is saved. */
const DIRECT_TYPES = new Set(['api::author.author', 'api::tag.tag']);

const PUBLISHED_EVENTS = ['entry.publish', 'entry.unpublish', 'entry.delete'];
const DIRECT_EVENTS = ['entry.create', 'entry.update', 'entry.delete'];
const MEDIA_EVENTS = ['media.update', 'media.delete'];

/** Whether an event changes anything visible on the public site. */
export function changesPublicSite(event: string, uid: string | undefined) {
  if (MEDIA_EVENTS.includes(event)) return true;
  if (uid && PUBLISHED_TYPES.has(uid)) return PUBLISHED_EVENTS.includes(event);
  if (uid && DIRECT_TYPES.has(uid)) return DIRECT_EVENTS.includes(event);
  return false;
}

/**
 * Ask GitHub Actions to rebuild and redeploy the site when content changes.
 *
 * Strapi's built-in webhooks cannot do this, because their body is fixed and the
 * GitHub dispatch API needs `{"event_type": ...}`. Requests are also batched: the
 * first change starts a window and everything else inside it joins the same
 * rebuild, so publishing ten articles costs one deployment rather than ten.
 */
export function startRebuildNotifier(strapi: Core.Strapi) {
  const repository = process.env.GITHUB_DISPATCH_REPO;
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!repository || !token) {
    strapi.log.warn('GITHUB_DISPATCH_REPO or GITHUB_DISPATCH_TOKEN is not set: publishing will not rebuild the site');
    return;
  }

  const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  const windowMs = Number(process.env.REBUILD_DEBOUNCE_SECONDS ?? 60) * 1000;
  const url = `${api}/repos/${repository}/dispatches`;
  let timer: NodeJS.Timeout | undefined;

  const send = async (attemptsLeft: number) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_type: 'content-updated' }),
      });
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      strapi.log.info('Requested a site rebuild');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (attemptsLeft > 0) {
        strapi.log.warn(`Site rebuild request failed (${reason}), retrying`);
        setTimeout(() => void send(attemptsLeft - 1), 30_000);
      } else {
        strapi.log.error(`Site rebuild request failed (${reason}), giving up until the next change`);
      }
    }
  };

  const onEvent = (event: string) => async (payload: { uid?: string }) => {
    if (timer || !changesPublicSite(event, payload?.uid)) return;
    timer = setTimeout(() => {
      timer = undefined;
      void send(3);
    }, windowMs);
  };

  for (const event of new Set([...PUBLISHED_EVENTS, ...DIRECT_EVENTS, ...MEDIA_EVENTS])) {
    strapi.eventHub.on(event, onEvent(event));
  }
  strapi.log.info(`Publishing will rebuild the site through ${repository}`);
}
