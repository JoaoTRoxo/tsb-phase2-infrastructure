#!/usr/bin/env bash
# Require the pipelines to pass before a pull request can merge into main. GitHub
# only enforces this on public repositories, unless the account has a paid plan.
#   scripts/protect-main.sh owner/repository
set -euo pipefail

repository=${1:?usage: protect-main.sh owner/repository}
gh api -X PUT "repos/$repository/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["frontend-build", "backend-test", "backend-image"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
echo "Pull requests into main must now pass the pipelines."
