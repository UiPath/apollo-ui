# `@uipath/apollo-react/chat`

Renderer-agnostic home of the Apollo chat. The state layer (service, providers, hooks) lives here and is shared by two renderers: the existing Material UI renderer and the Tailwind-based Wind renderer.

The legacy `@uipath/apollo-react/ap-chat` and `@uipath/apollo-react/ap-chat/service` entry points keep working and re-export the service from here.

`@uipath/apollo-react/chat/service` exposes the service on its own, without React, for code that drives a chat it does not render.

The consumer documentation (service API, events, configuration, setup for each renderer, styles and the renderer differences) is [DOCS.md](./DOCS.md).

## Layout

| Folder | Contents |
|---|---|
| `service/` | `AutopilotChatService`, `EventBus`, models and constants. No React. |
| `headless/` | React providers, hooks and utilities with no visual output, plus the chat and message renderer registries. |
| `root/` | `ChatRoot`: the provider stack that resolves and mounts a renderer. |
| `wind/` | The Wind renderer (apollo-wind components and Tailwind classes). Embedded and FullScreen are supported; SideBySide renders an explicit placeholder. |
| `stories/` | Storybook playground and the fixtures shared with the Material showcase. Not published. |
| `locales/` | Lingui catalogs for chat strings, shared by both renderers. |
| `styles/` | `tailwind.chat.css`, compiled to `dist/chat/styles/tailwind.chat.css`. |
| `DOCS.md` | Consumer documentation for both renderers. |

## Import rules

Code under `src/chat` must not depend on Material UI, so a bundle that only uses the Wind renderer carries no MUI or Emotion. Biome enforces this (`noRestrictedImports` in `packages/apollo-react/biome.json`):

- No `@mui/*` or `@emotion/*` imports.
- No imports from `src/material`, either relative (`../material/...`) or via `@uipath/apollo-react/material*`.

The one exception is the lazy registration of the Material renderer in `root/ApChat.tsx`, a dynamic `import()` that is split into its own chunk and only loaded when `renderer: 'material'` is requested. `ApChat` from this entry defaults to the Wind renderer; `ApChat` from `@uipath/apollo-react/ap-chat` registers Material eagerly and defaults to it, and registers Wind lazily for hosts that opt in with `renderer: 'wind'`.

The Material renderer depends on this folder, never the other way round.

## Wind renderer notes

- The root element carries the chat theme as a class (`light`, `dark`, `light-hc`, `dark-hc`, `future-light`, `future-dark`), so it themes itself regardless of the host's body class. Menus, tooltips and hover cards portal inside that root, or into a themed node inside `portalContainer` when the host passes one. Modal dialogs (code block expand and HTML preview) always portal to that themed node, placed in `portalContainer` or else `document.body` at z-index 1300 (Material's modal level), so they cover the page rather than the chat panel.
- `spacing.compactMode` sets `data-density="compact"` on the root.
- History opens as a popover under the header's history button, sized as Material's. It is not modal, so a host's own dialog opened from a rename or delete pre-hook stays usable; clicks there leave it open, a click elsewhere or Escape closes it. Settings slide in from the right as Material's do: over the conversation in Embedded (which is inert meanwhile, as Material traps focus there), beside it in FullScreen, where the column makes room. Settings close from their X, the header button or Escape anywhere in the chat, always through the `ToggleSettings` pre-hook, with focus back on the header button. Both share one surface treatment. The settings panel stays mounted, so the element passed to `settingsRenderer` is the same for the chat's life: it is emptied on close and handed to the renderer again on each opening, as in Material.
- `icon` values on custom header actions, message actions and tree message spans (`span.data.icon`) are renderer-specific: Material takes Material Icons names, Wind takes lucide names (kebab-case such as `file-text`, or the PascalCase export name `FileText`). Wind resolves them against lucide's `icons` map, which it loads in a separate chunk on first use, and shows a neutral box for names it cannot resolve.

## Styles

`styles/tailwind.chat.css` scans `src/chat` (not the stories and tests) and apollo-wind's built components, and compiles to `dist/chat/styles/tailwind.chat.css`, exported as `@uipath/apollo-react/chat/styles/tailwind.chat.css`. Hosts either import that sheet or add `dist/chat` to their own Tailwind build; [DOCS.md](./DOCS.md#styles) explains which, and why two precompiled sheets should not be combined.

## Bundle boundary

The import rules above are lint-enforced only: Biome's `noRestrictedImports` checks each file in `src/chat` for direct imports. It cannot see indirect reach through shared modules outside `src/chat` (such as `src/i18n`), so reviewers check that a new import from outside `src/chat` does not bring MUI or Emotion with it.
