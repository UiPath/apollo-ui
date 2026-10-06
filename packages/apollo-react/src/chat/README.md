# `@uipath/apollo-react/chat`

Renderer-agnostic home of the Apollo chat. The state layer (service, providers, hooks) lives here and is shared by two renderers: the existing Material UI renderer and the Tailwind-based Wind renderer.

The legacy `@uipath/apollo-react/ap-chat` and `@uipath/apollo-react/ap-chat/service` entry points keep working and re-export from here once the move lands.

## Layout

| Folder | Contents |
|---|---|
| `service/` | `AutopilotChatService`, `EventBus`, models and constants. No React. |
| `headless/` | React providers, hooks and utilities with no visual output, plus the chat and message renderer registries. |
| `root/` | `ChatRoot`: the provider stack that resolves and mounts a renderer. |
| `wind/` | The Wind renderer (apollo-wind components and Tailwind classes). |
| `locales/` | Lingui catalogs for chat strings, shared by both renderers. |
| `styles/` | `tailwind.chat.css`, compiled to `dist/chat/styles/tailwind.chat.css`. |

## Import rules

Code under `src/chat` must not depend on Material UI, so a bundle that only uses the Wind renderer carries no MUI or Emotion. Biome enforces this (`noRestrictedImports` in `packages/apollo-react/biome.json`):

- No `@mui/*` or `@emotion/*` imports.
- No imports from `src/material`, either relative (`../material/...`) or via `@uipath/apollo-react/material*`.

The one exception is the lazy registration of the Material renderer in `index.ts`, a dynamic `import()` that is split into its own chunk and only loaded when `renderer: 'material'` is requested.

The Material renderer depends on this folder, never the other way round.

## Styles

Consumers using the Wind renderer include the pre-compiled CSS:

```ts
import '@uipath/apollo-react/chat/styles/tailwind.chat.css';
```

The same cascade-layer caveats as the canvas CSS apply; see [the canvas integration guide](../canvas/README.md).
