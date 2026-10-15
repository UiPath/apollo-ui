# `@uipath/apollo-react/chat`

Renderer-agnostic home of the Apollo chat. The state layer (service, providers, hooks) lives here and is shared by two renderers: the existing Material UI renderer and the Tailwind-based Wind renderer.

The legacy `@uipath/apollo-react/ap-chat` and `@uipath/apollo-react/ap-chat/service` entry points keep working and re-export the service from here.

`@uipath/apollo-react/chat/service` exposes the service on its own, without React, for code that drives a chat it does not render.

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

## Import rules

Code under `src/chat` must not depend on Material UI, so a bundle that only uses the Wind renderer carries no MUI or Emotion. Biome enforces this (`noRestrictedImports` in `packages/apollo-react/biome.json`):

- No `@mui/*` or `@emotion/*` imports.
- No imports from `src/material`, either relative (`../material/...`) or via `@uipath/apollo-react/material*`.

The one exception is the lazy registration of the Material renderer in `root/ApChat.tsx`, a dynamic `import()` that is split into its own chunk and only loaded when `renderer: 'material'` is requested. `ApChat` from this entry defaults to the Wind renderer; `ApChat` from `@uipath/apollo-react/ap-chat` registers Material eagerly and defaults to it.

The Material renderer depends on this folder, never the other way round.

## Wind renderer notes

- The root element carries the chat theme as a class (`light`, `dark`, `light-hc`, `dark-hc`, `future-light`, `future-dark`), so it themes itself regardless of the host's body class. Menus, tooltips and hover cards portal inside that root, or into a themed node inside `portalContainer` when the host passes one. Modal dialogs (code block expand and HTML preview) always portal to that themed node, placed in `portalContainer` or else `document.body` at z-index 1300 (Material's modal level), so they cover the page rather than the chat panel.
- `spacing.compactMode` sets `data-density="compact"` on the root.
- `icon` values on custom header actions and message actions are renderer-specific: Material takes Material Icons names, Wind takes lucide names (kebab-case such as `file-text`, or the PascalCase export name `FileText`). Wind loads each icon lazily through `lucide-react/dynamic` and shows a neutral box for names it cannot resolve.

## Styles

Consumers using the Wind renderer include the pre-compiled CSS:

```ts
import '@uipath/apollo-react/chat/styles/tailwind.chat.css';
```

The same cascade-layer caveats as the canvas CSS apply; see [the canvas integration guide](../canvas/README.md).
