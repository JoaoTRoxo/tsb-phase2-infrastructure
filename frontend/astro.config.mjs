import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// The build downloads and optimises every image from the CMS, so the published site
// is self-contained and keeps working when the CMS is down.
const cms = process.env.STRAPI_URL ? new URL(process.env.STRAPI_URL) : undefined;

export default defineConfig({
  site: process.env.SITE_URL || 'https://tsb-travel-blog.pages.dev',
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
  image: {
    remotePatterns: cms
      ? [{ protocol: cms.protocol.slice(0, -1), hostname: cms.hostname, ...(cms.port ? { port: cms.port } : {}) }]
      : [],
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', pt: 'pt-PT' } } })],
  vite: {
    plugins: [tailwindcss()],
    // The demo content and artwork are shared with the backend's seed folder.
    server: { fs: { allow: ['..'] } },
  },
});
