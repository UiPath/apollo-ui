import type { ContentPart } from "@tanstack/ai";

/**
 * Whether a composer submit's attachments should advance into the J3
 * intake stepper. The one place this decision lives, so it can't drift
 * between callers.
 *
 * Known limitation: J2 also begins with a document upload, so attachment
 * presence alone won't distinguish J2 from J3 once J2 is built. This
 * function only knows "a file came in," not which scenario it belongs to.
 */
export function shouldEnterJ3Intake(parts: ContentPart[] | undefined): boolean {
  return (parts?.length ?? 0) > 0;
}
