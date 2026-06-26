# `/ship` — Full Git Shipping Workflow

## Description

Creates a branch, commits with conventional commits, opens a PR, and (optionally)
syncs a Jira ticket. By default runs lint (JS + CSS), dependency checks,
typecheck, tests, a security audit, and visual regression first — mirroring the
checks CI gates PRs on (`pr-checks.yml` + `security-scan.yml`). Use
`/ship quick` to skip all checks.

This repo uses **pnpm**, **Turborepo**, **Biome**, and **semantic-release**.
Releases are driven automatically by conventional commit messages — there is no
changeset step.

---

## RULES

- Do NOT commit to `main` directly (must always work in a branch)
- Do NOT add `Co-authored-by: Claude` or any AI attribution
- Every commit MUST have a scope from the allowed enum — see Step 5

## Prompt

````
You are a senior engineer executing a shipping workflow. Follow every step in order. Do not skip steps. If any step fails, stop and report the error clearly before proceeding.

## MODE DETECTION

Arguments: $ARGUMENTS

If the arguments contain the word "quick" (case-insensitive), set **QUICK MODE = true**.
Otherwise set **QUICK MODE = false**.

In QUICK MODE, skip Steps 1–4 entirely (no lint, typecheck, or tests).
In full mode, execute all steps.

---

## STEP 0 — Gather Context

### 0a. Inspect repo state

Before asking the user anything, run:
```bash
git status --short          # understand staged vs unstaged changes
git diff --name-only HEAD   # list all modified files
git remote show origin | grep 'HEAD branch'  # detect default base branch
````

- If nothing is staged AND nothing is modified, stop immediately: "Nothing to
  commit. Stage your changes first."
- If there are unstaged changes alongside staged ones, warn the user and ask
  whether to include them or proceed with staged only.
- Capture the **default base branch** (typically `main`) — you will use this in
  Steps 6–7. Do not hardcode it.

### 0b. Ask the user (in a single prompt)

Ask both questions at once:

1. "Jira ticket ID? (e.g. MST-1234 — leave blank if none)"
2. "Confirm or describe what this change does:" — pre-fill a suggestion based on
   your reading of the diff.

### 0c. Fetch Jira ticket (only if a ticket was provided)

If the user left the ticket blank, **skip this** and skip Step 8 entirely — the
rest of the workflow is a pure git + PR flow.

#### Pre-flight — verify the Atlassian MCP is connected

Before any Jira call, check whether `mcp__atlassian__getJiraIssue` is listed as
an available tool in the current session.

- If it is **not** available, print this warning and set **JIRA MODE = off**
  (continue the git + PR flow; still reference the ticket ID as plain text in the
  PR body, but skip all MCP calls and skip Step 8):
  > ⚠️ **Atlassian MCP not connected.** A ticket was provided but the Atlassian
  > MCP server is not authenticated in this session. Jira fetch and the Step 8
  > ticket update will be skipped. To enable it, run `/mcp` and authenticate the
  > **Atlassian** connector, then re-run.
- If it **is** available, set **JIRA MODE = on** and continue.

#### Fetch (JIRA MODE = on only)

Use `mcp__atlassian__getJiraIssue` to fetch:

- Ticket summary
- Ticket description
- Issue type (Bug, Story, Task, Sub-task, etc.)
- Current status

If the MCP call fails but `JIRA_USER` and `JIRA_PASS` are set, fall back to the
REST API:

```bash
curl -s -u "$JIRA_USER:$JIRA_PASS" \
  "https://uipath.atlassian.net/rest/api/3/issue/<TICKET-ID>?fields=summary,description,issuetype,status"
```

If the MCP call fails and `JIRA_USER`/`JIRA_PASS` are not set, warn the user, set
**JIRA MODE = off**, and continue the git + PR flow without ticket details.

Use the fetched details to inform branch naming, commit type, and PR description.

---

## STEP 1 — Lint & Dependency Checks ⏭ *skip in quick mode*

CI's `pr-checks.yml` lint job runs JS lint, CSS lint, dependency lint, and
dependency-version consistency. Run all four so the PR is not rejected on a
check this workflow skipped.

### 1a. JS/TS lint (Biome) — auto-fix first, then validate

```bash
pnpm lint:fix   # attempt auto-fix (Biome, across the monorepo via Turbo)
pnpm lint       # validate — must return exit 0
```

### 1b. CSS lint (Stylelint) — auto-fix first, then validate

```bash
pnpm lint:css:fix   # attempt auto-fix (Stylelint)
pnpm lint:css       # validate — must return exit 0
```

### 1c. Dependency lint & version consistency

```bash
pnpm lint:deps              # dependency lint
pnpm fix:dependencies       # auto-fix version mismatches
pnpm check:dependencies     # validate — must return exit 0
```

If any check still fails after auto-fix:

- Attempt to fix the remaining issues manually (max **3 total attempts** per
  check, across auto + manual)
- After each fix, stage the changes and re-run the failing check
- If still failing after 3 attempts, stop and present the errors to the user

Stage any changes made during fixing:

```bash
git add -u
```

Report: ✅ Lint passed (JS, CSS, deps) — or show exact errors and what was tried.

---

## STEP 2 — Typecheck ⏭ *skip in quick mode*

```bash
pnpm typecheck   # TypeScript across all packages via Turbo
```

- If typecheck fails, attempt to fix (max **3 attempts**).
- Do NOT silence errors with `as any` or `@ts-ignore` / `@ts-expect-error`.
- Stage any fixes: `git add -u`

Report: ✅ Typecheck passed — or list the type errors.

---

## STEP 3 — Unit Tests ⏭ *skip in quick mode*

Inspect which packages are affected by the changed files:

```bash
git diff --name-only HEAD
```

Prefer running only the affected packages with Turbo's changed-files filter:

```bash
pnpm test -- --filter=[HEAD]   # tests for packages changed since HEAD
```

If the changes are broad or you can't narrow it down, run the full suite:

```bash
pnpm test
```

- If tests fail, attempt to fix (max **3 attempts**).
- If tests are genuinely broken by the change, fix them.
- If tests are flaky or unrelated to the change, note the failures and proceed.

Stage any test fixes:

```bash
git add -u
```

Report: ✅ Tests passed (N suites, M tests) | ❌ N failures (list them)

---

## STEP 4 — Security Audit & Visual Regression ⏭ *skip in quick mode*

### 4a. Security audit

CI's `security-scan.yml` gates every PR on `pnpm audit` and signature
verification. Run the same checks locally:

```bash
pnpm audit --prod        # production-dependency vulnerabilities
npm audit signatures     # verify published package signatures
```

- If vulnerabilities are reported, do NOT silently proceed. Surface them to the
  user with severity and the affected packages, and offer the
  `fix-security-vulnerabilities` skill to remediate.
- If the audit can't run (registry unreachable / offline), note that it will run
  in CI and proceed — do NOT block shipping on local-only network issues.

Stage any dependency/lockfile changes made while remediating:

```bash
git add -u
```

Report: ✅ Security audit passed | ⚠️ N vulnerabilities (list them) | ⏭ Runs in CI

### 4b. Visual regression

Only relevant if the change touches component rendering, styles, tokens, or
Storybook stories. If the diff is config/docs/deps only, note "not applicable"
and skip.

```bash
pnpm test:visual   # Playwright visual-regression (may require browsers installed)
```

- If snapshots differ because the change intentionally alters appearance, update
  them and stage the new snapshots.
- If the visual suite can't run locally (missing browsers / environment), note
  that it will run in CI and proceed. Do NOT block shipping on local-only setup.

Stage any updated snapshots:

```bash
git add -u
```

Report: ✅ Visual regression passed | ⚠️ Snapshots updated (N) | ⏭ N/A | ⏭ Runs in CI

---

## STEP 5 — Determine Branch Name

### Type mapping (from Jira issue type or change nature):

| Issue type / change        | Branch prefix |
| -------------------------- | ------------- |
| Bug                        | `fix/`        |
| Story / new feature        | `feat/`       |
| Task / chore / maintenance | `chore/`      |
| Refactor                   | `refactor/`   |
| Documentation              | `docs/`       |

### Format:

- With ticket: `fix/MST-1234-short-description-kebab-case`
- Without ticket: `feat/short-description-kebab-case`

### Rules:

- Max **70 characters** total
- Lowercase, hyphens only in the description part
- Derive description from Jira summary or user input — be concise, drop filler
  words

### Guard — check if branch already exists:

```bash
git branch --list <branch-name>
```

If it exists, stop and ask the user: "Branch `<name>` already exists. Should I
use a different name, or switch to it and continue?"

If you are already on a suitable feature branch (not the base branch), you may
reuse it instead of creating a new one — confirm with the user first.

### Create and switch:

```bash
git checkout -b <branch-name>
```

---

## STEP 6 — Format & Stage & Commit

### Run formatter last to catch any changes from lint/test fixes:

```bash
pnpm format
```

### Stage all tracked changes:

```bash
git add -u
```

### Show a staged-files summary to the user before committing:

```bash
git diff --staged --stat
```

Present this so the user can verify no unintended files are included. If there
are new untracked files that should be included, list them and ask the user
which to add.

Report: ✅ Format passed | N files reformatted

### Commit message rules (Conventional Commits — enforced by commitlint):

The rules below come from `.commitlintrc.cjs` and are validated in CI by the
Commit Lint workflow. The commit MUST pass them.

- Format: `<type>(<scope>): <description>`
- **A scope is REQUIRED** (`scope-empty` is an error) — never omit it
- **Header max length is 100 characters** — show the character count next to the
  proposed message
- Types: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` |
  `build` | `ci` | `chore` | `revert`
- Allowed scopes (`scope-enum`) — pick the one matching the changed files:
  - Packages: `apollo-core`, `apollo-react`, `apollo-wind`, `ap-chat`
  - Apps: `apollo-vertex`, `apollo-wind-storybook`, `apollo-wind-demo`,
    `storybook`
  - Monorepo-wide: `repo`, `ci`, `docs`, `build`, `workspace`, `release`, `l10n`
  - Derive from the diff paths: `packages/apollo-react/**` → `apollo-react`,
    `web-packages/ap-chat/**` → `ap-chat`, `.github/**` → `ci`,
    root-level / cross-cutting → `repo`. If a change spans multiple packages,
    pick the dominant one or use `repo`.
- Subject: no trailing period; any case is allowed
- Do NOT add `Co-authored-by: Claude` or any AI attribution
- If a Jira ticket was provided, reference it in the PR body (Step 7), NOT in the
  commit subject — apollo-ui commits stay clean conventional commits.

### Propose the commit message and wait for approval:

Present it as:

```
fix(apollo-react): resolve undo stack on drill-out   (50 chars)
```

Ask: "Approve this commit message? (edit if needed)"

Then commit (a husky `lint-staged` hook runs Biome / Stylelint / affected tests):

```bash
git commit -m "<approved message>"
```

Capture the commit SHA:

```bash
git rev-parse --short HEAD
```

---

## STEP 7 — Push & Create Pull Request

### Rebase onto the latest base branch to avoid conflicts:

```bash
git fetch origin <detected-default-branch>
git rebase origin/<detected-default-branch>
```

If the rebase has conflicts, stop and present them to the user for resolution.

### Push:

```bash
git push -u origin <branch-name>
```

### Create the PR

Write the PR body to a temp file to avoid shell escaping issues with markdown
and Mermaid:

```bash
cat > /tmp/pr-body.md << 'PRBODY'
<body content here>
PRBODY

gh pr create \
  --title "<commit subject line>" \
  --body-file /tmp/pr-body.md \
  --base <detected-default-branch> \
  --head <branch-name>

rm /tmp/pr-body.md
```

#### PR Title

Same as the full commit subject line, e.g.
`fix(apollo-react): resolve undo stack on drill-out`. It must satisfy the same
conventional-commit rules as the commit (type + required scope).

#### PR Body template

````markdown
## Summary

<!-- 2–4 sentences: what changed, why, and any important context.
     Reference the Jira ticket here if one was provided (e.g. MST-1234). -->

## Changes

<!-- Concrete bullet list of what was modified -->

## Flow

<!-- Mermaid diagram based on the actual files changed.
     Use flowchart TD for logic/data flows.
     Use sequenceDiagram for async/API interactions.
     Keep to ≤10 nodes. If the change is trivial (config, deps, copy),
     omit this section entirely rather than inventing a generic diagram. -->

```mermaid
flowchart TD
    ...
```

## Testing

<!-- How was this verified? Tick what applies. -->

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm test:visual` passes / snapshots updated intentionally
- [ ] Manual testing / Storybook checked
- [ ] Type-safe (no `as any` / type suppressions added)
````

After creating the PR, capture the **PR URL**.

---

## STEP 8 — Update Jira Ticket (only if a ticket was provided)

Skip this entire step if no ticket was provided in Step 0b, **or if JIRA MODE was
set to off in Step 0c** (Atlassian MCP not connected / not authenticated). In that
case report `⏭ Jira update skipped (Atlassian MCP not connected)` in the final
summary and finish — the PR is already open and references the ticket ID as text.

Using the Atlassian MCP:

### 8a. Fetch available transitions

Get the list of valid transitions from the ticket's current status. Do not
assume transition names.

### 8b. Add a comment with clickable links

```
PR opened: <PR URL> Branch: `<branch-name>` Commit: `<short-sha>`
```

### 8c. Transition the ticket

Pick the transition closest to "PR Review" from the available list and apply it.

Report: ✅ Jira comment added | ✅ Status updated to "<transition name>"

---

## FINAL SUMMARY

Output a clean summary. In quick mode, show ⏭ for skipped steps:

| Step         | Status              | Detail                                       |
| ------------ | ------------------- | -------------------------------------------- |
| Lint (JS)    | ✅/❌/⏭ quick       | —                                            |
| Lint (CSS)   | ✅/❌/⏭ quick       | —                                            |
| Dependencies | ✅/❌/⏭ quick       | lint:deps + check:dependencies               |
| Typecheck    | ✅/❌/⏭ quick       | —                                            |
| Test         | ✅/❌/⏭ quick       | N suites, M tests                            |
| Security     | ✅/⚠️/⏭ CI/⏭ quick  | pnpm audit + signatures                      |
| Visual       | ✅/⚠️/⏭ N-A/⏭ quick | No diff / N snapshots updated                |
| Branch       | ✅/❌               | `fix/apollo-react-...`                        |
| Format       | ✅/❌               | N files reformatted                          |
| Commit       | ✅/❌               | `fix(apollo-react): ...` (N chars)           |
| Push         | ✅/❌               | —                                            |
| PR           | ✅/❌               | https://github.com/UiPath/apollo-ui/pull/123 |
| Jira comment | ✅/❌/⏭ skipped     | —                                            |
| Jira status  | ✅/❌/⏭ skipped     | → PR Review                                   |