/**
 * Typography and vertical rhythm for the assistant panel.
 *
 * One place for the panel's type, so the narration, the findings, and the
 * structured answer all set to the same scale instead of each surface
 * choosing its own. Every value is a Tailwind utility resolving to a theme
 * token; nothing here is a pixel literal.
 *
 * TODO(apollo-vertex): missing scales. `app/theme.generated.css` ships
 * colours, radii and easing, plus `--spacing` (0.25rem, Tailwind's base
 * step) and `--tracking-normal`, but **no type scale and no spacing scale**
 * of its own. The sizes, weights, leading and tracking below are therefore
 * Tailwind's own default scale, driven off `--spacing`, which is the nearest
 * available scale rather than a parallel one invented here. Repoint these at
 * Apollo tokens once a type and spacing scale ship.
 *
 * The panel is 332px wide and stays that way. Everything here is set for
 * that column.
 */

/**
 * The phase and time line, and the chips group's own heading. Small, quiet,
 * slightly tracked out so a short line of it does not read as a label
 * crammed against the content below.
 */
export const PANEL_EYEBROW = "text-xs tracking-wide text-muted-foreground";

/** Space beneath an eyebrow, separating it from what it introduces. */
export const PANEL_EYEBROW_GAP = "mb-2";

/**
 * The step's narration. Regular weight, and loose enough to scan: bold at
 * this column width sets as a solid block rather than as a sentence, and it
 * competed with the finding labels below it for the same emphasis.
 * `leading-relaxed` is 1.625, the scale step nearest the 1.6 asked for.
 */
export const PANEL_LEDE = "text-sm font-normal leading-relaxed text-foreground";

/**
 * The evidence band: findings, ruled off from the narration above. The rule
 * takes the border token, never a custom hairline colour.
 */
export const PANEL_BAND_EVIDENCE = "mt-5 border-t border-border pt-5";

/** The next-move band: the chips, ruled off from the evidence above. */
export const PANEL_BAND_NEXT_MOVE = "mt-6 border-t border-border pt-6";

/**
 * Space between findings. Substantially open, so the labels read as a column
 * the eye can run down rather than as a paragraph of alternating weights.
 * Four times the 1.5 step this replaced.
 */
export const FINDING_GROUP = "space-y-6";

/**
 * One finding: icon in its own column, label and detail stacked in the next.
 * A grid rather than a flex row so the detail hangs under the label instead
 * of under the icon.
 *
 * Aligned to the start of the row, not to the label's baseline. Baseline
 * alignment suited the small plain glyph this replaced, but it puts a
 * circled glyph's bottom edge on the baseline and its top well above the
 * line box. `items-start` instead lands the icon's box inside the label's
 * first line box, where a circle at nearly the line's own height reads as
 * optically centred on it. That relationship is measured rather than
 * assumed, so a change to either size gets caught.
 */
export const FINDING_ROW = "grid grid-cols-[auto_1fr] items-start gap-x-2";

/**
 * The finding's label: the only emphasised text in the group. One step up in
 * weight from its detail, at the same size, so the group gains a column to
 * scan without gaining a second type size.
 */
export const FINDING_LABEL = "text-xs font-medium leading-snug text-foreground";

/**
 * The finding's supporting detail. Secondary colour, looser leading than the
 * label, and held tight to it so the pair reads as one unit against the open
 * space between findings.
 */
export const FINDING_DETAIL =
  "mt-0.5 text-xs font-normal leading-relaxed text-muted-foreground";

/**
 * The status icon: a circled check, a step larger than the panel carried
 * before the rhythm pass, on `--primary`.
 *
 * Primary rather than success because these are completed steps in a
 * sequence, not success states. Sized close to the label's own line height
 * so it anchors the row it belongs to. Shared with the details step's
 * records list, which carries the same mark for the same reason.
 */
export const FINDING_ICON = "size-4 shrink-0 text-primary";
