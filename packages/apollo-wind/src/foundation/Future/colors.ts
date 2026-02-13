/**
 * Apollo Future — Color Tokens
 *
 * Single source of truth for all colors in the Future design language.
 * Includes values actively used in both Delegate and Flow templates.
 *
 * Colors are now theme-aware via CSS custom properties defined in
 * `future-theme.css`. Apply `.future-dark` or `.future-light` to a
 * parent element to activate a theme.
 *
 * The semantic Tailwind classes (e.g. `bg-future-surface`) resolve to
 * different hex values depending on the active theme.
 */

// =============================================================================
// Surface (backgrounds)
// =============================================================================

/**
 * Surface color tokens — semantic, theme-aware.
 *
 * | Token           | Semantic class              | Dark value (zinc) | Light value (zinc) | Usage                                    |
 * |-----------------|-----------------------------|-------------------|--------------------|------------------------------------------|
 * | surface         | bg-future-surface           | 950  #09090b      | white  #ffffff     | Page, canvas, containers, viewport guard |
 * | surfaceRaised   | bg-future-surface-raised    | 900  #18181b      | 50   #fafafa       | Cards, overlay content, panels           |
 * | surfaceOverlay  | bg-future-surface-overlay   | 800  #27272a      | 100  #f4f4f5       | Panel, inputs, tabs, icon rail           |
 * | surfaceHover    | bg-future-surface-hover     | 700  #3f3f46      | 200  #e4e4e7       | Step card icon, nav hover, selected      |
 * | surfaceMuted    | bg-future-surface-muted     | 500  #71717a      | 400  #a1a1aa       | Badge, loop indicator                    |
 * | surfaceInverse  | bg-future-surface-inverse   | white #ffffff     | 950  #09090b       | Primary buttons (inverse)                |
 */
export const surface = {
  surface: 'bg-future-surface',
  surfaceRaised: 'bg-future-surface-raised',
  surfaceOverlay: 'bg-future-surface-overlay',
  surfaceHover: 'bg-future-surface-hover',
  surfaceMuted: 'bg-future-surface-muted',
  surfaceInverse: 'bg-future-surface-inverse',
} as const;

// =============================================================================
// Accent
// =============================================================================

/**
 * Accent color tokens — semantic, theme-aware.
 *
 * | Token        | Semantic class              | Dark value (cyan) | Light value (cyan) | Usage                                    |
 * |--------------|-----------------------------|-------------------|--------------------|------------------------------------------|
 * | accent       | bg-future-accent            | 500  #06b6d4      | 500  #06b6d4       | Logo, submit button, run node            |
 * | accentSubtle | bg-future-accent-subtle     | 950  #083344      | 50   #ecfeff       | Status badge, active nav, node/flow icon |
 */
export const accent = {
  accent: 'bg-future-accent',
  accentSubtle: 'bg-future-accent-subtle',
} as const;

// =============================================================================
// Foreground (text / icons)
// =============================================================================

/**
 * Foreground color tokens — semantic, theme-aware.
 *
 * | Token                  | Semantic class                        | Dark value        | Light value       | Usage                     |
 * |------------------------|---------------------------------------|-------------------|-------------------|---------------------------|
 * | foreground             | text-future-foreground                | zinc-50  #fafafa  | zinc-950 #09090b  | Primary headings          |
 * | foregroundSecondary    | text-future-foreground-secondary      | zinc-100 #f4f4f5  | zinc-900 #18181b  | Body, messages            |
 * | foregroundHover        | text-future-foreground-hover          | zinc-300 #d4d4d8  | zinc-600 #52525b  | Hover states              |
 * | foregroundMuted        | text-future-foreground-muted          | zinc-400 #a1a1aa  | zinc-500 #71717a  | Nav, secondary UI, code   |
 * | foregroundSubtle       | text-future-foreground-subtle         | zinc-500 #71717a  | zinc-400 #a1a1aa  | Muted, labels             |
 * | foregroundInverse      | text-future-foreground-inverse        | zinc-950 #09090b  | white   #ffffff   | Icons on inverse bg       |
 * | foregroundOnAccent     | text-future-foreground-on-accent      | white   #ffffff   | white   #ffffff   | On primary buttons        |
 * | foregroundAccent       | text-future-foreground-accent         | cyan-500 #06b6d4  | cyan-600 #0891b2  | Flow/node icons           |
 * | foregroundAccentMuted  | text-future-foreground-accent-muted   | cyan-400 #22d3ee  | cyan-600 #0891b2  | Status text               |
 */
export const foreground = {
  foreground: 'text-future-foreground',
  foregroundSecondary: 'text-future-foreground-secondary',
  foregroundHover: 'text-future-foreground-hover',
  foregroundMuted: 'text-future-foreground-muted',
  foregroundSubtle: 'text-future-foreground-subtle',
  foregroundInverse: 'text-future-foreground-inverse',
  foregroundOnAccent: 'text-future-foreground-on-accent',
  foregroundAccent: 'text-future-foreground-accent',
  foregroundAccentMuted: 'text-future-foreground-accent-muted',
} as const;

// =============================================================================
// Border
// =============================================================================

/**
 * Border color tokens — semantic, theme-aware.
 *
 * | Token         | Semantic class               | Dark value        | Light value        | Usage              |
 * |---------------|------------------------------|-------------------|--------------------|---------------------|
 * | border        | border-future-border         | zinc-700 #3f3f46  | zinc-300 #d4d4d8   | Primary borders     |
 * | borderSubtle  | border-future-border-subtle  | zinc-800 #27272a  | zinc-200 #e4e4e7   | Subtle dividers     |
 * | borderMuted   | border-future-border-muted   | zinc-900 #18181b  | zinc-100 #f4f4f5   | Content borders     |
 * | borderDeep    | border-future-border-deep    | zinc-950 #09090b  | zinc-50  #fafafa   | Nested containers   |
 * | borderInverse | border-future-border-inverse | zinc-200 #e4e4e7  | zinc-700 #3f3f46   | Borders on inverse  |
 * | borderHover   | border-future-border-hover   | zinc-600 #52525b  | zinc-400 #a1a1aa   | Border hover state  |
 */
export const border = {
  border: 'border-future-border',
  borderSubtle: 'border-future-border-subtle',
  borderMuted: 'border-future-border-muted',
  borderDeep: 'border-future-border-deep',
  borderInverse: 'border-future-border-inverse',
  borderHover: 'border-future-border-hover',
} as const;

// =============================================================================
// Ring (selection / focus)
// =============================================================================

/**
 * Ring color tokens for selection and focus states.
 *
 * | Token | Semantic class     | Dark value        | Light value       | Usage              |
 * |-------|--------------------|-------------------|-------------------|--------------------|
 * | ring  | ring-future-ring   | zinc-600 #52525b  | zinc-400 #a1a1aa  | Flow node selected |
 */
export const ring = {
  ring: 'ring-future-ring',
} as const;

// =============================================================================
// Gradient
// =============================================================================

/**
 * Gradient tokens — theme-aware background gradients.
 *
 * Dark theme:
 * | Token      | Utility class           | Angle  | From              | To                |
 * |------------|-------------------------|--------|-------------------|-------------------|
 * | gradient1  | bg-future-gradient-1    | 127deg | zinc-700 #3f3f47  | zinc-800 #27272a  |
 * | gradient2  | bg-future-gradient-2    | 128deg | zinc-950 #09090b  | zinc-900 #18181b  |
 * | gradient3  | bg-future-gradient-3    | 128deg | zinc-700 #3f3f47  | zinc-900 #18181b  |
 * | gradient4  | bg-future-gradient-4    | 180deg | zinc-900 #18181b  | zinc-800 #27272a  |
 * | gradient5  | bg-future-gradient-5    | 180deg | zinc-950 #09090b  | zinc-900 #18181b  |
 * | gradient6  | bg-future-gradient-6    | 106deg | cyan-600 #0092b8  | cyan-950 #053345  |
 *
 * Light theme:
 * | Token      | Utility class           | Angle  | From              | To                |
 * |------------|-------------------------|--------|-------------------|-------------------|
 * | gradient1  | bg-future-gradient-1    | 127deg | zinc-200 #e4e4e7  | zinc-100 #f4f4f5  |
 * | gradient2  | bg-future-gradient-2    | 128deg | white   #ffffff   | zinc-50  #fafafa   |
 * | gradient3  | bg-future-gradient-3    | 128deg | zinc-200 #e4e4e7  | zinc-50  #fafafa   |
 * | gradient4  | bg-future-gradient-4    | 180deg | zinc-50  #fafafa   | zinc-100 #f4f4f5  |
 * | gradient5  | bg-future-gradient-5    | 180deg | white   #ffffff   | zinc-50  #fafafa   |
 * | gradient6  | bg-future-gradient-6    | 106deg | cyan-400 #22d3ee  | cyan-100 #cffafe  |
 */
export const gradient = {
  gradient1: 'bg-future-gradient-1',
  gradient2: 'bg-future-gradient-2',
  gradient3: 'bg-future-gradient-3',
  gradient4: 'bg-future-gradient-4',
  gradient5: 'bg-future-gradient-5',
  gradient6: 'bg-future-gradient-6',
} as const;
