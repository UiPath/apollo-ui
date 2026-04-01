---
name: apollo-install
description: Sets up and launches the Apollo Wind Storybook from scratch. Use when the user wants to run Apollo Wind, start Storybook, set up the apollo-ui repo, or says something like "get apollo running", "set up apollo", or "start apollo storybook".
---

# Apollo Install

Fully sets up and launches the Apollo Wind Storybook in a single flow. Run each step in order — verify success before proceeding to the next.

## Step 1 — Check prerequisites

```bash
node --version
pnpm --version
```

**Node below 18 or missing:** Tell the user to install Node 18+ from https://nodejs.org and stop.

**pnpm missing:** Install it, then continue.

```bash
npm install -g pnpm
```

## Step 2 — Clone the repository

Check if the repo already exists before cloning.

```bash
ls ~/Desktop/apollo-ui
```

**If it does not exist**, clone it. Try SSH first:

```bash
cd ~/Desktop
git clone git@github.com:UiPath/apollo-ui.git
```

**If SSH fails** (no key configured), fall back to HTTPS and let the user know:

```bash
cd ~/Desktop
git clone https://github.com/UiPath/apollo-ui.git
```

## Step 3 — Navigate to the repo

```bash
cd ~/Desktop/apollo-ui
```

## Step 4 — Install dependencies

```bash
pnpm install
```

Wait for full completion before continuing.

## Step 5 — Build all packages

```bash
pnpm build
```

Turborepo builds `apollo-core`, `apollo-react`, and `apollo-wind` in dependency order. Wait for completion.

## Step 6 — Start Apollo Wind Storybook

```bash
pnpm storybook:wind
```

Storybook opens automatically at `http://localhost:6006`. If it does not open, tell the user to navigate there manually.

## Success

> Apollo Wind Storybook is running at http://localhost:6006. Browse components, templates, and tokens in the sidebar. To start prototyping, go to **Introduction → Prototyping**.

## Common errors

**`git@github.com: Permission denied`**
SSH key not configured. Retry with HTTPS (see Step 2).

**`ERR_PNPM_UNSUPPORTED_ENGINE`**
Node version is too old. Ask the user to upgrade to Node 18+.

**`Cannot find module` during build**
Dependencies are incomplete. Re-run `pnpm install` then `pnpm build`.

**Port 6006 already in use**
Another Storybook instance is running. Tell the user to stop it or open http://localhost:6006 directly.
