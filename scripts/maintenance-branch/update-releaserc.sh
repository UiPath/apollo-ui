#!/bin/bash
# Add (or replace) a maintenance-branch entry in a single .releaserc.json's
# "branches" array, immediately before "main".
#
# Usage:
#   scripts/maintenance-branch/update-releaserc.sh <releaserc-path> <branch-name> <major>
#
# Example:
#   scripts/maintenance-branch/update-releaserc.sh \
#     packages/apollo-react/.releaserc.json support/apollo-react@3.x 3
#
# - Inserts {"name": <branch>, "range": "<major>.x", "channel": "latest-v<major>"}
#   immediately before the "main" entry. Preserves order of all other entries.
# - Idempotent: if an entry with the same name already exists, it is replaced
#   in place.
# - If no "main" entry exists, the new entry is appended.

set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <releaserc-path> <branch-name> <major>" >&2
  exit 1
fi

RELEASERC="$1"
BRANCH="$2"
MAJOR="$3"

if ! [[ "$MAJOR" =~ ^[0-9]+$ ]]; then
  echo "Error: major must be a number, got '$MAJOR'" >&2
  exit 1
fi

if [ ! -f "$RELEASERC" ]; then
  echo "Error: '$RELEASERC' not found" >&2
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is required" >&2
  exit 1
fi

CHANNEL="latest-v${MAJOR}"

jq --arg name "$BRANCH" --arg range "${MAJOR}.x" --arg channel "$CHANNEL" '
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
' "$RELEASERC" > "$RELEASERC.tmp" && mv "$RELEASERC.tmp" "$RELEASERC"
