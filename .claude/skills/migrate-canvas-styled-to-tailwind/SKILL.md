---
name: migrate-canvas-styled-to-tailwind
description: Migrate an apollo-react canvas component from Emotion styled-components to apollo-wind Tailwind classes following the BaseNode reference migration patterns
---

# Migrate Canvas Styled Components to Tailwind

## Overview

Migrate canvas components in `packages/apollo-react/src/canvas/` from Emotion (`@emotion/styled`, `@emotion/react`) to Tailwind classes provided by `apollo-wind`. The goal is zero runtime CSS-in-JS: every component should use static Tailwind class strings (or CSS custom properties for dynamic dimensions), with `cn()` from `apollo-wind` used only where class-level overrides are needed (e.g. conditional border colors that must beat a base class).

## When to Use

- Migrating any `*.styles.ts` file under `packages/apollo-react/src/canvas/`
- Component currently imports from `@emotion/styled` or `@emotion/react`
- Component uses `styled.*` or the `css` helper

## Reference Files (live in repo)

These files are the canonical examples of the completed migration. Read them before starting:

- `packages/apollo-react/src/canvas/components/BaseNode/BaseNodeContainer.tsx` — Pattern C (conditional classes with `cn()`)
- `packages/apollo-react/src/canvas/components/BaseNode/BaseNodeInnerShape.tsx` — Pattern A (inline static class string + CSS custom properties)
- `packages/apollo-react/src/canvas/components/BaseNode/BaseNodeBadgeSlot.tsx` — Pattern D (inline styles for positional offsets)
- `packages/apollo-react/src/canvas/components/BaseNode/NodeLabel.tsx` — Decomposed sub-components (Header, SubHeader, EditableLabel, EmptyLabelPlaceholder) using `cx()` for non-conflicting conditional classes
- `packages/apollo-react/src/canvas/components/BaseNode/BaseNodeMissingManifest.tsx` — Simple composition of the above primitives
- `packages/apollo-react/src/canvas/components/BaseNode/BaseNode.tsx` — Parent component: CSS custom property setup via `useMemo`, wiring to sub-components
- `packages/apollo-react/src/canvas/constants.ts` — Extracted magic numbers
- `packages/apollo-wind/src/styles/tailwind.utilities.css` — Custom Tailwind `@keyframes` and `@utility` definitions (see `animate-glow`)

## Step-by-Step Process

### Step 1: Audit the Styles File

Read the `*.styles.ts` file and catalog every styled component. For each one, identify:

- **Static styles** — CSS that never changes (borders, flex layout, font sizes)
- **Prop-driven styles** — CSS that varies by prop (shape, status, size)
- **Dynamic numeric values** — Pixel values computed from props (widths, heights, offsets)
- **Animations / keyframes** — Any `@emotion/react` keyframe usage

Create a migration plan showing which pattern (see Step 2) applies to each styled component. **Get user approval before proceeding.**

### Step 2: Choose the Right Pattern for Each Styled Component

#### Pattern A: Static Tailwind Classes (preferred)

Use when all styles are known at build time. Inline the class string directly in the JSX — a string literal is the simplest and most readable form.

**Before (Emotion):**
```tsx
const BaseIconWrapper = styled.div<{ shape?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--canvas-background-secondary);
  color: var(--canvas-foreground);
  border-radius: ${({ shape }) => shape === 'circle' ? '50%' : '8px'};
`;
```

**After (Tailwind):**
```tsx
export const BaseInnerShape = memo(({ children }: Props) => (
  <div
    className="
      flex items-center justify-center overflow-hidden bg-surface text-foreground
      w-(--inner-size) h-(--inner-size) rounded-(--inner-radius)
      [&>svg]:w-(--icon-size) [&>svg]:h-(--icon-size)
    "
  >
    {children}
  </div>
));
```

Note: the shape-dependent border-radius moved to a CSS custom property (`--inner-radius`) computed by the parent. This lets the child's className be fully static.

#### Pattern B: CSS Custom Properties for Dynamic Dimensions

Use when numeric dimensions are computed from props (node width/height, scale factors). Set `--custom-props` via `style` on a **single parent wrapper**, then reference them with static Tailwind classes on children using `w-(--varname)` or `[border-radius:var(--varname)]` syntax.

**Before (Emotion):**
```tsx
// Styled component with complex dimension calculations in template literal
const BaseContainer = styled.div<{ shape?: string; width?: number; height?: number }>`
  width: ${({ shape, width }) => {
    const defaultWidth = shape === 'rectangle' ? 288 : 96;
    return width ?? defaultWidth;
  }}px;
  height: ${({ height }) => height ?? 96}px;
  border-radius: ${({ shape }) => shape === 'circle' ? '50%' : '16px'};
`;
```

**After (Tailwind + CSS vars):**
```tsx
// Parent computes vars once in useMemo
const nodeVars = useMemo((): React.CSSProperties => ({
  '--node-w': `${containerWidth}px`,
  '--node-h': numH ? `${numH}px` : 'auto',
  '--node-radius': shape === 'circle' ? '50%' : `${radius}px`,
} as React.CSSProperties), [containerWidth, numH, shape]);

// Wrapper applies vars; all children use static classes
<div style={nodeVars}>
  <div className="w-(--node-w) h-(--node-h) [border-radius:var(--node-radius)]">
    ...
  </div>
</div>
```

Key points:
- Compute CSS variable values in `useMemo` with relevant deps.
- Cast to `React.CSSProperties` (TS doesn't know about custom properties).
- Children's `className` strings are **static** — they never change, which is the perf win.

#### Pattern C: Conditional Classes with `cn()`

Use when Tailwind classes must **override** each other (e.g. `border-brand` must beat the base `border-border`). Import `cn` from `@uipath/apollo-wind`. Wrap in `useMemo` to avoid recomputation.

**Before (Emotion):**
```tsx
const BaseContainer = styled.div<{ selected?: boolean; executionStatus?: string }>`
  border: 1.5px solid var(--canvas-border-de-emp);
  ${({ executionStatus }) => getExecutionStatusBorder(executionStatus)}
  ${({ selected }) => selected && css`
    border-color: var(--canvas-primary);
    outline: 4px solid var(--canvas-secondary-pressed);
  `}
`;
```

**After (Tailwind + cn):**
```tsx
import { cn } from '@uipath/apollo-wind';

const className = useMemo(
  () => cn(
    'border-2 border-border bg-surface-overlay',           // base
    getStatusBorder(activeStatus),                          // override
    isSelected && 'border-brand',                           // override
    interactionState === 'disabled' && 'opacity-50 cursor-not-allowed',
  ),
  [activeStatus, isSelected, interactionState]
);
```

Use `cn()` **only** when you need class-level override semantics (conflicting utilities on the same CSS property). For classes that don't conflict, plain string concatenation or the local `cx()` utility from `../../utils/CssUtil` is sufficient and faster.

#### Pattern D: Minimal Inline Styles for Truly Dynamic One-Off Values

Use for values that are both dynamic and don't warrant a CSS custom property (e.g. a single `background` color from a prop, or positional offsets from a constant).

**Before (Emotion):**
```tsx
const BaseBadgeSlot = styled.div<{ position: string; shape?: string }>`
  position: absolute;
  width: 20px;
  height: 20px;
  ${({ position, shape }) => {
    const offset = shape === 'circle' ? '12px' : '6px';
    switch (position) {
      case 'top-left': return `top: ${offset}; left: ${offset};`;
      ...
    }
  }}
`;
```

**After:**
```tsx
export const BaseBadgeSlot = memo(({ position, shape, children }: Props) => {
  const offset = shape === 'circle' ? NODE_BADGE_INSET_CIRCLE : NODE_BADGE_INSET_SQUARE;
  const style: React.CSSProperties = { width: NODE_BADGE_SIZE, height: NODE_BADGE_SIZE };
  switch (position) {
    case 'top-left': style.top = offset; style.left = offset; break;
    ...
  }
  return (
    <div className="absolute flex items-center justify-center bg-transparent" style={style}>
      {children}
    </div>
  );
});
```

Pass `undefined` (not `{}`) for `style` when there's no dynamic value, so React skips the style attribute entirely.

### Step 3: Extract Magic Numbers to Constants

Move all pixel literals, grid multiples, and ratio calculations to `packages/apollo-react/src/canvas/constants.ts`. Name them descriptively and document the design reference.

**Before (buried in styled component):**
```tsx
const GRID_UNIT = 16;
const NODE_HEIGHT_DEFAULT = GRID_UNIT * 6; // 96px
```

**After (in constants.ts):**
```ts
export const GRID_SPACING = 16;
export const NODE_HEIGHT_DEFAULT = GRID_SPACING * 6; // 96px
export const NODE_CONTAINER_RADIUS_RATIO = 32 / DEFAULT_NODE_SIZE; // ~0.333
```

### Step 4: Decompose the Monolithic Styles File

Replace the single `*.styles.ts` with focused component files. Each new file should:

- Export **one** component (or a small cohesive group)
- Own its own `interface` for props
- Use `memo` where the component is a leaf / pure-render
- Live alongside the parent component (e.g. `BaseNodeContainer.tsx` next to `BaseNode.tsx`)

Naming convention: `{ParentComponent}{Role}.tsx` (e.g. `BaseNodeContainer.tsx`, `BaseNodeInnerShape.tsx`, `BaseNodeBadgeSlot.tsx`).

### Step 5: Convert Styled Components One by One

For each styled component:

1. **Create the replacement file** with the appropriate pattern from Step 2.
2. **Update imports** in the parent component to use the new file instead of `*.styles.ts`.
3. **Move prop logic out of CSS** — conditional styles that were in template literals become:
   - Ternary expressions in `className` for simple cases
   - `cn()` calls for override semantics
   - Switch/map helper functions that return full literal class strings for multi-value mappings (see `getStatusBorder()` in `BaseNodeContainer.tsx`)
4. **Remove emotion imports** (`css`, `styled`, `keyframes`) from the parent.
5. **Delete the styled component** from the styles file once its replacement is wired in.

### Step 6: Handle Animations and Keyframes

If the styles file uses `@emotion/react` keyframes:

1. Define the `@keyframes` rule in `packages/apollo-wind/src/styles/tailwind.utilities.css`.
2. Create a `@utility` that applies the animation (see `animate-glow` in that file).
3. Use the utility as a Tailwind class in the component.

**Important: lightningcss bug.** Avoid `color-mix()` or `var()` inside `@keyframes` blocks — lightningcss drops them silently. Instead, compute the mixed value in the `@utility` body using an internal `--_private-var` and reference that var in the keyframe:

```css
@keyframes apollo-glow {
  0%   { box-shadow: 0 0 0 0 var(--_glow-shadow, currentColor); }
  70%  { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@utility animate-glow {
  --_glow-shadow: color-mix(
    in srgb,
    var(--glow-color, currentColor) var(--glow-strength, 40%),
    transparent
  );
  will-change: box-shadow;
  animation: apollo-glow 2s infinite;
}
```

Consumers parameterize via `[--glow-color:var(--error)]` arbitrary value classes.

### Step 7: Update Tests

- Mock `cn` from `@uipath/apollo-wind` in unit tests (simple concatenation is fine):
  ```ts
  vi.mock('@uipath/apollo-wind', () => ({
    cn: (...args: unknown[]) =>
      args.flat(Infinity).filter((v): v is string => typeof v === 'string' && v.length > 0).join(' '),
  }));
  ```
- Update any test assertions that relied on emotion-generated class names or inline style objects.
- Add `data-testid` and `data-*` attributes on containers for test queries (e.g. `data-execution-status`, `data-interaction-state`).

### Step 8: Delete the Styles File

Once every styled component has been replaced and the parent no longer imports from `*.styles.ts`, delete the file.

### Step 9: Verify

```bash
pnpm build
pnpm test
pnpm lint
```

Check Storybook visually for regressions if stories exist for the component.

## Tailwind Class Reference (apollo-wind)

### Common Mappings

| Emotion pattern | Tailwind equivalent |
|---|---|
| `display: flex` | `flex` |
| `align-items: center` | `items-center` |
| `justify-content: center` | `justify-center` |
| `position: relative` | `relative` |
| `position: absolute` | `absolute` |
| `cursor: pointer` | `cursor-pointer` |
| `border: 2px solid var(--canvas-border)` | `border-2 border-border` |
| `border-radius: 50%` | `rounded-full` |
| `border-radius: 16px` | `rounded-2xl` |
| `font-size: 13px` | `text-sm` |
| `font-size: 11px` | `text-xs` |
| `font-weight: 600` | `font-semibold` |
| `opacity: 0.5` | `opacity-50` |
| `overflow: hidden` | `overflow-hidden` |
| `white-space: nowrap; text-overflow: ellipsis` | `whitespace-nowrap text-ellipsis` |
| `-webkit-line-clamp: 3` | `line-clamp-3` |
| `word-break: break-word` | `wrap-break-word` |
| Dynamic width via CSS var | `w-(--varname)` |
| Dynamic height via CSS var | `h-(--varname)` |
| Arbitrary CSS property via var | `[border-radius:var(--varname)]` |
| Child selector `svg { width: X }` | `[&>svg]:w-(--icon-size)` |

### Color Token Mappings

| Emotion CSS variable | Tailwind class |
|---|---|
| `var(--canvas-foreground)` | `text-foreground` |
| `var(--canvas-foreground-de-emp)` | `text-foreground-muted` |
| `var(--canvas-background)` | `bg-surface-overlay` |
| `var(--canvas-background-secondary)` | `bg-surface` |
| `var(--canvas-border-de-emp)` | `border-border` |
| `var(--canvas-primary)` | `border-brand` |
| `var(--canvas-error-icon)` | `border-error` or `text-error` |
| `var(--canvas-success-icon)` | `border-success` |
| `var(--canvas-warning-icon)` | `border-warning` |
| `var(--canvas-info)` | `border-info` |

### Tailwind v4 Gotchas

- **All class names must be literal strings.** Tailwind v4 statically scans source files. Never interpolate class names: `` `border-${color}` `` won't work. Use a switch/map that returns full literal strings.
- **`color-mix()` with `var()` inside `@keyframes`** is dropped by lightningcss. Compute it outside the keyframe in a `@utility` body.
- **`field-sizing: content`** — use `field-sizing-content` (custom utility if needed).

## Anti-Patterns to Avoid

| Don't | Do instead |
|---|---|
| Keep `@emotion/styled` alongside Tailwind in the same component | Fully migrate the component; no hybrid state |
| Use `cn()` everywhere | Use `cn()` only when classes conflict/override; use static strings or `cx()` otherwise |
| Put `useMemo` around static class strings | Inline static strings directly in JSX |
| Create inline style objects on every render | Use CSS custom properties on a parent + static Tailwind classes on children |
| Add new `*.styles.ts` files | Colocate styles as Tailwind classes in the component file |
| Use Tailwind `@apply` in CSS files | Use Tailwind classes directly in JSX |

## Checklist

Before marking migration complete:

- [ ] `*.styles.ts` file deleted
- [ ] No `@emotion/styled` or `@emotion/react` imports remain in the component tree
- [ ] All magic numbers moved to `constants.ts`
- [ ] New sub-components use `memo` where appropriate
- [ ] Tests updated and passing
- [ ] Storybook stories render correctly (visual check)
- [ ] Build passes (`pnpm build`)
- [ ] Lint passes (`pnpm lint`)