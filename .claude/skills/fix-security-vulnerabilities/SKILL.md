---
name: fix-security-vulnerabilities
description: Use when fixing npm/pnpm security vulnerabilities, Dependabot alerts, or audit failures
---

# Fix Security Vulnerabilities

## Overview

Fix each vulnerability by working through five steps in order. Stop as soon as one works. Never use `pnpm update --depth Infinity` — it doesn't reliably re-resolve locked transitive deps.

**NEVER change audit-level. NEVER add overrides without exhausting the steps below.**

**Supply-chain rule: any time a third-party package younger than 14 days enters the install — whether it is the patched package itself, a co-published dep, or a parent you bumped — complete the full supply-chain vetting protocol below before committing the change. Permanent exemptions (e.g. `@uipath/*` own-scope packages) are already configured in `pnpm-workspace.yaml` and do not require vetting.**

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

1. Bump the version constraint to include the fix (e.g. `^2.17.0` → `^2.17.4`).
2. Run `pnpm install`.

**14-day quarantine check:** This repo enforces `minimumReleaseAge: 20160` in `pnpm-workspace.yaml`. If `pnpm install` blocks with a "too new" error, the fixed version was published less than 14 days ago. Before adding an exemption, complete the **full supply-chain vetting protocol** in the section below, then add to `minimumReleaseAgeExclude`:

```yaml
minimumReleaseAgeExclude:
  - 'package-name'    # <version> — security fix for <CVE/advisory>, vetted <date>
```

---

## Step 3: Transitive dependency → update a direct parent

If the vulnerable package is transitive (not in any workspace `package.json`):

```bash
# Find which of YOUR direct dependencies pulls it in
pnpm ls <vulnerable-package> --depth=20 2>/dev/null | head -40
```

For each direct dependency in the chain, check if a minor/patch update pulls in a fixed version:

```bash
npm view <direct-dep>@latest version
npm view <direct-dep>@latest dependencies.<intermediate-or-vuln-package>
```

If a newer version of the direct dep pins a fixed version of the vulnerable package, update it:

```bash
# Edit the version in the relevant package.json, then:
pnpm install
pnpm audit  # verify it's gone
```

After install, check the publish dates of every newly resolved package (`npm view <pkg>@<version> time --json`). Any package published less than 14 days ago — including the parent you bumped, the patched transitive dep, or any of their co-published deps — requires the full **supply-chain vetting protocol** below before the change can be committed. Add each to `minimumReleaseAgeExclude` only after passing all six checks.

---

## Step 4: Transitive with ^ range → temp devDep trick

If no direct dependency update is available but the parent package uses a `^` range for the vulnerable package:

```bash
# Verify the parent uses ^ (not exact)
npm view <parent-package>@<locked-version> dependencies.<vulnerable-package>
# Must output something like "^2.17.0", not "2.17.0"
```

If it's a `^` range, temporarily add the vulnerable package as a devDependency at the fixed version, install (which forces pnpm to resolve it fresh), then remove it:

```bash
# 1. Add temporarily
pnpm add -D <vulnerable-package>@<fixed-version> --filter <workspace-package>

# 2. Verify
pnpm audit

# 3. Remove — the lockfile entry is now updated
pnpm remove <vulnerable-package> --filter <workspace-package>
pnpm audit  # should still be clean
```

Before removing the temp devDep, verify the publish date of the resolved version (`npm view <vulnerable-package>@<resolved-version> time --json`). If it was published less than 14 days ago, complete the full **supply-chain vetting protocol** below and add it to `minimumReleaseAgeExclude` before committing.

If the parent uses an exact (non-`^`) version, this trick won't work — skip to Step 5.

---

## Step 5: Last resort → override in pnpm-workspace.yaml

Only after confirming Steps 2–4 are not applicable:

```yaml
# pnpm-workspace.yaml
overrides:
  <vulnerable-package>: "^<fixed-version>"  # <reason>: <parent>@<ver> pins exact <old-ver>, no parent update available as of <date>
```

Then `pnpm install`. Check the publish date of the overridden version (`npm view <vulnerable-package>@<fixed-version> time --json`). If it was published less than 14 days ago, complete the full **supply-chain vetting protocol** below and add it to `minimumReleaseAgeExclude` before committing. Then run the full verify section below.

---

## Supply-chain vetting protocol (required for quarantine exemptions)

Run ALL of the following checks before adding any package to `minimumReleaseAgeExclude`. Do not skip steps. If any check fails or looks suspicious, stop and report findings instead of proceeding.

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

After completing all six checks, document the result in the `minimumReleaseAgeExclude` comment:

```yaml
  - 'package-name'    # <version> — <CVE/GHSA>, vetted <date>: provenance ✓, publisher ✓, tag+diff ✓, integrity ✓
```

If any check could not be completed (e.g., no GitHub repo, no provenance), note it explicitly and consider whether the risk is acceptable before proceeding.

---

## Cleanup after vetting

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
| Direct dep | Bump version in package.json |
| New enough to hit 14-day quarantine | Complete full supply-chain vetting protocol, then add to `minimumReleaseAgeExclude` |
| Transitive, direct parent has minor/patch update with fix | Update the direct parent |
| Transitive, parent uses `^` range | Temp devDep trick (Step 4) |
| Transitive, parent uses exact version, no parent update | Override in pnpm-workspace.yaml |
| No patched version exists | Document and monitor |
| Any supply-chain check fails | Stop — report findings, do not install |
