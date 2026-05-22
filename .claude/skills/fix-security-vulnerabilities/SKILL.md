---
name: fix-security-vulnerabilities
description: Use when fixing npm/pnpm security vulnerabilities, Dependabot alerts, or audit failures
---

# Fix Security Vulnerabilities

## Overview

Fix each vulnerability by working through the steps in order. Stop as soon as one works.

**Never use `pnpm update <pkg> -r` for security fixes.** It re-resolves every caret range in the lockfile, not just the named package, and pulls in whatever patch/minor bumps the registry has shipped since the last install. On a 2000+ entry lockfile that is a meaningful supply-chain attack surface — you can ship a "one-line fix" that silently updates 10+ unrelated transitives, none of which you vetted. Use surgical overrides instead (Step 3).

**NEVER change audit-level.**

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

## Step 3: Transitive dependency → surgical override (primary path)

If the vulnerable package is transitive (not in any workspace `package.json`):

```bash
# Walk the full chain — useful to see which ancestor pins the offending range
pnpm why <vulnerable-package> 2>&1 | head -40
```

Check the parent constraint type on the vulnerable package:

```bash
npm view <parent>@<locked-version> dependencies --json
```

- **caret (`^x.y.z`)** — parent admits the fix in range. Use Step 3 below.
- **tilde (`~x.y.z`)** or **exact** — parent does NOT admit a higher minor. Either bump the parent (apply Step 3 recursively against the parent, picking a parent version that widens the range — e.g. `engine.io-client@6.6.4` pinned `ws ~8.18.3`, bumping to `6.6.5` pinned `ws ~8.20.1` and closed the path), OR use a permanent override (Step 4).

### 3a. Vet before touching anything

Complete the **full supply-chain vetting protocol** below for `<vulnerable-package>@<fix-version>`. Do not edit `pnpm-workspace.yaml` or run `pnpm install` until vetting passes.

If the fix version is younger than 14 days, add it to `minimumReleaseAgeExclude` before installing.

### 3b. Surgical override pattern (add → install → remove → install)

This is the safe pattern for nudging a transitive: it pins exactly the package you intend to fix and produces a minimal lockfile diff. The override forces re-resolution for the target package only; everything else stays locked. After install, you remove the override and run install again — the lockfile preserves the pin (because the parent's caret range admits it), and the config stays clean.

```yaml
# pnpm-workspace.yaml — temporarily add to the `overrides:` block
overrides:
  # ...existing overrides...
  <vulnerable-package>: "^<fix-version>"
```

Then:

```bash
pnpm install                # phase 1: pins the target via the override
git diff --stat pnpm-lock.yaml   # MUST show only the target package's entries shifting
```

If anything *other than* the target package shifted in the lockfile diff, **stop**. Investigate before continuing — you may have hit a deeper resolution issue, or another caret range happened to be invalidated by the change.

Once the diff is clean, **remove the override** and install again:

```yaml
# pnpm-workspace.yaml — delete the override line you just added
overrides:
  # ...existing overrides only...
```

```bash
pnpm install                # phase 2: should report "Already up to date"
git diff --stat pnpm-lock.yaml   # MUST still show only the target package's entries
pnpm audit                  # must exit 0
```

Phase 2 should report `Already up to date` — meaning the lockfile pin held without needing the override. Final commit contains:
- `pnpm-lock.yaml`: only the target package's resolution lines changed
- `pnpm-workspace.yaml`: just the `minimumReleaseAgeExclude` entry (if needed); the `overrides:` block is unchanged from before the fix

**Why this works:** `pnpm install` honors the existing lockfile (`prefer-frozen-lockfile` is the default in pnpm 11). Adding an override invalidates only the target's resolution. Removing the override doesn't invalidate the now-locked version because the parent's caret range still admits it. `pnpm update -r`, by contrast, walks every caret range in the lockfile and re-resolves them all — that is the cascade we want to avoid.

**When the surgical pattern doesn't apply:**
- Parent uses tilde/exact and the locked version doesn't satisfy the new pin → removing the override would re-resolve to a vulnerable version. Use Step 4 (permanent override) instead.
- The same vulnerable package is locked at multiple major versions for legitimate reasons → use a version-bounded override (Step 4).

---

## Step 4: Permanent override (when surgical pin won't hold)

Use this when:
- The parent's range is tilde or exact and doesn't admit the fix on its own (so removing the override would unpin you).
- Multiple parents pin conflicting ranges and you need ongoing protection.
- You want documented, regression-resistant protection that future installs cannot accidentally undo.

### 4a. Vet before touching anything

Complete the **full supply-chain vetting protocol** below for `<vulnerable-package>@<fix-version>`. Do not edit `pnpm-workspace.yaml` or run `pnpm install` until vetting passes.

If the fix version is younger than 14 days, add it to `minimumReleaseAgeExclude` before installing.

### 4b. Install (only after vetting passes)

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

Then `pnpm install` and run the verify section below. The override stays in place as a documented security pin; the inline comment must include the CVE/GHSA, vetting date, and reasoning.

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
git diff --stat pnpm-lock.yaml   # confirm scope: only the target package's lines should shift
```

If `pnpm check:dependencies` fails after a fix, run `pnpm fix:dependencies` to auto-correct version mismatches, then re-run both checks.

If the lockfile diff shows resolutions for packages *other than* the target, the fix is not surgical — stop and investigate before committing. A clean transitive-only security fix should touch at most a few dozen lines in `pnpm-lock.yaml`, all referencing the target package.

---

## Quick reference

| Situation | Action |
|-----------|--------|
| Every fix | Complete supply-chain vetting with `npm view` before editing files or installing |
| Package < 14 days old | Vetting required (as always) + add to `minimumReleaseAgeExclude` after vetting passes |
| Direct dep | Vet, then bump version in package.json — Step 2 |
| Transitive, parent uses `^` and admits the fix | Vet, then surgical override (add → install → remove → install) — Step 3 |
| Transitive, parent uses `~`/exact, newer parent version widens the range | Vet, apply Step 3 against the ancestor (surgical override on the ancestor, not the leaf) |
| Transitive, parent uses `~`/exact and no widened version exists | Vet, then permanent override — Step 4 |
| Transitive, vulnerable package legitimately exists at multiple majors | Vet, then version-bounded permanent override — Step 4 |
| No patched version exists | Document and monitor |
| Any supply-chain check fails | Stop — report findings, do not install |
| **Never** | `pnpm update <pkg> -r` for security fixes — cascades resolution across the lockfile and pulls in unvetted bumps |
