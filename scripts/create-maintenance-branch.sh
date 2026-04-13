#!/bin/bash
# Create a maintenance branch for an older major version of a package.
#
# Usage: scripts/create-maintenance-branch.sh <package-name> <major-version>
# Example: scripts/create-maintenance-branch.sh apollo-react 3
#
# This script:
#   1. Finds the latest git tag for @uipath/<package>@<major>.*
#   2. Creates release/<package>@<major>.x branch from that tag
#   3. Updates the package's .releaserc.json with maintenance branch config
#   4. Commits the config change
#   5. Prints next steps (push, update main's .releaserc.json)

set -euo pipefail

PACKAGE="${1:?Usage: $0 <package-name> <major-version>}"
MAJOR="${2:?Usage: $0 <package-name> <major-version>}"

if ! [[ "$MAJOR" =~ ^[0-9]+$ ]]; then
  echo "Error: major version must be a number, got '$MAJOR'"
  exit 1
fi

TAG_PATTERN="@uipath/${PACKAGE}@${MAJOR}.*"
BRANCH="release/${PACKAGE}@${MAJOR}.x"
CHANNEL="release-${MAJOR}.x"

# Find package directory
if [ -d "packages/${PACKAGE}" ]; then
  RELEASERC="packages/${PACKAGE}/.releaserc.json"
elif [ -d "web-packages/${PACKAGE}" ]; then
  RELEASERC="web-packages/${PACKAGE}/.releaserc.json"
else
  echo "Error: package '${PACKAGE}' not found in packages/ or web-packages/"
  exit 1
fi

if [ ! -f "${RELEASERC}" ]; then
  echo "Error: release config '${RELEASERC}' not found for package '${PACKAGE}'"
  exit 1
fi

# Find latest tag for this major version
LATEST_TAG=$(git tag --list "${TAG_PATTERN}" --sort=-version:refname | head -1)

if [ -z "$LATEST_TAG" ]; then
  echo "Error: no tags found matching '${TAG_PATTERN}'"
  echo ""
  echo "Available tags for @uipath/${PACKAGE}:"
  git tag --list "@uipath/${PACKAGE}@*" --sort=-version:refname | head -5
  exit 1
fi

echo "Latest tag: ${LATEST_TAG}"
echo "Branch:     ${BRANCH}"
echo "Channel:    ${CHANNEL}"
echo ""

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH}" 2>/dev/null || \
   git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}" 2>/dev/null; then
  echo "Error: branch '${BRANCH}' already exists"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is required. Please install jq using your package manager (e.g. 'brew install jq' on macOS) and try again."
  exit 1
fi

# Create branch from tag
git checkout -b "${BRANCH}" "${LATEST_TAG}"

# Update .releaserc.json — insert the maintenance branch entry immediately before
# "main", preserving order of all existing branches (other maintenance branches,
# prereleases that come after main, etc.). If an entry for this branch already
# exists, it's replaced in place.
jq --arg name "${BRANCH}" \
   --arg range "${MAJOR}.x" \
   --arg channel "${CHANNEL}" \
   '
   .branches as $existing
   | { name: $name, range: $range, channel: $channel } as $entry
   | ($existing | map((type == "object" and .name == $name) or . == $name) | index(true)) as $existing_idx
   | ($existing | map((type == "object" and .name == "main") or . == "main") | index(true)) as $main_idx
   | if $existing_idx != null then
       .branches = ($existing | .[0:$existing_idx] + [$entry] + .[$existing_idx+1:])
     elif $main_idx != null then
       .branches = ($existing | .[0:$main_idx] + [$entry] + .[$main_idx:])
     else
       .branches = ($existing + [$entry])
     end
   ' \
   "${RELEASERC}" > "${RELEASERC}.tmp" && mv "${RELEASERC}.tmp" "${RELEASERC}"

echo "✓ Updated ${RELEASERC}"
echo ""

# Commit the change
git add "${RELEASERC}"
git commit -m "ci(${PACKAGE}): configure maintenance branch for ${MAJOR}.x [skip ci]"

echo ""
echo "✓ Branch '${BRANCH}' created and configured"
echo ""
echo "Next steps:"
echo ""
echo "  1. Push the branch:"
echo "     git push -u origin '${BRANCH}'"
echo ""
echo "  2. On main, update ${RELEASERC} to add this entry"
echo "     BEFORE \"main\" in the branches array:"
echo ""
echo "     {\"name\": \"${BRANCH}\", \"range\": \"${MAJOR}.x\", \"channel\": \"${CHANNEL}\"}"
echo ""
echo "  Example .releaserc.json branches on main:"
echo "     \"branches\": ["
echo "       {\"name\": \"${BRANCH}\", \"range\": \"${MAJOR}.x\", \"channel\": \"${CHANNEL}\"},"
echo "       \"main\""
echo "     ]"
