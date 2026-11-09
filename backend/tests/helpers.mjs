// Starts a real Strapi on a throwaway database, next to a fake GitHub API, so the
// tests exercise the same HTTP surface that the admin panel and the site build use.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

const secret = () => randomBytes(16).toString('base64');

export async function startFakeGitHub() {
  const requests = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      requests.push({ url: request.url, authorization: request.headers.authorization, body: JSON.parse(body) });
      response.writeHead(204).end();
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { requests, port: server.address().port, close: () => server.close() };
}

export async function startStrapi({ port, githubPort, debounceSeconds }) {
  const directory = mkdtempSync(path.join(tmpdir(), 'strapi-test-'));
  const child = spawn('npx', ['strapi', 'start'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      APP_KEYS: `${secret()},${secret()}`,
      API_TOKEN_SALT: secret(),
      ADMIN_JWT_SECRET: secret(),
      TRANSFER_TOKEN_SALT: secret(),
      JWT_SECRET: secret(),
      ENCRYPTION_KEY: secret(),
      DATABASE_CLIENT: 'sqlite',
      DATABASE_FILENAME: path.join(directory, 'test.db'),
      GITHUB_API_URL: `http://127.0.0.1:${githubPort}`,
      GITHUB_DISPATCH_REPO: 'owner/site',
      GITHUB_DISPATCH_TOKEN: 'test-token',
      REBUILD_DEBOUNCE_SECONDS: String(debounceSeconds),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let log = '';
  child.stdout.on('data', (chunk) => (log += chunk));
  child.stderr.on('data', (chunk) => (log += chunk));

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 120_000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`Strapi exited during startup:\n${log}`);
    if (Date.now() > deadline) throw new Error(`Strapi did not start in time:\n${log}`);
    try {
      if ((await fetch(`${base}/_health`)).ok) break;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return {
    base,
    log: () => log,
    stop() {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        // Already gone.
      }
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

/** A small client for the admin API, authenticated as one person. */
export function client(base, token) {
  const request = async (method, url, body, form) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + url, { method, headers, body: form ?? (body && JSON.stringify(body)) });
    const text = await response.text();
    const isJson = response.headers.get('content-type')?.includes('json');
    return { status: response.status, body: isJson ? JSON.parse(text) : text };
  };
  return {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body ?? {}),
    put: (url, body) => request('PUT', url, body),
    delete: (url) => request('DELETE', url),
    upload: (form) => request('POST', '/upload', undefined, form),
  };
}

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export function pngForm(name) {
  const form = new FormData();
  form.append('files', new Blob([TINY_PNG], { type: 'image/png' }), name);
  return form;
}
