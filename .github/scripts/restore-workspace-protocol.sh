#!/bin/bash
set -e

echo "Restoring workspace:* protocol for internal dependencies..."

# Configure git
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Get list of all workspace packages (excluding root) using pnpm
# Extract package names from JSON output (skip first entry which is root)
internal_packages=$(pnpm -r list --depth -1 --json 2>/dev/null | \
  jq -r '.[1:] | .[] | .name')

echo "Detected internal packages:"
echo "$internal_packages"
echo ""

# Convert to array
mapfile -t packages <<< "$internal_packages"

for pkg in "${packages[@]}"; do
  # Skip empty lines
  [ -z "$pkg" ] && continue

  echo "Processing ${pkg}..."

  # Find all package.json files and restore workspace:* protocol
  find apps packages web-packages -name "package.json" -type f 2>/dev/null | while read -r file; do
    # Create a backup
    cp "$file" "$file.bak"

    # Replace versioned references with workspace:*
    # This uses a more precise regex to match semantic versions
    # Pattern: "package-name": "1.2.3" -> "package-name": "workspace:*"
    sed -i.tmp -E "s|\"${pkg}\": \"[0-9]+\.[0-9]+\.[0-9]+\"|\"${pkg}\": \"workspace:*\"|g" "$file"

    # Clean up temp file
    rm -f "$file.tmp"

    # Check if file was modified
    if ! cmp -s "$file" "$file.bak"; then
      echo "  ✓ Updated: $file"
    fi

    # Remove backup
    rm -f "$file.bak"
  done
done

# Check if there are any changes to commit
if [ -n "$(git status --porcelain)" ]; then
  echo ""
  echo "Changes detected. Committing..."
  git add apps/*/package.json packages/*/package.json web-packages/*/package.json 2>/dev/null || true
  git commit -m "chore: restore workspace:* protocol [skip ci]"
  git push
  echo "✓ Successfully restored workspace:* protocol and pushed changes."
else
  echo ""
  echo "✓ No changes needed - workspace:* protocol already in place."
fi
