# Chat: development guide

The chat has one service and two renderers. This folder is the **Material renderer** (MUI and
Emotion), kept for existing hosts and maintenance only. New work goes to the Wind renderer and the
shared layers in `src/chat`; see `src/chat/README.md` for the layout and import rules.

## Where things live

| Path | What |
|---|---|
| `src/chat/service/` | `AutopilotChatService`, events, models and constants. No React. |
| `src/chat/headless/` | Providers, hooks and pure helpers shared by both renderers, plus the renderer registry. |
| `src/chat/root/` | `ChatRoot` (provider stack, resolves the renderer) and the `/chat` entry's `ApChat`. |
| `src/chat/wind/` | The Wind renderer: apollo-wind components and Tailwind classes only. |
| `src/chat/stories/` | The Storybook playground (Apollo React / Chat / Playground), comparing both renderers. |
| `src/chat/locales/` | Lingui catalogs for both renderers. |
| `src/chat/DOCS.md` | Consumer documentation: service API, events, configuration, setup, styles, renderer differences. |
| `src/material/components/ap-chat/` (here) | `ap-chat.tsx` (the `/ap-chat` entry's `ApChat`), `MaterialChatRenderer.tsx` and its `components/`. |
| `src/material/stories/chat.stories.tsx` | The Material showcase (maintenance only). |

## Rules

- **Renderer-agnostic logic goes in `src/chat/headless`** as hooks or pure helpers (no new
  contexts), and both renderers use it. Material switches to a hoisted piece in the same change,
  with a regression test.
- **`src/chat` never imports MUI, Emotion or `src/material`.** Biome (`noRestrictedImports`) checks
  direct imports; watch for indirect reach through shared modules outside `src/chat` (such as
  `src/i18n`). The Material renderer is reached only through the lazy `import()` in
  `src/chat/root/ApChat.tsx`.
- **Wind uses apollo-wind and Tailwind only**: no MUI, Emotion or `Ap*` components. A missing
  primitive is reported as an apollo-wind gap rather than added here.
- **Material changes are fixes**, or switching to a hoisted headless piece. Do not add styled
  components; follow the repo's Emotion-to-Tailwind migration rules when a component is reworked.
- **Strings**: Lingui `msg` with an explicit id; new ids go in `src/chat/locales/en.json` only, then
  `pnpm run i18n:compile`. Reuse Material's id and message where the text is the same.
- **Density** is `spacing.compactMode`. Icons are renderer-specific names (lucide in Wind, Material
  Icons in Material); see DOCS.md.
- **Docs**: a public API change updates `src/chat/DOCS.md`; a deliberate Wind deviation from
  Material is added to its "Renderer differences" section.

## Testing

- Unit tests sit beside the code (`*.test.ts(x)`, Vitest with happy-dom). Run
  `pnpm --filter @uipath/apollo-react exec vitest --run src/chat src/material/components/ap-chat`.
  Tests use the built apollo-wind `dist`, so rebuild it after changing apollo-wind.
- Parity tests compare the service events or payloads of both renderers for the same interaction.
- The playground (`pnpm storybook:design`, Apollo React / Chat / Playground) drives both
  renderers from args and scripted scenarios; add a scenario for a new feature.
- Check Embedded and FullScreen, compact mode, a dark and a future theme, and a second locale.
