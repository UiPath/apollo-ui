/**
 * The classifier question catalog as `GET /api/execution/guardrails/classifier-questions` sends
 * it: the predefined questions grouped by category, verbatim as the validator runs them.
 *
 * Hand-written, not inferred: zod stays private to `classifier-questions-parse.ts`, which pins
 * the two with a compile-time check in both directions, so no schema type reaches this folder's
 * emitted declarations. The nullable fields admit what the backend serializes for a side the
 * question does not have.
 */

/** `noul` is a yes/no question; `score` grades a severity ladder. */
export type ClassifierQuestionType = 'noul' | 'score';

export interface ClassifierQuestionWire {
  /** The stable id `selectedQuestions` and `questionThresholds` store. */
  name: string;
  /** The question text, shown as is. */
  question: string;
  type: ClassifierQuestionType;
  /** Yes/no only: what counts as yes, which flags. */
  criteriaTrue?: string | null;
  /** Yes/no only: what counts as no. */
  criteriaFalse?: string | null;
  /** Score only: the severity ladder, lowest first. Level 0 is the benign baseline. */
  levels?: string[] | null;
}

export interface ClassifierQuestionGroupWire {
  /** The category id, e.g. `harmful_content`. */
  id: string;
  questions: ClassifierQuestionWire[];
}
