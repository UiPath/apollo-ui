/**
 * Shared motion vocabulary for the AI chat surfaces.
 *
 * Easing mirrors the generated theme's `--ease-*` custom properties (see
 * `app/theme.generated.css`, sourced from `registry.json`) so JS-driven
 * motion and CSS-driven motion stay on one curve set. Framer Motion needs
 * the raw control points rather than a `var()`, so each curve is duplicated
 * here as a tuple; the CSS token remains the source of truth for the value.
 *
 * TODO(apollo-vertex): the theme ships easing tokens but no duration tokens,
 * so the `DURATION` scale below is defined locally. Promote it to
 * `registry.json` once a duration token set exists, then re-export from
 * there instead of declaring values here.
 */

// --- Easing, mirroring the theme's `--ease-*` tokens -----------------------

/** `--ease-out-quad` */
export const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;
/** `--ease-out-cubic` */
export const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;
/** `--ease-out-quart` */
export const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
/** `--ease-out-quint` */
export const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
/** `--ease-out-expo` */
export const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;
/** `--ease-in-out-cubic` */
export const EASE_IN_OUT_CUBIC = [0.645, 0.045, 0.355, 1] as const;

// --- Durations, in seconds (Framer Motion's unit) -------------------------

/**
 * Semantic duration scale. Named by intent rather than by value so a
 * caller never has to pick a number, and so a future token set can change
 * the values without touching call sites.
 */
export const DURATION = {
  /** Micro-feedback: a popover or chip settling. */
  instant: 0.14,
  /** A short crossfade, e.g. one line of copy swapping for another. */
  fast: 0.18,
  /** The default entrance for a message or a small block. */
  base: 0.22,
  /** A longer entrance, for text arriving after an icon has moved. */
  slow: 0.3,
  /** A whole block or panel arriving. */
  slower: 0.5,
} as const;

/**
 * Choreography for a sequence that reveals its parts one at a time: the gap
 * between consecutive items, and the extra beat before an item's status
 * icon resolves once that item's own text has settled.
 */
export const STAGGER = {
  /** Gap between the start of one revealed item and the next. */
  step: 0.18,
  /** Delay from an item's text settling to its status icon resolving. */
  icon: 0.16,
} as const;

// --- Composed variants ----------------------------------------------------

/**
 * The standard entrance curve. Aligned with `--ease-out-quint`; it was
 * previously an independent near-identical tuple, which let the JS and CSS
 * motion vocabularies drift apart.
 */
export const ENTRANCE_EASE = EASE_OUT_QUINT;
export const ENTRANCE_INITIAL = { opacity: 0, y: 8 };
export const ENTRANCE_ANIMATE = { opacity: 1, y: 0 };
export const ENTRANCE_TRANSITION = {
  duration: DURATION.base,
  ease: ENTRANCE_EASE,
};

export const POP_INITIAL = { opacity: 0, y: 4, scale: 0.96 };
export const POP_ANIMATE = { opacity: 1, y: 0, scale: 1 };
export const POP_EXIT = { opacity: 0, y: 4, scale: 0.96 };
export const POP_TRANSITION = {
  duration: DURATION.instant,
  ease: ENTRANCE_EASE,
};
