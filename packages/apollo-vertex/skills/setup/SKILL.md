---
name: setup
description: >
  Use when adding @uipath/apollo-vertex to a React app, or when an app that
  already depends on it is missing the Vertex stylesheet or the agent skill
  setup. Covers peer dependencies, importing the Vertex CSS, setting up
  TanStack Intent so agents load the Vertex skills, and adding a rule to the
  project's agent instructions. Not for building UI: load
  use-vertex-components for that.
metadata:
  purpose: >
    Set up a React app to use Apollo Vertex and make its coding agents follow
    the Vertex skills when they change UI.
  type: lifecycle
  library: '@uipath/apollo-vertex'
sources:
  - 'UiPath/apollo-ui:packages/apollo-vertex/package.json'
  - 'UiPath/apollo-ui:packages/apollo-vertex/styles/tailwind.css'
  - 'UiPath/apollo-ui:apps/apollo-vertex/content/docs/getting-started.mdx'
---

# Set up Apollo Vertex

Work from the project root and use the project's package manager (npm, pnpm,
yarn or bun) for every install. Do each step, then run the completion check.

## 1. Install the package and its peers

Install `@uipath/apollo-vertex` if the project doesn't have it yet.

Then read `peerDependencies` in
`node_modules/@uipath/apollo-vertex/package.json` and make sure the app has
every package listed there, in a version that matches the range. Install
`@uipath/proteus-client` only if the app uses Proteus feature flags (it imports
`@uipath/apollo-vertex/proteus`).

- If the app already has a peer in a version outside the range, tell the user
  about the conflict instead of upgrading it on your own.
- Pick the `@tanstack/react-db` release whose `@tanstack/db` dependency matches
  the one `@tanstack/query-db-collection` uses in the app. Each release pins an
  exact `@tanstack/db`, and two copies do not work together.
- `@uipath/proteus-client` is not on the public npm registry. If installing it
  fails with a 404 or an authentication error, stop and ask the user for access
  to UiPath's package registry. Do not install look-alike packages from npm.
- If the app doesn't use Tailwind yet, set it up for the app's bundler with
  Tailwind's own install guide: install the integration, such as
  `@tailwindcss/vite`, and register it in the bundler config. Installing it is
  not enough.

## 2. Import the stylesheet

Add these lines once to the app's main CSS file, the one that sets up Tailwind,
and remove its own `@import "tailwindcss";` line. If the app has no CSS file
yet, create one and import it from the app's entry point:

```css
@import "@uipath/apollo-vertex/tailwind.css";
@source "./";
```

`tailwind.css` includes Tailwind, the Vertex theme and the classes the Vertex
components use. Keep `@source "./";` and adjust the path if the CSS file is not
next to the app's sources. Without it, Tailwind drops the classes used in the
app's own files.

## 3. Set up TanStack Intent

[TanStack Intent](https://tanstack.com/intent) finds the skills that ship in
`node_modules` and tells agents to load them.

1. Add `@tanstack/intent` as a dev dependency.
2. Add this to the project's `package.json`. If an `intent.skills` list already
   exists, add `@uipath/apollo-vertex` to it instead of replacing it:

   ```json
   {
     "intent": {
       "skills": ["@uipath/apollo-vertex"]
     }
   }
   ```

3. Run `intent install` through the package manager, for example
   `npx intent install` or `pnpm exec intent install`. It writes a skill
   loading block into `AGENTS.md`, or into another agent instructions file that
   already has one.
4. Tell the user that you allowed agents to load the `@uipath/apollo-vertex`
   skills, and that they can change this with `intent install --review` in a
   terminal.

Without the `intent.skills` entry, `intent install` stops and asks for
permissions in an interactive terminal, which an agent can't answer.

## 4. Add the Vertex rule to the agent instructions

`intent install` printed which file it wrote the skill loading block to. The
block starts with `<!-- intent-skills:start -->`. Add this section to that same
file, right after the block:

```markdown
## UI

This app uses Apollo Vertex (`@uipath/apollo-vertex`) for all UI. Before
building or changing UI, run `intent list` and load the matching
`@uipath/apollo-vertex` skills, then follow them.
```

Write the `intent` command the way the skill loading block does, for example
`npm exec --no -- intent list`.

If that file is `AGENTS.md`, make sure Claude Code reads it too: if the
project has a `CLAUDE.md`, it must import `AGENTS.md` with an `@AGENTS.md` line,
and if there is no `CLAUDE.md`, create one that contains only `@AGENTS.md`.

## Completion

- `intent list` shows `@uipath/apollo-vertex` with the `use-vertex-components`
  skill.
- One agent instructions file has both the skill loading block and the UI
  section.
- The app builds, and a Vertex component such as `Button` renders with Vertex
  styling.

Then tell the user what you changed, and load `use-vertex-components` before
building any UI.
