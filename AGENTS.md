# AGENTS.md - apollo-ui

This file holds the instructions that apply to every package in this monorepo. Package-specific
guidance lives in the `AGENTS.md` next to the code, and agents load it when they work in that folder:

| Path | What |
|---|---|
| `packages/apollo-core` | Design tokens, fonts and icons shared by every package |
| `packages/apollo-react` | React components: legacy MUI (`Ap*`), canvas and chat. See its `AGENTS.md` |
| `packages/apollo-wind` | Tailwind CSS 4 + shadcn/ui components. See its `AGENTS.md` |
| `packages/apollo-vertex` | Apollo Vertex component sources. See its `AGENTS.md` |
| `apps/apollo-vertex` | Apollo Vertex docs site and shadcn registry. See its `AGENTS.md` |
| `apps/storybook` | Storybook for apollo-react and apollo-wind. See its `AGENTS.md` |
| `web-packages/ap-chat` | `<ap-chat>` web component |

For the overall architecture of the design system, see `docs/architecture.md`.

## Rules

### Default to verified docs, not memory.

When working with frameworks or UI libraries (e.g., Tailwind, Shadcn, Storybook, etc.) — **never rely on memory or training data**.

- **Always check official documentation** for the latest APIs and examples.
- **Use live sources** (e.g., Context7 API) to fetch up-to-date references when possible.
- **Trust verified sources**, even for tools you already know well.

### Think Critically and Verify

When asked _"Does it make sense?"_, _"What do you think?"_, or given a statement or plan — **never assume it's correct**.

- Always **analyze and validate** logic before agreeing.
- **Push back** on mistakes or weak reasoning.
- Give a **short, reasoned explanation** instead of simple approval.
- If uncertain, **state assumptions** and what extra info you need to confirm.

### Plan Before You Act

Before making meaningful changes, **propose and confirm a plan first**.

- Small safe edits (e.g., formatting, lint, typo) are fine directly.
- **Discuss first** for any major change — type fixes, refactors, new features, or behavior changes.
- Present **what you'll change and why** before acting.
- Once agreed, **follow the plan** and summarize results after.

### Pause on Unknowns — Hypothesize, Don't Act

When facing an unexpected error or ambiguous situation, **never act on guesses**.

- **Analyze first:** form hypotheses and note confidence levels.
- **Diagnostics only:** run safe, read-only checks (logs, dry-runs), no side effects.
- **Report back:** explain what happened, root cause, and possible solutions.
- **Get approval, then act:** execute the agreed fix and confirm results.

### Git Workflow — Fixup and Rebase

Use a **fixup/rebase workflow** to keep commits clean and meaningful.

- **Don't stack fix commits**: Avoid adding new commits just to "fix the previous thing."
- **Use fixup or amend**: When correcting a recent change, use `git commit --amend` or `git commit --fixup` followed by `git rebase --autosquash`.
- **Squash before PR**: Combine related changes into cohesive commits that make sense as standalone units.
- **Force push feature branches**: After rebasing, use `git push --force-with-lease` to update the remote branch.
- **Each commit should be meaningful**: A commit should represent a complete, logical change — not a partial fix or correction.

Commits follow conventional commits with a required scope. The allowed scopes are listed in
`.commitlintrc.cjs`.
