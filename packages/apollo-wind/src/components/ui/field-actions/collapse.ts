// A field header's actions collapse to their icons once their `@container` is narrower than 259px,
// where their text no longer fits beside the field's label. Tailwind reads class names whole, so the
// breakpoint lives in these names rather than in a number.

/** Hidden once collapsed, such as an action's text. */
export const COLLAPSED_HIDDEN = '@max-[259px]:hidden';
/** Shown only once collapsed. */
export const COLLAPSED_ONLY = 'hidden @max-[259px]:flex';

/**
 * A header action is a ghost `3xs` Button, the height FormFieldHeader's `min-h-6` row expects, in
 * the muted tone of the field's other icon buttons. Its icons are 12px.
 */
export const FIELD_ACTION_CLASS =
  'text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-3';
