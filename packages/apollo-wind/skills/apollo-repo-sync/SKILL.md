---
name: apollo-repo-sync
description: Keeps apollo-wind up to date in a designer's prototype repo and ensures it is correctly configured. Use when the user wants to sync apollo-wind, update components, set up apollo-wind in their project, or at the start of any prototyping session to ensure they are on the latest version.
---

# Apollo Repo Sync

Keeps `@uipath/apollo-wind` correctly configured and up to date in the user's prototype project. Run this at the start of each session or any time the user wants to pull in the latest components, styles, and templates.

## Phase 1 — First-time setup

Run this phase only if `@uipath/apollo-wind` is not yet in the project.

### 1a — Install apollo-wind

```bash
pnpm add @uipath/apollo-wind
```

Or with npm:

```bash
npm install @uipath/apollo-wind
```

### 1b — Add the theme CSS import

Add this to the project's root CSS file (e.g. `src/index.css` or `src/globals.css`):

```css
@import "@uipath/apollo-wind/styles";
```

### 1c — Wrap the app root with a theme class

In the root component (e.g. `App.tsx` or `layout.tsx`), apply the theme class:

```tsx
<div className="future-dark min-h-screen bg-background text-foreground">
  {/* your app */}
</div>
```

Use `future-light` for the light theme. Tell the user they can switch themes by changing this class — no other changes needed.

### 1d — Confirm setup

Let the user know apollo-wind is installed and the theme is active. Tell them:

> Apollo Wind is configured. Components are available from `@uipath/apollo-wind/components` and the `future-dark` theme is active on your root element.

---

## Phase 2 — Sync to latest (every session)

Run this phase every time to ensure the project is on the latest version.

### 2a — Check installed vs latest version

```bash
pnpm list @uipath/apollo-wind
npm show @uipath/apollo-wind version
```

Compare the two. If they match, skip to the success message.

### 2b — Update if behind

```bash
pnpm update @uipath/apollo-wind
```

Or with npm:

```bash
npm update @uipath/apollo-wind
```

### 2c — Rebuild the project

```bash
pnpm build
```

Or if there is a dev server already running, restart it so new components and styles are picked up.

### 2d — Confirm sync

Tell the user what changed:

> Apollo Wind has been updated to vX.X.X. New components, styles, and templates are now available. You can start prototyping.

If already on the latest version:

> Apollo Wind is up to date (vX.X.X). No changes needed.

---

## Component imports

After syncing, components are available at:

```tsx
import { Button } from '@uipath/apollo-wind/components';
import { Card, CardContent } from '@uipath/apollo-wind/components';
import { DataTable } from '@uipath/apollo-wind/components';
```

For theming tokens and utilities:

```tsx
import { cn } from '@uipath/apollo-wind/lib';
```

---

## Common errors

**`@uipath/apollo-wind` not found on npm registry**
The package may not yet be published. Ask the user to check back or use the local monorepo setup via `apollo-install` instead.

**Styles not applying after update**
The CSS import may be missing. Re-check Phase 1b and ensure the import is at the top of the root CSS file.

**Components not resolving after update**
Re-run `pnpm build` or restart the dev server to pick up the updated package.
