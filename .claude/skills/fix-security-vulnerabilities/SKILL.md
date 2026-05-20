---
name: fix-security-vulnerabilities
description: Use when fixing npm/pnpm security vulnerabilities, Dependabot alerts, or audit failures
---

# Fix Security Vulnerabilities

## Overview

Fix each vulnerability by working through five steps in order. Stop as soon as one works. Never use `pnpm update --depth Infinity` — it doesn't reliably re-resolve locked transitive deps. `pnpm update <pkg> -r` (no depth flag) is the right refresh tool when you need to nudge transitives — but verify after, since partial refreshes are common.

**NEVER change audit-level. NEVER add overrides without exhausting the steps below.**

**Pre-install gate: Before running any `pnpm install` or `pnpm add`, always complete the full supply-chain vetting protocol below for every third-party package that would enter the install. Use `npm view` to gather all vetting data — it queries the registry without downloading or executing anything and is always safe to run. Do not install first and check later.**

**14-day quarantine: This repo enforces `minimumReleaseAge: 20160` in `pnpm-workspace.yaml`. If a third-party package is younger than 14 days, pnpm will block the install. In that case, supply-chain vetting must still pass before adding an exemption to `minimumReleaseAgeExclude`. First-party packages (e.g. `@uipath/*` own-scope packages) are already configured as permanent exemptions and do not require vetting.**

---

## Step 1: Identify the vulnerability

```bash
pnpm audit
```

For each vulnerability note: the vulnerable package, the required fix version, and the full dependency path shown in the audit output.

```bash
# Confirm whether it's a direct dependency of one of your workspace packages
pnpm ls <vulnerable-package> 2>/dev/null | head -30
```

---

## Step 2: Direct dependency → bump it

If the vulnerable package appears directly in a workspace `package.json`:

### 2a. Vet before touching anything

Complete the **full supply-chain vetting protocol** below for `<vulnerable-package>@<fix-version>`. Do not edit `package.json` or run `pnpm install` until vetting passes.

If the fix version is younger than 14 days, also add to `minimumReleaseAgeExclude` before installing:

```yaml
minimumReleaseAgeExclude:
  - 'package-name'    # <version> — security fix for <CVE/advisory>, vetted <date>: provenance ✓, publisher ✓, tag+diff ✓, integrity ✓
```

### 2b. Install (only after vetting passes)

1. Bump the version constraint to include the fix (e.g. `^2.17.0` → `^2.17.4`).
2. Run `pnpm install`.

---

## Step 3: Transitive dependency → bump something in the chain

If the vulnerable package is transitive (not in any workspace `package.json`):

```bash
# Walk the full chain — useful to see which ancestor pins the offending range
pnpm why <vulnerable-package> 2>&1 | head -40
```

Check **each ancestor in the chain** (not just direct deps — intermediate transitives also work, e.g. `engine.io-client` updated by `pnpm update <ancestor> -r`) and inspect the constraint type for the package below it:

```bash
npm view <ancestor>@<locked-version> dependencies --json
npm view <ancestor>@latest dependencies --json   # compare to latest
```

**Constraint type matters:**
- **caret (`^x.y.z`)** — typically auto-resolves to a new patch in the same major; a fresh `pnpm update -r` often does the job
- **tilde (`~x.y.z`)** — locks to a specific minor (`>=x.y.z <x.y+1.0`). A tilde-pinned parent can NOT resolve to a higher minor of the child. If the fix is in a higher minor, the **only** options are: bump that parent itself (if a newer parent has widened the tilde) or override (Step 5).
- **exact** — only the parent bump or override works.

### 3a. Vet before touching anything

Complete the **full supply-chain vetting protocol** below for every package that would enter the install — the updated direct dep and the patched transitive package. Do not edit `package.json` or run `pnpm install` until vetting passes for all of them.

If any is younger than 14 days, add each to `minimumReleaseAgeExclude` before installing.

### 3b. Install (only after vetting passes)

```bash
# Edit the version in the relevant package.json, then:
pnpm install
pnpm audit  # verify it's gone
```

---

## Step 4: Refresh the transitive resolution

When the parent uses `^` and a higher version of the vulnerable package is already valid under that range, force pnpm to re-resolve.

### 4a. Vet before touching anything

Complete the **full supply-chain vetting protocol** below for `<vulnerable-package>@<fix-version>`. Do not run any install command until vetting passes.

If the fix version is younger than 14 days, add it to `minimumReleaseAgeExclude` before installing.

### 4b. Install (only after vetting passes)

Try the simplest tool first:

```bash
pnpm update <vulnerable-package> -r
pnpm audit                                # confirm all paths cleared
grep -E "^  <vulnerable-package>@" pnpm-lock.yaml | sort -u   # spot any stuck versions
pnpm why <vulnerable-package>             # only if audit still flags entries — shows which path is stuck
git diff --stat                           # see scope of side effects before staging
```

**Side effects of `pnpm update -r` to watch for:**
- If the target is *also* a direct dep, package.json gets bumped (and alphabetically re-sorted). For transitive-only fixes, package.json should be untouched — if it changed, the target was actually direct and you may want to keep the bump or revert it.
- Bumping a transitive may cascade — its own transitives can shift. Inspect the lockfile diff before assuming "1 line changed."
- Peer-dep disambiguation suffixes (the long `(pkg@ver)(pkg2@ver2)` qualifiers in `pnpm-lock.yaml`) can shift across many unrelated entries. Usually cosmetic — confirm by checking that no *actual resolved version* changed (the keys like `pkg@x.y.z:` at the top of each entry block).

**Partial refreshes are common.** `pnpm update -r` often clears most paths but leaves one or two stuck behind tilde-range or exact-version parents. If audit still flags entries:

1. **Inspect the stuck path** with `pnpm why` and look at the constraint at the lowest level that still pins the vulnerable version.
2. If that constraint is `^`, the temp devDep trick can sometimes nudge it:
   ```bash
   pnpm add -D <vulnerable-package>@<fix-version> --filter <workspace-package>
   pnpm audit
   pnpm remove <vulnerable-package> --filter <workspace-package>
   ```
3. If the stuck constraint is tilde or exact, the trick won't help. Try **bumping the ancestor that holds the tighter range** — if it has a newer version with a widened range, `pnpm update <ancestor> -r` may resolve the child naturally without any override at all. (Real example: `engine.io-client@6.6.4` pinned `ws ~8.18.3`; bumping to `6.6.5` pinned `ws ~8.20.1`, closing the path with no override.)
4. If nothing in the chain can be moved, fall through to Step 5.

---

## Step 5: Last resort → override in pnpm-workspace.yaml

Only after confirming Steps 2–4 are not applicable:

### 5a. Vet before touching anything

Complete the **full supply-chain vetting protocol** below for `<vulnerable-package>@<fix-version>`. Do not edit `pnpm-workspace.yaml` or run `pnpm install` until vetting passes.

If the fix version is younger than 14 days, add it to `minimumReleaseAgeExclude` before installing.

### 5b. Install (only after vetting passes)

Prefer the most surgical override that fixes the issue:

```yaml
# pnpm-workspace.yaml
overrides:
  # Most surgical: only override when this specific parent → child path resolves.
  # Use when only one chain is stuck and other paths already resolved correctly.
  <parent>><vulnerable-package>: "^<fixed-version>"  # <reason>

  # Blanket: forces all resolutions of the package. Use when multiple paths are stuck
  # or the same vulnerable range could re-appear in future installs.
  <vulnerable-package>: "^<fixed-version>"  # <reason>: <parent>@<ver> pins exact <old-ver>, no parent update available as of <date>

  # Version-bounded: only override when the existing range would resolve to a vulnerable version.
  # Safer than blanket when the package has legitimately non-vulnerable older majors in the tree.
  <vulnerable-package>@>=<vuln-start>: "^<fixed-version>"
```

Then `pnpm install`. Then run the full verify section below.

---

## Supply-chain vetting protocol (required for every fix, before any install)

Run ALL of the following checks for each package entering the install. Do not skip steps. If any check fails or looks suspicious, stop and report findings instead of proceeding.

### 1. Verify npm provenance and signatures

```bash
# Verify sigstore attestations for the specific version
npm audit signatures

# Check provenance metadata — should show GitHub Actions as the build environment
npm view <package>@<version> dist.attestations --json 2>/dev/null
```

A package with provenance will show a `sigstore` attestation linking the tarball to a specific GitHub Actions run. If there is **no** provenance and the package has historically had it, that is a red flag — stop and report.

### 2. Confirm the publisher identity

```bash
# Who published this specific version?
npm view <package>@<version> _npmUser --json 2>/dev/null

# Compare against the previous version's publisher — should be the same person/bot
npm view <package>@<previous-version> _npmUser --json 2>/dev/null

# Check the current maintainer list
npm view <package> maintainers --json 2>/dev/null
```

A publisher change between versions (especially to an unfamiliar account) is a critical red flag. Stop and report.

### 3. Verify the release on GitHub

Using `WebFetch` or `WebSearch`, go to the package's GitHub repository and:

- **Find the release tag**: Confirm a git tag (e.g., `v2.17.4`) exists for the version, was created by the expected maintainer, and was created at roughly the same time as the npm publish date.
- **Read the release notes / CHANGELOG**: Confirm the release explicitly mentions the CVE or advisory being fixed. A security release with no mention of the fix is suspicious.
- **Inspect the diff**: Look at the commit(s) included in this tag vs the previous tag. The diff should be small and obviously related to the reported vulnerability. Unexpected unrelated changes (new features, dependency swaps, obfuscated code, base64 blobs) are red flags.
- **Check commit authorship**: The commits should be from known contributors to the project, not first-time or anonymous authors.

### 4. Verify package integrity

```bash
# Check the tarball shasum matches npm registry
npm view <package>@<version> dist --json 2>/dev/null
# The "integrity" field (sha512) is the canonical checksum.

# Optionally download and inspect the tarball contents
npm pack <package>@<version> --dry-run 2>/dev/null
```

### 5. Check for dependency changes in the new version

```bash
# Compare deps between old and new version — unexpected new deps are a red flag
npm view <package>@<previous-version> dependencies --json 2>/dev/null
npm view <package>@<version> dependencies --json 2>/dev/null
```

New dependencies introduced in a patch release — especially ones that are themselves newly published — warrant the same full vetting protocol applied recursively.

### 6. Cross-reference the advisory

Fetch the advisory URL from `pnpm audit` output directly. Confirm:
- The advisory explicitly lists the patched version.
- The advisory was filed by a credible reporter (project maintainer, security researcher, or GitHub security team).
- The description matches the actual code diff you reviewed in step 3.

### Vetting result

After completing all six checks, document the result in the commit message or PR description. If a `minimumReleaseAgeExclude` entry is also needed, record it there:

```yaml
  - 'package-name'    # <version> — <CVE/GHSA>, vetted <date>: provenance ✓, publisher ✓, tag+diff ✓, integrity ✓
```

If any check could not be completed (e.g., no GitHub repo, no provenance), note it explicitly and consider whether the risk is acceptable before proceeding.

---

## Cleanup after install

After any `pnpm install` that resolves new packages, check for artifact files left behind by npm/pnpm (e.g. package info JSONs written to the repo root):

```bash
git ls-files --others --exclude-standard
```

If any untracked files appear that are not part of the fix (e.g. `*_info.json`, temp tarballs), remove them before committing:

```bash
# Targeted removal — list first, then clean
git clean -n                  # dry-run: shows what would be removed
git clean -f -- <file>        # remove a specific artifact
```

Do not use `git clean -fd` broadly — it will also delete untracked directories (e.g. local build outputs).

---

## Verify after every fix

Run all three — unconditionally, not "if the script exists":

```bash
pnpm audit                    # must exit 0
pnpm check:dependencies       # must exit 0 — enforces consistent versions across workspaces
```

If `pnpm check:dependencies` fails after a fix, run `pnpm fix:dependencies` to auto-correct version mismatches, then re-run both checks.

---

## Quick reference

| Situation | Action |
|-----------|--------|
| Every fix | Complete supply-chain vetting with `npm view` before editing files or installing |
| Package < 14 days old | Vetting required (as always) + add to `minimumReleaseAgeExclude` after vetting passes |
| Direct dep | Vet, then bump version in package.json |
| Transitive, any ancestor has a newer version with the fix in range | Vet, then `pnpm update <ancestor> -r` — Step 3 |
| Transitive, parent uses `^` range | Vet, then `pnpm update <pkg> -r` (Step 4); fall back to temp devDep trick if partial |
| Transitive, parent uses `~` or exact, but a newer ancestor widens the range | Vet, bump that ancestor — Step 3/4 |
| Transitive, nothing in chain can be moved | Vet, then targeted override in pnpm-workspace.yaml — Step 5 (prefer `parent>child` syntax over blanket) |
| No patched version exists | Document and monitor |
| Any supply-chain check fails | Stop — report findings, do not install |
