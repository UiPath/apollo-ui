---
name: github-manual-stacked-prs
description: Manage manual stacked pull requests on GitHub without Graphite or other stack tools. Use when the user wants one GitHub PR in review at a time, keeps later branches as draft or local only, and rebases each next branch onto main after the previous PR merges.
---

# GitHub Manual Stacked PRs

Use this skill when the user wants a GitHub-only stacked PR workflow without stack automation. The rule is simple: build branches in order, keep only one PR ready for review, and rebase the next branch onto `main` after the previous PR merges.

## Defaults

- GitHub only.
- No Graphite, `gh stack`, `git-town`, or custom stacking tools unless the user asks.
- Only one PR should be non-draft and actively in review at a time.
- Later changes can stay as local branches or draft PRs, but they are not review targets yet.
- Before opening or marking the next PR ready, rebase that branch onto the latest `main`.
- **Keep each PR under 800–1000 lines of diff (insertions + deletions).** If a proposed slice exceeds this, suggest splitting further before creating branches.

## Start Here

Before proposing commands, confirm:

- trunk branch, usually `main`
- intended merge order from first PR to last PR
- whether later branches already have draft PRs or only local branches
- whether force-push is allowed

If the split is weak, suggest collapsing it before writing commands. If any slice exceeds 1000 LoC, suggest splitting it further before proceeding.

## Branch Model

For work `A -> B -> C`:

- create branch `A` from `main`
- create branch `B` from `A`
- create branch `C` from `B`
- open PR `A` against `main`
- keep `B` and `C` as draft PRs or local branches until their turn

If draft PRs are used early, base them on their parent branch so the diff stays clean:

- PR `A`: base `main`
- draft PR `B`: base `A`
- draft PR `C`: base `B`

When a parent merges, rebase the child branch onto `main`, change the draft PR base to `main`, verify the diff, then mark it ready.

## Fresh Workflow

1. Sync `main`.

```bash
git checkout main
git pull --ff-only
```

2. Create the first branch and commit only the first slice.

```bash
git checkout -b feat/a
# edit
git commit -m "feat(scope): change A"
```

3. Create each later branch from its direct parent.

```bash
git checkout -b feat/b
# edit
git commit -m "feat(scope): change B"

git checkout -b feat/c
# edit
git commit -m "feat(scope): change C"
```

4. Push the branches.

```bash
git push -u origin feat/a
git push -u origin feat/b
git push -u origin feat/c
```

5. Open PR `A` against `main`.
6. Optionally open `B` and `C` as draft PRs against their parent branches. If you do, state clearly that they are placeholders and not ready for review yet.

Use a note like this in every draft PR body:

```md
Manual stack:
- depends on: #123
- status: draft, do not review yet
- next step: rebase onto `main` after #123 merges
```

## Promotion Rule

Only promote one PR at a time.

When PR `A` merges:

1. Update local `main`.
2. Rebase branch `B` onto `main`.
3. Force-push `B`.
4. If PR `B` already exists as draft, change its base to `main`.
5. Verify the diff contains only `B`.
6. Mark PR `B` ready for review.

Example:

```bash
git checkout main
git pull --ff-only

git checkout feat/b
git rebase main
git push --force-with-lease
```

When PR `B` merges, do the same for `C`:

```bash
git checkout main
git pull --ff-only

git checkout feat/c
git rebase main
git push --force-with-lease
```

## Review Rules

- Only one PR is reviewable at a time.
- Later PRs stay draft or unopened until their parent PR merges.
- Do not ask reviewers to reason about stacked diffs across multiple open review branches.
- Before marking a draft PR ready, always verify its base is `main` and its diff is clean.

## Recovery Patterns

- Draft PR shows parent commits after a merge: rebase the branch onto `main`, force-push, then set the base to `main`.
- Diff is still noisy after retargeting: close and reopen the draft PR instead of fighting bad history.
- Extra commit landed in the wrong branch: move it with `git cherry-pick` or clean it up with `git rebase -i`, then force-push.
- Conflict storm: rebase from the next branch to be promoted, not from the top of the old stack.

## Response Shape

When helping the user, produce:

- the branch order
- the current active PR
- exact git commands in order
- any force-push step
- the GitHub action needed next, such as create draft, change base, or mark ready

Default to this format:

```md
Stack
- feat/a -> main, ready for review
- feat/b -> draft until feat/a merges
- feat/c -> draft until feat/b merges

Commands
```bash
# commands here
```

GitHub
- Open `feat/a` against `main`.
- Keep `feat/b` as draft.
```
