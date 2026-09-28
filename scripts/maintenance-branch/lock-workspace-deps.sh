#!/bin/bash
# Lock workspace dependencies in a single package.json to concrete versions,
# sourced from sibling packages' version field.
#
# Usage:
#   scripts/maintenance-branch/lock-workspace-deps.sh <package-json-path> [--operator=^|~|=]
#
# Behavior (default operator: = → exact pin):
#   workspace:*      → <version>          (or <operator><version> with --operator)
#   workspace:^      → <version>          (or <operator><version> with --operator)
#   workspace:~      → <version>          (or <operator><version> with --operator)
#   workspace:X.Y.Z  → X.Y.Z             (explicit version, workspace: prefix dropped)
#
# - Reads sibling versions from packages/*/package.json and web-packages/*/package.json.
#   (apps/* are intentionally excluded — they are not published.)
# - Idempotent: running on an already-locked file is a no-op.
# - Skips dependency sections that don't exist (no "peerDependencies": null artifact).
# - Errors with exit code 1 if a workspace dep references a package not in the workspace.
#
# Must be run from the repo root.

set -euo pipefail

PACKAGE_JSON=""
OPERATOR="="

for arg in "$@"; do
  case "$arg" in
    --operator=*)
      OPERATOR="${arg#--operator=}"
      ;;
    --*)
      echo "Error: unknown option '$arg'" >&2
      exit 1
      ;;
    *)
      if [ -z "$PACKAGE_JSON" ]; then
        PACKAGE_JSON="$arg"
      else
        echo "Error: unexpected positional argument '$arg'" >&2
        exit 1
      fi
      ;;
  esac
done

if [ -z "$PACKAGE_JSON" ]; then
  echo "Usage: $0 <package-json-path> [--operator=^|~|=]" >&2
  exit 1
fi

case "$OPERATOR" in
  "^"|"~"|"=") ;;
  *)
    echo "Error: --operator must be one of: ^ ~ = (got '$OPERATOR')" >&2
    exit 1
    ;;
esac

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "Error: '$PACKAGE_JSON' not found" >&2
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is required" >&2
  exit 1
fi

# Build a JSON map of { "@uipath/foo": "1.2.3", ... } from all publishable
# workspace packages. apps/* are excluded.
SIBLING_VERSIONS=$(jq -s '
  reduce .[] as $pkg ({}; .[$pkg.name] = $pkg.version)
' packages/*/package.json web-packages/*/package.json)

jq --argjson siblings "$SIBLING_VERSIONS" --arg defaultOp "$OPERATOR" '
  def lock_deps:
    if . == null then null
    else
      with_entries(
        if (.value | type) == "string" and (.value | startswith("workspace:")) then
          .key as $name
          | (.value | sub("^workspace:"; "")) as $spec
          | ($siblings[$name]) as $version
          | if $version == null then
              error("workspace dep \($name) has no resolvable version in workspace")
            else
              .value = (
                if $spec == "*" or $spec == "^" or $spec == "~" then
                  (if $defaultOp == "=" then $version else "\($defaultOp)\($version)" end)
                else $spec
                end
              )
            end
        else . end
      )
    end;
    (if has("dependencies")     then .dependencies     |= lock_deps else . end)
  | (if has("devDependencies")  then .devDependencies  |= lock_deps else . end)
  | (if has("peerDependencies") then .peerDependencies |= lock_deps else . end)
' "$PACKAGE_JSON" > "$PACKAGE_JSON.tmp" && mv "$PACKAGE_JSON.tmp" "$PACKAGE_JSON"
