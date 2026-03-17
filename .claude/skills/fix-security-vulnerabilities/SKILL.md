---
name: fix-security-vulnerabilities
description: Use when fixing npm/pnpm security vulnerabilities, Dependabot alerts, or audit failures - requires systematic dependency tracing and exhaustive update checking before using overrides
---

# Fix Security Vulnerabilities

## Overview

**Security vulnerability fixing is detective work, not quick fixes.** Most vulnerabilities come from deep transitive dependencies that CAN be fixed by updating parent packages - if you trace far enough and check thoroughly enough.

**Core principle:** Overrides are a LAST RESORT, not a first response. Every vulnerability requires exhaustive investigation before concluding "no fix available."

## When to Use This Skill

Use when:
- `pnpm audit` or `npm audit` reports vulnerabilities
- Dependabot creates security alerts
- CI security scans fail
- User asks to "fix security issues" or "make audit pass"

Do NOT use for:
- Feature updates (use normal dependency management)
- Peer dependency warnings (different process)
- Deprecation notices (not security issues)

## The Systematic Process

**NEVER skip steps. Each step exists because agents skip it under pressure.**

```mermaid
flowchart TD
    A["Run audit"] --> B["For EACH vulnerability"]
    B --> C["Trace full dependency chain"]
    C --> D{"Check version range (^ vs exact)"}
    D -- "uses ^" --> E["Try update in lockfile"]
    D -- "exact" --> F["Check parent package updates"]
    E --> G{"Did it fix?"}
    G -- "yes" --> H["Verify fix"]
    G -- "no" --> F
    F --> I["Check intermediate packages"]
    I --> J["Check peer dependencies"]
    J --> K{"Any fix found?"}
    K -- "yes, via update" --> L["Update parent package"]
    K -- "yes, via peer" --> M["Add explicit dependency if peer"]
    K -- "no" --> N["Try lockfile patching (Step 7.5)"]
    L --> H
    M --> H
    N --> Q{"Did it fix?"}
    Q -- "yes" --> H
    Q -- "no" --> R["Add override (last resort)"]
    H --> B
    R --> S["Document why no fix"]
    S --> B
    B --> T(["Done"])
```

## Step-by-Step Instructions

### Step 1: Run Audit and Get Structured Output

```bash
pnpm audit
pnpm audit --json > /tmp/audit.json  # For parsing
```

**Extract from output:**
- Package name and version
- Vulnerability type and severity
- Full dependency path (e.g., `app>pkg1>pkg2>vulnerable-pkg`)
- Required version for fix
- CVE/advisory link

### Step 2: Trace Each Vulnerability's Full Chain

**For EACH vulnerability, trace the COMPLETE dependency chain:**

```bash
# Get the full path
pnpm audit --json | jq -r '.advisories | .[] | .findings[0].paths[]'

# Example output:
# packages__apollo-core>@rslib/core>@microsoft/api-extractor>minimatch
```

**Parse the chain:** `package-using-it > intermediate1 > intermediate2 > vulnerable-package`

### Step 3: Check Version Range Type

**CRITICAL: Check if the vulnerable package uses ^ or exact version:**

```bash
# Check the parent's package.json
npm view @microsoft/api-extractor@7.57.6 dependencies.minimatch
# Output: "10.2.1" (exact) or "^10.2.1" (range)
```

**If it uses `^` range:**
- Try updating in lockfile: `pnpm update vulnerable-package --depth Infinity` (or `npm update` / `yarn upgrade`)
- This might get a newer version within the range
- Verify: `pnpm audit` again (or `npm audit` / `yarn audit`)
- **Important**: If you have packages with `"latest"` as version specifier, update commands will also update those packages. If update doesn't work, proceed to Step 7.5 (lockfile patching) before considering overrides.

**CRITICAL: If `pnpm update vulnerable-package --depth Infinity` doesn't work despite a compatible `^` range:**

pnpm resolves transitive dependencies based on the parent's resolution context. Updating the vulnerable package directly often has no effect because pnpm doesn't re-resolve already-locked transitive deps in isolation. Instead:

1. **Update the DIRECT dependency** that transitively pulls in the vulnerable package (e.g., `pnpm update vitest` instead of `pnpm update flatted`)
2. Updating the direct dependency forces pnpm to freshly resolve its entire subtree, which picks up the newer compatible version
3. If the direct dependency has a newer version available, update it — even if the vulnerability isn't in its direct deps, the fresh resolution often pulls in patched transitive versions
4. Only if updating all direct and intermediate parents fails should you proceed to Step 7.5 (lockfile patching) or consider an override

**Do NOT skip to overrides just because `pnpm update <transitive-dep>` didn't work.** The failure is a pnpm lockfile behavior, not proof that no fix exists.

**If exact version:**
- Parent package must be updated (continue to Step 4)

### Step 4: Check Parent Package for Updates

**Check EVERY package in the chain, starting from the closest parent:**

```bash
# Check current version
pnpm ls @microsoft/api-extractor --depth=0

# Check latest available
npm view @microsoft/api-extractor versions --json | jq -r '.[-10:]'

# Check if latest has fix
npm view @microsoft/api-extractor@latest dependencies.minimatch
```

**If newer version has fix:**
- Update the parent package
- Continue to Step 7 (Verify)

**If no newer version OR still vulnerable:**
- Continue to Step 5

### Step 5: Check Intermediate Packages

**Don't stop at first parent! Check ALL packages in the chain:**

```bash
# Example chain: apollo-core > @rslib/core > api-extractor > minimatch
# You've checked api-extractor (step 4)
# Now check @rslib/core:

npm view @rslib/core@latest version
npm view @rslib/core@latest dependencies.@microsoft/api-extractor
```

**If intermediate package has update that pulls in fixed version:**
- Update the intermediate package
- Continue to Step 7

### Step 6: Check Peer Dependencies

**CRITICAL: Check if vulnerable package or its parent is a peer dependency:**

```bash
npm view @rslib/core peerDependencies peerDependenciesMeta
```

**If it's an optional peer dependency:**
- You can remove it entirely if not needed
- Or add explicit version as devDependency to satisfy it with fixed version

**If it's a peer dependency that accepts ranges:**
- Add the fixed version explicitly to your package.json
- pnpm will use your version instead of the transitive one

**Example:**
```bash
# If webpack is peer dependency of @storybook/csf-plugin:
npm view @storybook/csf-plugin peerDependencies
# Shows: { webpack: '*' }

# Add to your package.json devDependencies:
pnpm add -D webpack@latest

# This satisfies the peer dep with a non-vulnerable version
```

### Step 7: Verify the Fix

**After ANY change:**

```bash
pnpm install  # or npm install / yarn install
pnpm audit  # Should show fewer vulnerabilities (or npm audit / yarn audit)
pnpm check:dependencies  # Ensure consistency (if you have this script)
pnpm build  # Ensure nothing broke
```

### Step 7.5: Lockfile Patching (When Updates Fail, Before Overrides)

**Use this when `pnpm update` / `npm update` / `yarn upgrade` fails to update the vulnerable package**, typically because:
- Your project has packages with `"latest"` version specifiers that get updated alongside
- The lockfile resolution is stuck despite parent packages accepting the fixed version
- You want a surgical fix without triggering other package updates

This step sits between failed update attempts (Steps 6–7) and overrides (Step 8) in the overall flow.

**Process:**

**PREREQUISITE: Verify the fixed version is within the parent's allowed range:**
```bash
# Check what range the parent package allows
npm view parent-package@version dependencies.vulnerable-package
# Example output: "^8.2.1" means 8.2.1-8.x.x is allowed
# If parent uses exact version (e.g., "8.2.1"), do NOT use lockfile patching - use overrides instead
```

1. **Get the correct integrity hash for the fixed version:**
```bash
npm view vulnerable-package@fixed-version dist.integrity
# Example: npm view express-rate-limit@8.3.1 dist.integrity
# Output: sha512-D1dKN+cmyPWuvB+G2SREQDzPY1agpBIcTa9sJxOPMCNeH3gwzhqJRDWCXW3gg0y//+LQ/8j52JbMROWyrKdMdw==
```

2. **Edit the lockfile directly:**

**For pnpm (pnpm-lock.yaml):**
```bash
# Replace all instances of the vulnerable version with fixed version
# GNU sed (Linux):
sed -i 's/vulnerable-package@old-version:/vulnerable-package@new-version:/' pnpm-lock.yaml
sed -i 's/old-integrity-hash/new-integrity-hash/' pnpm-lock.yaml
sed -i 's/vulnerable-package: old-version(/vulnerable-package: new-version(/' pnpm-lock.yaml
sed -i 's/vulnerable-package@old-version(/vulnerable-package@new-version(/' pnpm-lock.yaml

# BSD/macOS sed (note the empty string after -i):
sed -i '' 's/vulnerable-package@old-version:/vulnerable-package@new-version:/' pnpm-lock.yaml
sed -i '' 's/old-integrity-hash/new-integrity-hash/' pnpm-lock.yaml
sed -i '' 's/vulnerable-package: old-version(/vulnerable-package: new-version(/' pnpm-lock.yaml
sed -i '' 's/vulnerable-package@old-version(/vulnerable-package@new-version(/' pnpm-lock.yaml
```

**For npm (package-lock.json):**
```bash
# Find and replace version and integrity in package-lock.json
# Search for "vulnerable-package": { "version": "old-version"
# Update both "version" and "integrity" fields
```

**For yarn (yarn.lock):**
```bash
# Find the package entry
# vulnerable-package@^range:
#   version "old-version"
#   resolved "..."
#   integrity sha512-...
# Update version, resolved URL, and integrity
```

3. **Verify the patch:**
```bash
# Check what changed
git diff pnpm-lock.yaml  # or package-lock.json / yarn.lock

# Apply the changes
pnpm install --frozen-lockfile  # or npm ci / yarn install --frozen-lockfile

# Verify vulnerability is fixed
pnpm audit  # or npm audit / yarn audit
```

**Example (pnpm):**
```bash
# Get integrity hash
npm view express-rate-limit@8.3.1 dist.integrity

# Patch lockfile
sed -i '' 's/express-rate-limit@8\.2\.1:/express-rate-limit@8.3.1:/' pnpm-lock.yaml
sed -i '' 's/sha512-OLD_HASH/sha512-NEW_HASH/' pnpm-lock.yaml
sed -i '' 's/express-rate-limit: 8\.2\.1(/express-rate-limit: 8.3.1(/' pnpm-lock.yaml
sed -i '' 's/express-rate-limit@8\.2\.1(/express-rate-limit@8.3.1(/' pnpm-lock.yaml

# Verify
git diff pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm audit
```

**When to use lockfile patching:**
- ✅ After exhausting all update attempts (Steps 3-6)
- ✅ When parent packages use `^` ranges but lockfile won't update
- ✅ When you need to avoid updating packages with "latest" specifiers
- ✅ **CRITICAL**: Only when the fixed version is within the parent's allowed range
  - Parent has `^8.2.1` and fix is `8.3.1` → ✅ OK (within range)
  - Parent has `8.2.1` (exact) and fix is `8.3.1` → ❌ NOT OK (violates constraint)
  - Always verify: `npm view parent@version dependencies.package` shows the range
- ❌ Don't use if the parent package specifies an exact version (not a range)
- ❌ Don't use if you're unsure about the package's compatibility
- ❌ Don't use if the integrity hash is wrong (will fail integrity check)

### Step 8: Override Only As Last Resort

**Add override ONLY when ALL of these are true:**
- ✅ Checked parent package - no update available with fix
- ✅ Checked ALL intermediate packages - none have updates
- ✅ Checked if it's a peer dependency - it's not, or can't be satisfied
- ✅ Checked version range - it's exact pinned, can't bump in lockfile
- ✅ Tried lockfile patching (Step 7.5) - didn't work or not feasible
- ✅ Verified a fixed version exists for the vulnerable package
- ✅ Latest versions of ALL packages in chain still have the issue

**Add to package.json (syntax varies by package manager):**

**pnpm:**
```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package": "^fixed-version"
    }
  }
}
```

**npm (v8.3+):**
```json
{
  "overrides": {
    "vulnerable-package": "^fixed-version"
  }
}
```

**yarn:**
```json
{
  "resolutions": {
    "vulnerable-package": "^fixed-version"
  }
}
```

**Example: real-world override:**
```json
{
  "pnpm": {
    "overrides": {
      "minimatch": "^10.2.3"
    }
  }
}
```

**Document why in PR/commit:** "minimatch: api-extractor@7.57.6 (latest) uses exact 10.2.1, needs 10.2.3. Checked all packages in chain, tried lockfile patching. No package update available as of 2026-03-04."

### Step 9: Handle Unfixable Vulnerabilities

**If NO patched version exists (advisory says "Patched versions: <0.0.0"):**

1. Document it clearly in comments
2. Check if the package can be removed/replaced
3. If essential, accept the vulnerability and monitor for fixes
4. Consider if vulnerability actually affects your usage

**DO NOT:**
- Change audit level to hide it
- Downgrade to pre-vulnerability version (introduces other CVEs)
- Add override to non-existent version

## Commands Reference

| Task | pnpm | npm | yarn |
|------|------|-----|------|
| Run audit | `pnpm audit` | `npm audit` | `yarn audit` |
| Get JSON output | `pnpm audit --json` | `npm audit --json` | `yarn audit --json` |
| Trace dependency | `pnpm ls package --depth=20` | `npm ls package --depth=20` | `yarn why package` |
| Check latest version | `npm view package@latest version` | `npm view package@latest version` | `yarn info package@latest version` |
| Check deps of version | `npm view package@ver dependencies.dep` | `npm view package@ver dependencies.dep` | `yarn info package@ver dependencies` |
| Check peer deps | `npm view package@ver peerDependencies` | `npm view package@ver peerDependencies` | `yarn info package@ver peerDependencies` |
| Update in lockfile | `pnpm update package --depth Infinity` | `npm update package` | `yarn upgrade package` |
| Update parent package | `pnpm update parent@latest` | `npm install parent@latest` | `yarn upgrade parent@latest` |
| Check version range | `npm view parent@ver dependencies.child` | `npm view parent@ver dependencies.child` | `yarn info parent@ver dependencies` |
| Get integrity hash | `npm view package@ver dist.integrity` | `npm view package@ver dist.integrity` | `yarn info package@ver dist.integrity` |
| Patch lockfile | See Step 7.5 | See Step 7.5 | See Step 7.5 |

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|----------------|------------------|
| Adding overrides immediately | Masks fixable issues | Exhaustive tracing first |
| Stopping at "package is latest" | Intermediate packages might have updates | Check ENTIRE chain |
| Changing audit-level | Hides vulnerabilities | Fix root causes |
| Not checking peer deps | Miss opportunity to control version | Always check peerDependencies |
| Not checking version ranges | Can't identify lockfile update opportunities | Check if ^ or exact |
| Adding webpack/other as dep | Pollutes package.json | Try update commands in lockfile first |
| Skipping intermediate packages | Miss update opportunities | Check ALL packages in chain |
| Not verifying ^ ranges | Assume exact when it's ^ | Use `npm view` to check |
| Running update when "latest" exists | Updates unrelated packages | Use lockfile patching (Step 7.5) |
| Skipping lockfile patching | Jump to overrides too quickly | Try patching before overrides |
| `pnpm update <transitive>` failed, adding override | pnpm doesn't re-resolve locked transitive deps this way | Update the DIRECT dependency that pulls it in instead |

## Red Flags - STOP and Investigate Deeper

These thoughts mean you're taking shortcuts:

| Thought | Reality |
|---------|---------|
| "Package is at latest, needs override" | Did you check intermediates? Peer deps? Try lockfile patching? |
| "This will take too long" | Overrides create tech debt. Do it right. |
| "Audit-level=high is simpler" | User said NEVER change audit level |
| "Just add webpack as dep" | Did you try update commands first? |
| "Security team approved overrides" | They approved IF NO OTHER FIX. Check first. |
| "I've checked enough" | Did you check version ranges? Peer deps? Lockfile patching? |
| "This is obviously unfixable" | Did you check ALL packages in chain? |
| "Let me add it to devDeps" | Only if it's a peer dep. Try updates first. |
| "Update commands don't work" | Did you try lockfile patching (Step 7.5)? |
| "I have packages with 'latest'" | Use lockfile patching to avoid updating them |
| "`pnpm update` didn't work, must need override" | pnpm won't re-resolve locked transitive deps directly. Update the parent/direct dep instead. |

**When you think "this needs an override":** Go back and verify you completed Steps 3-6. Every single one.

## Real-World Impact

**Actual case study results:**
- Started: 25 vulnerabilities (18 high, 6 moderate, 1 low)
- Fixed via direct updates: 19 vulnerabilities (76%)
- Fixed via lockfile updates: 3 vulnerabilities (12%)
- Fixed via peer dependency removal: 2 vulnerabilities (8%)
- Required overrides: 1 vulnerability (4%)
- Remaining unfixable: 1 vulnerability (4%) - no patch exists

**Without systematic approach:** Would have added 10+ unnecessary overrides, creating permanent maintenance burden.

**Critical discoveries from systematic tracing:**
1. **@rslib/core** update fixed 3 vulnerabilities without overrides
2. **api-extractor** was optional peer dependency - removal fixed 2 high severity issues
3. **webpack@5.105.4** eliminated serialize-javascript (newer terser removed the dependency entirely!)
4. **Storybook** 10.2.0 → 10.2.15 fixed rollup, ajv, hono, serialize-javascript
5. **`pnpm update --depth Infinity`** worked for webpack WITHOUT adding it as explicit dependency
6. **Vite** 6.x → 7.x fixed transitive rollup vulnerabilities

**Time investment vs tech debt:**
- Systematic approach: 2-3 hours upfront
- Quick overrides: 30 minutes now + hours of future maintenance
- Proper fixes are self-healing (upstream updates keep working)
- Overrides require manual monitoring and removal

## Verification Checklist

Before claiming "audit passes":

- [ ] Run `pnpm audit` - exit code 0
- [ ] Run dependency consistency check (if available)
- [ ] Run `pnpm build` - ensure nothing broke
- [ ] Run tests (if applicable)
- [ ] Document each override with why it's needed
- [ ] Count overrides - should be minimal (0-3 typical)

## Examples

### Example 1: Systematic Tracing (minimatch)

**Vulnerability:** minimatch@10.2.1 needs 10.2.3

❌ **Bad approach:**
```bash
# See minimatch is vulnerable, add override
"minimatch": "^10.2.3"  # WRONG - didn't investigate
```

✅ **Correct approach:**
```bash
# 1. Trace full chain
pnpm audit --json | jq -r '.advisories | .[] | .findings[0].paths[]'
# Output: packages__apollo-core>@rslib/core>@microsoft/api-extractor>minimatch

# 2. Check version range
npm view @microsoft/api-extractor@7.57.6 dependencies.minimatch
# Output: "10.2.1" (exact, not ^)

# 3. Check if api-extractor has newer version
npm view @microsoft/api-extractor versions --json | jq -r '.[-5:]'
npm view @microsoft/api-extractor@latest dependencies.minimatch
# Output: still 10.2.1 - no update available

# 4. Check if api-extractor is peer dependency
npm view @rslib/core peerDependencies peerDependenciesMeta
# Output: optional peer dependency!

# 5. Try removing (if optional)
pnpm remove @microsoft/api-extractor --filter apollo-core

# 6. If needed, check if rslib/core has update
npm view @rslib/core@latest version
pnpm update @rslib/core@latest

# 7. Only after exhausting ALL options: override
```

### Example 2: Lockfile Update (webpack)

**Vulnerability:** serialize-javascript@6.0.2 needs 7.0.3 from webpack chain

❌ **Bad approach:**
```bash
# See it's from webpack, add webpack as dependency
pnpm add -D webpack@latest  # WRONG - pollutes package.json
```

✅ **Correct approach:**
```bash
# 1. Check webpack version range
npm view @storybook/csf-plugin peerDependencies
# Shows: webpack: '*' (accepts any version)

# 2. Check what fixed it
npm view webpack@latest dependencies.terser-webpack-plugin
npm view terser-webpack-plugin@5.3.17 dependencies
# terser@5.3.17 removed serialize-javascript entirely!

# 3. Update in lockfile only
pnpm update webpack --depth Infinity

# 4. Verify
pnpm audit  # serialize-javascript should be gone
```

### Example 3: Peer Dependency Discovery

**Vulnerability:** hono@4.11.7 needs 4.12.4 from shadcn > @modelcontextprotocol/sdk

✅ **Correct approach:**
```bash
# 1. Check if hono is peer dependency
npm view @modelcontextprotocol/sdk peerDependencies

# 2. Check shadcn version
npm view shadcn@latest version
pnpm update shadcn@latest  # Update parent first

# 3. If still vulnerable, check if we can satisfy peer dep
npm view @modelcontextprotocol/sdk@latest dependencies.hono peerDependencies.hono

# 4. Only override if no other option
```

### Example 4: pnpm Lockfile Won't Update Transitive Dep (flatted)

**Vulnerability:** flatted@3.3.3 needs >=3.4.0, parent `flat-cache` uses `^3.3.3`

❌ **Bad approach:**
```bash
# pnpm update flatted --depth Infinity didn't work
# Range is ^3.3.3 which allows 3.4.x, but lockfile stuck at 3.3.3
# "Must need an override"
"flatted": "^3.4.0"  # WRONG - didn't try updating parents
```

✅ **Correct approach:**
```bash
# 1. pnpm update flatted --depth Infinity didn't work
# This is NORMAL pnpm behavior - it doesn't re-resolve locked transitive deps

# 2. Trace the chain to find direct dependencies
pnpm ls flatted --depth=20
# Shows: stylelint > file-entry-cache > flat-cache > flatted 3.3.3
# Also:  vitest > @vitest/ui > flatted 3.3.4

# 3. Update the DIRECT dependency instead
pnpm update vitest  # vitest 4.0.14 → 4.1.0

# 4. This forces fresh resolution of vitest's entire subtree
# AND triggers pnpm to re-resolve other instances of flatted
# Result: flatted 3.4.1 everywhere

# 5. Key insight: updating vitest (direct dep) fixed flatted
# in BOTH the vitest chain AND the stylelint chain,
# because pnpm re-resolved all flatted instances together
```

**Why this works:** pnpm deduplicates packages. When a direct dependency update triggers a fresh resolution, pnpm re-resolves ALL instances of the transitive package across the entire lockfile, not just the ones in that dependency's subtree. Updating ANY direct dep that uses the vulnerable transitive package can fix it everywhere.

## Rationalization Table

| Excuse | Reality | What to Do Instead |
|--------|---------|-------------------|
| "Package X is at latest, needs override" | Did you check its parents? Peers? | Check ALL packages in chain |
| "This is taking too long" | Overrides create permanent tech debt | 10 min analysis saves future pain |
| "Just add it as devDep" | Only for peer deps! | Try `pnpm update` first |
| "I've checked enough levels" | Did you check peer dependencies? | Check peerDependencies field |
| "Version uses ^, can't update" | ^ means CAN update in range! | Try `pnpm update --depth Infinity` |
| "Security team said use overrides" | They meant as LAST resort | Do full analysis first |
| "Let me change audit-level" | User explicitly forbids this | NEVER change audit settings |
| "Already at latest webpack" | Did you try lockfile update? | `pnpm update webpack` might work |
| "`pnpm update <pkg> --depth Infinity` didn't work, range allows it but lockfile won't budge" | pnpm doesn't re-resolve locked transitive deps this way | Update the DIRECT parent dependency instead — it forces fresh subtree resolution |

## Critical Rules

### NEVER Do These (No Exceptions)

1. **NEVER change audit-level in .npmrc or package.json** - This hides vulnerabilities instead of fixing them
2. **NEVER add packages as explicit dependencies to fix transitive issues** - Try `pnpm update --depth Infinity` first
3. **NEVER skip checking peer dependencies** - 20%+ of fixes come from peer dep management
4. **NEVER assume "package is at latest" means "done investigating"** - Must check intermediates, peers, and ranges
5. **NEVER add overrides without completing ALL investigation steps** - Skipping steps creates unnecessary tech debt

**No exceptions for:**
- Time pressure ("needs to ship today")
- Authority pressure ("security team approved overrides")
- Exhaustion ("I've already fixed 12 others")
- Simplicity ("overrides are easier")

**All of these mean: Follow the systematic process. No shortcuts.**

### ALWAYS Do These

1. **ALWAYS trace the COMPLETE dependency chain** - Every package from your code to the vulnerability
2. **ALWAYS check if packages use ^ ranges** - Can be updated in lockfile
3. **ALWAYS check peerDependencies and peerDependenciesMeta** - Optional peers can be removed or satisfied
4. **ALWAYS try update commands** - `pnpm update --depth Infinity` / `npm update` / `yarn upgrade` before adding as explicit dependency
5. **ALWAYS verify after each fix** - Run audit + build + tests

## Quick Decision Matrix

| Scenario | Action |
|----------|--------|
| Package uses `^` range | Try update: `pnpm update pkg --depth Infinity` / `npm update pkg` / `yarn upgrade pkg` |
| `pnpm update <transitive>` fails despite `^` range | Update the DIRECT dependency that pulls it in (forces fresh subtree resolution) |
| Update doesn't work (^ range) | Try lockfile patching (Step 7.5) |
| Package uses exact version | Check parent for updates |
| Parent at latest | Check intermediate packages |
| All at latest | Check peer dependencies |
| Optional peer dependency | Try removing or explicit version |
| Required peer dependency | Add explicit version if range allows |
| Have "latest" specifiers | Use lockfile patching instead of update commands |
| All methods exhausted | Override with comment explaining why |
| No patched version exists | Document as unfixable, monitor upstream |

## Verification Script

After all fixes:

```bash
# Must pass both:
pnpm audit
echo "Exit code: $?"  # Should be 0

# If you have consistency check:
pnpm check:dependencies  # Should pass

# Ensure builds still work:
pnpm build
pnpm test
```

## When Overrides ARE Justified

Override is correct when ALL these are true:

- [ ] Traced COMPLETE dependency chain (all packages)
- [ ] Checked latest version of EVERY package in chain
- [ ] Verified version ranges (^ vs exact)
- [ ] Tried update commands (`pnpm/npm/yarn update --depth Infinity`)
- [ ] Checked peerDependencies of all packages
- [ ] Checked peerDependenciesMeta for optional flag
- [ ] Attempted lockfile patching (Step 7.5) - either didn't work or not feasible
- [ ] Confirmed fixed version exists for override target
- [ ] No parent package update available with fix
- [ ] Can't remove optional peer dependency
- [ ] Can't satisfy via explicit peer dep version
- [ ] Documented in code comment WHY override is needed

**If ANY checkbox is unchecked: Don't add override yet. Investigate more.**

## Override Documentation Template

**In package.json:**
```json
{
  "pnpm": {
    "overrides": {
      "minimatch": "^10.2.3",
      "lodash": "^4.17.23"
    }
  }
}
```

**Document why in PR description or commit message:**
```
Overrides added:
- minimatch: api-extractor@7.57.6 (latest) uses exact 10.2.1, needs 10.2.3
  Checked: api-extractor latest, rslib/core latest, all intermediates
  No package update available as of 2026-03-04

- lodash: commitizen@4.3.1 (latest) uses exact 4.17.21, needs 4.17.23
  No newer commitizen version available
```

## Success Criteria

**Audit passes when:**
- Exit code 0 from `pnpm audit`
- All fixable vulnerabilities resolved via updates (not overrides)
- Overrides are minimal (typically 0-3)
- Each override has documented justification
- Build and tests still pass

**NOT success:**
- Audit "passes" because you changed audit-level
- 10+ overrides added without investigation
- Dependencies added to package.json that aren't actually needed
- Can't explain why each override is necessary
