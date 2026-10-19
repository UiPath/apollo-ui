import type {
  ClassifierQuestionGroupWire,
  ClassifierQuestionType,
} from './classifier-questions-wire';
import { GUARDRAIL_COPY_EN, type GuardrailCopyTable } from './definitions-copy';

/** One predefined classifier question, display-ready. */
export interface ClassifierQuestion {
  /** The stable id `selectedQuestions` and `questionThresholds` store. */
  name: string;
  /** The question text, shown as is. */
  question: string;
  type: ClassifierQuestionType;
  /** Yes/no only: what counts as yes, which flags. */
  criteriaTrue?: string;
  /** Yes/no only: what counts as no. */
  criteriaFalse?: string;
  /** Score only: the severity ladder, lowest first. Level 0 is the benign baseline. */
  levels?: string[];
}

/** A category of the question catalog, with its heading resolved. */
export interface ClassifierQuestionCategory {
  /** The raw category id, e.g. `harmful_content`. */
  id: string;
  /** The curated heading, else the raw id. */
  label: string;
  questions: ClassifierQuestion[];
}

export interface EnrichClassifierQuestionsOptions {
  /** Where the category headings come from. Defaults to the English table. */
  copy?: GuardrailCopyTable;
}

/**
 * Turn the validated catalog into what `ClassifierQuestionPicker` renders: each category gets
 * its heading from the curated copy (`classifier.categoryLabels`), falling back to the raw id as
 * Agents' picker does, and a side the wire sends as `null` becomes absent. Pure and React-free;
 * `useClassifierQuestions` is the lingui-aware composition.
 */
export function enrichClassifierQuestions(
  groups: readonly ClassifierQuestionGroupWire[],
  options: EnrichClassifierQuestionsOptions = {}
): ClassifierQuestionCategory[] {
  const headings = (options.copy ?? GUARDRAIL_COPY_EN).classifier?.categoryLabels ?? {};
  return groups.map((group) => ({
    id: group.id,
    label: Object.hasOwn(headings, group.id) ? (headings[group.id] ?? group.id) : group.id,
    questions: group.questions.map((wire) => {
      const question: ClassifierQuestion = {
        name: wire.name,
        question: wire.question,
        type: wire.type,
      };
      if (wire.criteriaTrue != null) question.criteriaTrue = wire.criteriaTrue;
      if (wire.criteriaFalse != null) question.criteriaFalse = wire.criteriaFalse;
      if (wire.levels != null) question.levels = wire.levels;
      return question;
    }),
  }));
}
