# Strapi backend. Runs on any Linux server with Docker.
#
# All state lives in /app/data (SQLite file, when used) and /app/public/uploads
# (media). Both must be mounted as volumes or they are lost with the container.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV STRAPI_TELEMETRY_DISABLED=true
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN NODE_ENV=production npm run build
# Keep only what is needed at runtime. seed/ and scripts/ stay, so that a fresh
# server can be filled with the demo content.
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=true \
    DATABASE_FILENAME=/app/data/data.db
COPY --from=build --chown=node:node /app ./
RUN mkdir -p data public/uploads && chown -R node:node data public/uploads
USER node
VOLUME ["/app/data", "/app/public/uploads"]
EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:1337/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
