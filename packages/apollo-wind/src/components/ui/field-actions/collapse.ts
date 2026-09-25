// A field header's actions collapse to their icons once their `@container` is narrower than 259px,
// where their text no longer fits beside the field's label. Tailwind reads class names whole, so the
// breakpoint lives in these names rather than in a number.

/** Hidden once collapsed, such as an action's text. */
export const COLLAPSED_HIDDEN = '@max-[259px]:hidden';
/** The tighter padding of an action collapsed to its icon. */
export const COLLAPSED_ICON_PADDING = '@max-[259px]:px-1.5';
/** Shown only once collapsed. */
export const COLLAPSED_ONLY = 'hidden @max-[259px]:block';
