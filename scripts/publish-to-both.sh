#!/bin/bash
# Publish to both npm and GitHub Package Registry
# Usage: ./scripts/publish-to-both.sh [publish args...]

set -e

if [ -z "$NPM_AUTH_TOKEN" ]; then
  echo "Error: NPM_AUTH_TOKEN environment variable is required"
  exit 1
fi

if [ -z "$GH_NPM_REGISTRY_TOKEN" ]; then
  echo "Error: GH_NPM_REGISTRY_TOKEN environment variable is required"
  exit 1
fi

PUBLISH_ARGS="$@"

echo "📦 Publishing to npm..."
NPM_AUTH_TOKEN="$NPM_AUTH_TOKEN" \
  NODE_AUTH_TOKEN="$NPM_AUTH_TOKEN" \
  pnpm publish $PUBLISH_ARGS --@uipath:registry=https://registry.npmjs.org

echo "✓ Published to npm"
echo ""
echo "📦 Publishing to GitHub Package Registry..."
NPM_AUTH_TOKEN="$GH_NPM_REGISTRY_TOKEN" \
  NODE_AUTH_TOKEN="$GH_NPM_REGISTRY_TOKEN" \
  pnpm publish $PUBLISH_ARGS --@uipath:registry=https://npm.pkg.github.com

echo "✓ Published to GitHub Package Registry"
echo ""
echo "✓ Successfully published to both registries"
