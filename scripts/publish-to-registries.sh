#!/bin/bash
# Publish to both npm and GitHub Package Registry
# Usage: ./scripts/publish-to-registries.sh [publish args...]

set -euo pipefail

# TAG_NAME is injected by semantic-release via publishCmd; validate it to prevent
# shell injection if the release channel value ever contains unexpected characters.
if [[ -n "${TAG_NAME:-}" ]] && [[ ! "$TAG_NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: invalid TAG_NAME '${TAG_NAME}' — must match ^[a-z0-9-]+\$" >&2
  exit 1
fi

if [ -z "${NPM_AUTH_TOKEN:-}" ]; then
  echo "Error: NPM_AUTH_TOKEN environment variable is required"
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
  if [[ "$arg" == --'@uipath:registry='* ]]; then
    echo "Warning: ignoring registry override arg '$arg' — registry is fixed by this script" >&2
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

echo "📦 Publishing to npm..."
# --provenance links the build to its GitHub Actions source; requires id-token: write in the workflow.
# Only supported on registry.npmjs.org — GitHub Packages does not support npm provenance.
NPM_AUTH_TOKEN="$NPM_AUTH_TOKEN" \
  NODE_AUTH_TOKEN="$NPM_AUTH_TOKEN" \
  GH_NPM_REGISTRY_TOKEN="" \
  pnpm publish "${filtered_args[@]}" --tag "$TAG" --provenance --@uipath:registry=https://registry.npmjs.org

echo "✓ Published to npm"
echo ""
echo "📦 Publishing to GitHub Package Registry..."
NPM_AUTH_TOKEN="" \
  NPM_TOKEN="" \
  NODE_AUTH_TOKEN="$GH_NPM_REGISTRY_TOKEN" \
  pnpm publish "${filtered_args[@]}" --tag "$TAG" --@uipath:registry=https://npm.pkg.github.com

echo "✓ Published to GitHub Package Registry"
echo ""
echo "✓ Successfully published to both registries"
