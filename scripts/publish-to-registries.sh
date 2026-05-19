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

echo "📦 Publishing to npm (OIDC trusted publisher)..."
# --provenance links the build to its GitHub Actions source; required+verified by npm trusted publishing.
# Only supported on registry.npmjs.org — GitHub Packages does not support npm provenance.
# --registry= is the global flag; in pnpm 11 `--@scope:registry=` is silently
# ignored when scope-targeted registries are routed via this flag at publish time.
pnpm publish "${filtered_args[@]}" --tag "$TAG" --provenance --registry=https://registry.npmjs.org

echo "✓ Published to npm"
echo ""
echo "📦 Publishing to GitHub Package Registry..."
NODE_AUTH_TOKEN="$GH_NPM_REGISTRY_TOKEN" \
  pnpm publish "${filtered_args[@]}" --tag "$TAG" --registry=https://npm.pkg.github.com

echo "✓ Published to GitHub Package Registry"
echo ""
echo "✓ Successfully published to both registries"
