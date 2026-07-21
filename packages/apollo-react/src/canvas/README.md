# Canvas Tailwind CSS — Consumer Integration Guide

Apollo React canvas components use [apollo-wind](../../../apollo-wind) (Tailwind CSS v4) for styling. This guide covers how consumers should integrate the required CSS depending on their application architecture.

## Background

Canvas components import from `@uipath/apollo-wind` and use Tailwind utility classes (e.g., `p-4`, `bg-surface`, `text-foreground`, `border-border`). These utilities depend on:

1. **Tailwind CSS v4 utility class definitions** — the actual `.p-4 { padding: 1rem }` rules
2. **Apollo-core theme variables** (`--color-foreground`, `--color-border`, etc.) — defined per-theme on `body.light`, `body.dark`, etc.
3. **Apollo-wind bridge variables** (`--surface`, `--brand`, `--foreground`, etc.) — map semantic names to core variables, also scoped to theme selectors

### What apollo-react ships

Apollo-react exports a pre-compiled CSS file at:

```
@uipath/apollo-react/canvas/styles/tailwind.canvas.css
```

This contains all three layers above, compiled and minified (~160KB). It is **not** auto-injected — consumers must explicitly integrate it based on their architecture.

---

## Integration Patterns

### Pattern A: Standard App (no Shadow DOM)

**Example:** PO.Frontend — Rsbuild app with SCSS, styled-components, and MUI.

#### The challenge

Tailwind v4 wraps all utility classes in `@layer utilities`. Per the CSS specification, **un-layered CSS always takes precedence over layered CSS**, regardless of source order or specificity. If your app has un-layered styles (MUI, styled-components, global SCSS), they will override Tailwind utilities on any conflicting properties.

Simply importing the pre-compiled `tailwind.canvas.css` will not work — the utilities will be overridden by your existing styles.

#### Solution: Set up Tailwind CSS processing via PostCSS

By processing Tailwind at build time through PostCSS, Tailwind owns the CSS cascade from the top of your stylesheet. This ensures utility classes work correctly while your existing styles continue to function (un-layered styles still take precedence, which is desirable for your app's own components).

**1. Install dependencies**

```bash
npm install @uipath/apollo-wind postcss
```

**2. Create `postcss.config.js`** (project root)

```js
import apolloWindConfig from "@uipath/apollo-wind/postcss";

export default {
  plugins: [...apolloWindConfig.plugins],
};
```

Rsbuild automatically detects and uses `postcss.config.js` — no additional build config is needed.

**3. Create a CSS entry point** (e.g., `src/tailwind.css`)

```css
@import "@uipath/apollo-wind/tailwind.css";

/* Scan apollo-wind and apollo-react canvas components for Tailwind class usage */
@source "../node_modules/@uipath/apollo-wind";
@source "../node_modules/@uipath/apollo-react/dist/canvas";
```

The `@source` directives tell Tailwind which files to scan for class names. Only utilities actually used by these components are included in the output.

**4. Import in your app entry** (e.g., `bootstrap.tsx`)

```tsx
import "./tailwind.css";
```

Import it early, before component code, so the CSS is available when components render.

#### How specificity works after setup

| Style source | Layered? | Priority |
|---|---|---|
| MUI / styled-components | No (un-layered) | Highest — always wins |
| App SCSS / global CSS | No (un-layered) | High |
| Tailwind `@layer utilities` | Yes | Normal — wins over other layers |
| Tailwind `@layer base` | Yes | Low |
| CSS reset (`@layer reset`) | Yes | Lowest |

Apollo-wind components in the canvas use **only** Tailwind classes. As long as your app's MUI/styled-component styles don't target the same elements, there are no conflicts. The two styling systems coexist on separate parts of the DOM.

---

### Pattern B: Shadow DOM App

**Example:** Agents/frontend-sw — Emotion/MUI app rendering canvas inside a Shadow DOM boundary.

#### The challenge

Shadow DOM provides style encapsulation — CSS from the outer document does not apply inside a shadow root. This creates two problems:

1. **Utility classes must be injected into the shadow root.** Global `<style>` or `<link>` tags in the document head won't reach shadow DOM content.

2. **Theme CSS variables must be available inside the shadow root.** The apollo-core theme variables (`--color-foreground`, `--color-border`, etc.) are defined on `body.light` / `body.dark` in the outer document. CSS custom properties **do inherit** through the shadow DOM boundary, so these are available. However, the **bridge variables** (`--surface`, `--brand`, `--foreground`, etc.) are scoped to `.light` / `.dark` selectors in the Tailwind CSS — these selectors won't match inside the shadow DOM.

#### Solution: Inline CSS injection with theme class wrapper

**1. Import the pre-compiled CSS as an inline string**

Using your bundler's `?inline` query (Rsbuild/Vite):

```tsx
import TailwindCanvasCSS from "@uipath/apollo-react/canvas/styles/tailwind.canvas.css?inline";
```

**2. Ensure a theme class wrapper exists inside the shadow DOM**

The bridge variables are defined under selectors like `body.light, .light { ... }` and `body.dark, .dark { ... }`. For these to activate inside the shadow DOM, an ancestor element within the shadow root must have the appropriate theme class.

Add a wrapper element with `apollo-design` and the active theme class:

```tsx
// Inside your shadow DOM component
<div className={`apollo-design ${theme}`}>
  {/* Canvas and other content */}
</div>
```

The compiled CSS includes selectors for both `body.light` and `.apollo-design.light` (and their dark/hc variants), so this wrapper activates all theme variable definitions.

**3. Inject the CSS into the shadow root**

Using Emotion's `<Global>` component (if your Emotion cache targets the shadow root):

```tsx
<Global styles={[TailwindCanvasCSS, /* other CSS */]} />
```

Or by creating a `<style>` element directly:

```tsx
const styleElement = document.createElement("style");
styleElement.textContent = TailwindCanvasCSS;
shadowRoot.prepend(styleElement);
```

#### Variable resolution chain inside Shadow DOM

```
Outer document: body.light { --color-foreground: #273139; ... }
                          ↓ (CSS custom property inheritance)
Shadow root:    <div class="apollo-design light">
                  → .apollo-design.light { --color-foreground: #273139; }  (core vars, redundant but ensures availability)
                  → .light { --surface: var(--color-background); ... }     (bridge vars, NOW active)
                  → .bg-surface { background-color: var(--surface); }      (utility classes, NOW resolved)
```

#### Existing canvas variables

If you already use `@uipath/apollo-react/canvas/styles/variables.css` with shadow DOM re-scoping (as in `canvas-styles.utils.ts`), that pattern continues to work alongside the Tailwind CSS. The canvas variables (`--canvas-*`) and the bridge variables (`--surface`, `--brand`, etc.) are independent — both reference the same underlying `--color-*` tokens.

---

## Exported CSS files

| Export path | Contents | Use case |
|---|---|---|
| `@uipath/apollo-react/canvas/styles/tailwind.canvas.css` | Pre-compiled Tailwind utilities + theme variables (~160KB) | Shadow DOM consumers (inline import) |
| `@uipath/apollo-react/canvas/styles/variables.css` | Canvas-specific CSS variable mappings (`--canvas-*`) | All consumers (canvas component theming) |
| `@uipath/apollo-react/canvas/xyflow/style.css` | React Flow base styles | All consumers (canvas rendering) |
| `@uipath/apollo-wind/tailwind.css` | Tailwind CSS v4 entry point with Apollo theme | Standard apps via PostCSS processing |
| `@uipath/apollo-wind/postcss` | PostCSS plugin config export | Standard apps (postcss.config.js) |

## Troubleshooting

### Tailwind utility classes have no effect

**Symptom:** Elements have Tailwind classes (e.g., `p-4`) but the styles don't appear in DevTools, or appear but are overridden.

**Cause:** Un-layered CSS from MUI, styled-components, or global SCSS overrides `@layer utilities`.

**Fix:** Use Pattern A (PostCSS setup). Do not import the pre-compiled CSS directly in non-shadow-DOM apps.

### CSS variables are undefined inside Shadow DOM

**Symptom:** Elements show `var(--surface)` or `var(--color-foreground)` as undefined in computed styles.

**Cause:** Bridge variables are scoped to `.light` / `.dark` selectors that don't match inside the shadow root.

**Fix:** Add a wrapper element with the theme class inside the shadow DOM (see Pattern B, step 2).

### Borders or backgrounds look wrong

**Symptom:** Unexpected border colors or missing backgrounds on canvas components.

**Cause:** The Tailwind base layer includes `* { border-color: var(--color-border-de-emp) }` and `body { background-color: var(--background) }`. These may conflict with existing component styles.

**Fix:** These rules are in `@layer base`, so they lose to un-layered styles. If conflicts persist in Shadow DOM, override with more specific selectors in your injected CSS.

---

## Sequential view

`SequentialCanvas` is an n8n/Zapier-style vertical projection of the same flow graph, built on the existing `BaseCanvas`. It reuses the same node manifests, icons, execution status, validation badges, and theming as the flow view; only the layout is different. A `ViewSwitcher` lets the host toggle a canvas between the free-form `flow` layout and the vertical `sequential` layout.

### Projection model

The consumer keeps one canonical `nodes`/`edges` array. Flow-view positions (`node.position`) remain the persisted source of truth: `SequentialCanvas` derives a vertical layout from the graph's structure and renders that derived layout through `BaseCanvas`, but it never writes computed positions back onto the canonical nodes. Toggling from sequential back to flow is lossless because of this. The one exception is a node added while the sequential view is active: it has no meaningful flow position yet, so it is stamped `data.seqInserted` and given a real, non-overlapping position by `synthesizePositionsForFlow` the next time the canvas switches to flow view.

### Minimal usage

```tsx
import {
  SequentialCanvas,
  useCanvasViewMode,
  ViewSwitcher,
} from '@uipath/apollo-react/canvas';

function MyFlow({ nodes, edges, onNodesChange, onEdgesChange }) {
  const [view, setView] = useCanvasViewMode('my-flow.view');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ViewSwitcher value={view} onChange={setView} />
      <SequentialCanvas
        view={view}
        mode="design"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      />
    </div>
  );
}
```

`SequentialCanvas` supplies its own `ReactFlowProvider` and keeps one `BaseCanvas` mounted while `view` changes. For a worked example, including per-view viewport save/restore, see `SequentialCanvasStoryHarness` and the `Wireframe` story.

### Degraded graphs

Not every graph is a clean, structured sequence. The projection degrades gracefully instead of failing:

| Shape | Rendering |
|---|---|
| Multiple roots or disconnected components | Stacked lanes ordered by flow-view y |
| Unstructured merge (a node with more than one incoming edge) | Placed under its first incomer; the extra incoming edge draws a dashed goto connector |
| Cycles other than a loop's `loopBack` handle | A dashed, arrowless goto connector closes the cycle |
| Orphans (no sequence edges at all) | A de-emphasized trailing section after the terminal placeholder |

Every case renders something rather than crashing or dropping a node: the cycle guard prevents infinite recursion, and unreachable or disconnected nodes are always appended as trailing rows. The toggle is never blocked.

Both CSS delivery patterns described earlier in this guide (PostCSS scanning and precompiled Shadow DOM injection) cover the sequential view's markup with no extra configuration, since it is built entirely from Tailwind utility classes scanned from this package's `dist/canvas`.
