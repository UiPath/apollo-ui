#!/bin/bash
# Publish to both npm and GitHub Package Registry.
#
# npm.org auth uses OIDC trusted publishing — the workflow job must declare
# `id-token: write` and the package must have UiPath/apollo-ui + this caller
# workflow configured as a Trusted Publisher on npmjs.com. pnpm 11 detects
# the OIDC env vars set by GitHub Actions and exchanges them for a publish
# token automatically. No long-lived npm token is required.
#
# GHP auth still uses a short-lived GitHub App installation token passed via
# GH_NPM_REGISTRY_TOKEN.
#
# Usage: ./scripts/publish-to-registries.sh [publish args...]

set -euo pipefail

# TAG_NAME is injected by semantic-release via publishCmd; validate it to prevent
# shell injection if the release channel value ever contains unexpected characters.
if [[ -n "${TAG_NAME:-}" ]] && [[ ! "$TAG_NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: invalid TAG_NAME '${TAG_NAME}' — must match ^[a-z0-9-]+\$" >&2
  exit 1
fi

if [ -z "${GH_NPM_REGISTRY_TOKEN:-}" ]; then
  echo "Error: GH_NPM_REGISTRY_TOKEN environment variable is required"
  exit 1
fi

# Strip any registry-override or --tag flags from caller args.
# Registry is fixed by this script; tag comes from TAG_NAME env var (validated above).
filtered_args=()
skip_next=false
for arg in "$@"; do
  if $skip_next; then
    skip_next=false
    continue
  fi
  if [[ "$arg" == --registry=* ]] || [[ "$arg" == --'@uipath:registry='* ]]; then
    echo "Warning: ignoring registry override arg '$arg' — registry is fixed by this script" >&2
    continue
  fi
  if [[ "$arg" == --registry ]]; then
    echo "Warning: ignoring --registry flag — registry is fixed by this script" >&2
    skip_next=true
    continue
  fi
  if [[ "$arg" == --tag=* ]]; then
    echo "Warning: ignoring --tag arg '$arg' — use TAG_NAME env var instead" >&2
    continue
  fi
  if [[ "$arg" == --tag ]]; then
    echo "Warning: ignoring --tag flag — use TAG_NAME env var instead" >&2
    skip_next=true
    continue
  fi
  filtered_args+=("$arg")
done

TAG="${TAG_NAME:-latest}"

PKG_NAME=$(node -p "require('./package.json').name")
PKG_VERSION=$(node -p "require('./package.json').version")

# Confirm the version is actually retrievable from npmjs.org.
#
# `pnpm publish` exits 0 in cases where nothing reached npmjs.org at all (see the
# OIDC note below), so the only trustworthy signal is asking the registry. Use the
# version document rather than the packument: for a brand-new package name the
# packument stays 404 for several minutes after the version endpoint is live.
verify_on_npmjs() {
  local url="https://registry.npmjs.org/${PKG_NAME//\//%2F}/${PKG_VERSION}"
  for _ in $(seq 1 18); do
    # 404s are expected while a fresh publish propagates; stay quiet until we give up
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      return 0
    fi
    sleep 10
  done
  return 1
}

echo "📦 Publishing to npm.org (OIDC trusted publisher)..."
# --provenance: binds artifact to GitHub Actions source via Sigstore. npmjs.org-only.
#
# The `--@uipath:registry` override only holds while OIDC succeeds. When the token
# exchange fails — which it does for any package with no Trusted Publisher on
# npmjs.com, and a new package cannot have one before it exists — pnpm logs
# "Skipped OIDC", silently falls back to the ambient registry (GHP), publishes
# there and still exits 0. That shipped @uipath/apollo-core@5.13.0 and
# @uipath/apollo-react@6.23.1 to npmjs.org depending on an @uipath/apollo-ui-icons
# that was never published there, breaking installs for every consumer. Treat the
# warning as fatal and verify the outcome.
npm_log=$(mktemp)
trap 'rm -f "$npm_log"' EXIT

pnpm publish "${filtered_args[@]}" --tag "$TAG" --provenance \
  --@uipath:registry=https://registry.npmjs.org 2>&1 | tee "$npm_log"

if grep -q "Skipped OIDC" "$npm_log"; then
  echo "::error::OIDC token exchange failed for ${PKG_NAME}, so pnpm did not publish to npmjs.org." >&2
  echo "Add a Trusted Publisher for ${PKG_NAME} on npmjs.com (UiPath/apollo-ui, workflow release.yml, no environment, action: npm publish)." >&2
  exit 1
fi

if ! verify_on_npmjs; then
  echo "::error::${PKG_NAME}@${PKG_VERSION} is not retrievable from npmjs.org after publishing." >&2
  echo "The publish reported success but the artifact is not there — check which registry it actually went to." >&2
  exit 1
fi

echo "✓ Published to npm.org (verified retrievable)"
echo ""
echo "📦 Publishing to GitHub Package Registry..."
NODE_AUTH_TOKEN="$GH_NPM_REGISTRY_TOKEN" \
  pnpm publish "${filtered_args[@]}" --tag "$TAG" \
    --@uipath:registry=https://npm.pkg.github.com

echo "✓ Published to GitHub Package Registry"
echo ""
echo "✓ Successfully published to both registries"
