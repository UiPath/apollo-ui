/**
 * Guided buying's motion vocabulary.
 *
 * Every duration and easing used by this template comes from here, and this
 * module in turn takes them from the AI chat motion scale
 * (`@/registry/ai-chat/animations`), which mirrors the theme's `--ease-*`
 * tokens. Nothing below invents a raw duration or curve: what it adds is
 * choreography, the order and spacing of a multi-part reveal, composed from
 * the shared scale.
 *
 * Callers must gate every animation on `prefers-reduced-motion`. Use
 * `reducedMotionSequence` / `reducedMotionTransition` for that so the
 * reduced path renders the final state with no partial or shortened
 * animation, rather than each caller inventing its own fallback.
 */

import {
  DURATION,
  ENTRANCE_ANIMATE,
  ENTRANCE_EASE,
  ENTRANCE_INITIAL,
  STAGGER,
} from "@/registry/ai-chat/animations";

export { DURATION, ENTRANCE_ANIMATE, ENTRANCE_EASE, ENTRANCE_INITIAL, STAGGER };

/** The standard transition for anything entering guided buying. */
export const ENTER = { duration: DURATION.base, ease: ENTRANCE_EASE } as const;

/** A one-line copy swap, e.g. the subhead crossfading after a re-rank. */
export const CROSSFADE = {
  duration: DURATION.fast,
  ease: ENTRANCE_EASE,
} as const;

/**
 * How far a revealed item rises into place. Matches the shared entrance
 * offset so a staged reveal and a plain entrance move the same distance.
 */
export const RISE_PX = ENTRANCE_INITIAL.y;

// --- Task 3: the trigger's arrival pass -----------------------------------

/**
 * How long to wait after arriving at a phase before the attention pass runs.
 * Long enough for the results list to finish its own entrance, so the two
 * are not competing for the eye.
 */
export const ATTENTION_ARM_DELAY = DURATION.slower + DURATION.slow;

/** The attention pass itself: one slow sweep, played exactly once. */
export const ATTENTION_SWEEP = {
  duration: DURATION.slower,
  ease: ENTRANCE_EASE,
} as const;

// --- Task 4: the staged reveal --------------------------------------------

/** Where one revealed finding's label, detail and status icon each begin. */
export interface RevealBeat {
  /** Seconds from the start of the sequence until the label begins. */
  label: number;
  /**
   * Seconds until the detail begins. Held close to the label, matching the
   * tight space between them, so the pair still arrives as one unit.
   */
  detail: number;
  /**
   * Seconds until the status icon resolves. A finding is two lines now, so
   * this waits on the detail settling, not on the label alone.
   */
  icon: number;
}

/** The full choreography for a staged reveal of `count` findings. */
export interface RevealSchedule {
  /** The phase label leads, at the very start. */
  phaseLabel: number;
  /** One beat per finding, in order. */
  findings: RevealBeat[];
  /** Suggested question chips land last. */
  chips: number;
  /** When the last thing on screen has finished moving. */
  total: number;
}

/**
 * The whole sequence's ceiling. Past this the demo drags, so the schedule
 * compresses its stagger to fit rather than running longer.
 */
export const REVEAL_BUDGET = DURATION.slower * 3;

/**
 * Builds the reveal schedule. The phase label leads, each finding follows one
 * `STAGGER.step` after the last, each finding's icon resolves `STAGGER.icon`
 * after that finding's own text has settled, and the chips come in after the
 * final icon. Derived rather than hand-tabulated so the sequence stays
 * correct for any number of findings.
 *
 * The stagger tightens if the nominal spacing would push the sequence past
 * `REVEAL_BUDGET`. At the counts this template actually produces the step is
 * the full `STAGGER.step`; the clamp only bites on a longer findings list,
 * so a data change can never quietly turn the reveal into a slideshow.
 */
export function revealSchedule(count: number): RevealSchedule {
  const leadIn = DURATION.fast;
  // Everything in the sequence that does not scale with the finding count:
  // the lead-in, the last finding's own label, detail and icon beats, and
  // the chips.
  const fixed =
    leadIn +
    DURATION.instant +
    DURATION.base +
    STAGGER.icon +
    DURATION.instant +
    DURATION.base;
  const gaps = Math.max(count - 1, 1);
  const step = Math.min(STAGGER.step, (REVEAL_BUDGET - fixed) / gaps);
  const findings: RevealBeat[] = Array.from({ length: count }, (_, index) => {
    const label = leadIn + index * step;
    const detail = label + DURATION.instant;
    return { label, detail, icon: detail + DURATION.base + STAGGER.icon };
  });
  const lastIcon = findings.at(-1)?.icon ?? leadIn;
  const chips = lastIcon + DURATION.instant;
  return {
    phaseLabel: 0,
    findings,
    chips,
    total: chips + DURATION.base,
  };
}

// --- Simulated latency ----------------------------------------------------

/**
 * How long the assistant appears to think before an answer lands. Not an
 * animation: it stands in for a request, and it is here so no call site has
 * to hold a bare number. Unaffected by reduced motion, which is about
 * movement rather than about how long work takes.
 */
export const ANSWER_LATENCY = DURATION.slower + DURATION.base + DURATION.fast;

// --- Task 4: the card highlight ------------------------------------------

/** How long a results-list card stays highlighted once a finding lands. */
export const CARD_HIGHLIGHT_HOLD = DURATION.slower + DURATION.slower;

/** The highlight's own fade in and out. */
export const CARD_HIGHLIGHT = {
  duration: DURATION.slow,
  ease: ENTRANCE_EASE,
} as const;

// --- Reduced motion -------------------------------------------------------

/**
 * A transition that renders the final state immediately. Zero duration and
 * zero delay, so nothing animates and nothing is merely faster.
 */
export const NO_MOTION = { duration: 0, delay: 0 } as const;

/** Picks between a real transition and the reduced-motion one. */
export function reducedMotionTransition<T extends object>(
  reduce: boolean,
  transition: T,
): T | typeof NO_MOTION {
  return reduce ? NO_MOTION : transition;
}

/**
 * Collapses a reveal schedule so every part is already in place. Used under
 * reduced motion, where the panel must render its findings complete rather
 * than stage them.
 */
export function reducedMotionSequence(count: number): RevealSchedule {
  return {
    phaseLabel: 0,
    findings: Array.from({ length: count }, () => ({
      label: 0,
      detail: 0,
      icon: 0,
    })),
    chips: 0,
    total: 0,
  };
}
