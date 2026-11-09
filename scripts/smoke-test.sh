#!/usr/bin/env bash
# Start a backend image with throwaway secrets, and check that it comes up healthy,
# serves the admin panel and answers on the public API.
#   scripts/smoke-test.sh <image>
set -euo pipefail

image=${1:?usage: smoke-test.sh <image>}
name=backend-smoke-$$
secret() { head -c 16 /dev/urandom | base64; }

cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then docker logs "$name" 2>&1 | tail -40; fi
  docker rm -f "$name" >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

docker run -d --name "$name" -p 127.0.0.1:13371:1337 \
  -e APP_KEYS="$(secret),$(secret)" \
  -e API_TOKEN_SALT="$(secret)" \
  -e ADMIN_JWT_SECRET="$(secret)" \
  -e TRANSFER_TOKEN_SALT="$(secret)" \
  -e JWT_SECRET="$(secret)" \
  -e ENCRYPTION_KEY="$(secret)" \
  "$image" >/dev/null

echo "Waiting for the container to report healthy..."
for _ in $(seq 1 90); do
  state=$(docker inspect -f '{{.State.Health.Status}}' "$name")
  [ "$state" = healthy ] && break
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || { echo "The container exited"; exit 1; }
  curl -fs -o /dev/null http://127.0.0.1:13371/_health && break
  sleep 2
done

curl -fs -o /dev/null http://127.0.0.1:13371/_health
curl -fs http://127.0.0.1:13371/admin | grep -q '<div id="strapi"' || curl -fs http://127.0.0.1:13371/admin | grep -qi strapi
curl -fs 'http://127.0.0.1:13371/api/articles?locale=en' | grep -q '"data"'
echo "The image is healthy."
