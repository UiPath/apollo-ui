import { z } from 'zod';
import type {
  ClassifierQuestionGroupWire,
  ClassifierQuestionWire,
} from './classifier-questions-wire';

/**
 * Runtime validation for the classifier question catalog, on the same terms as
 * `definitions-parse.ts`: zod is private to this module, everything exported is annotated with
 * the hand-written types from `classifier-questions-wire.ts`, and nothing here throws.
 */

const nonBlankString = z
  .string()
  .refine((value) => value.trim() !== '', 'Expected a non-blank string');

const questionSchema = z.object({
  name: nonBlankString,
  question: nonBlankString,
  type: z.enum(['noul', 'score']),
  criteriaTrue: z.string().nullish(),
  criteriaFalse: z.string().nullish(),
  levels: z.array(z.string()).nullish(),
});

// Questions are checked one by one below, so one bad question costs only itself.
const groupSchema = z.object({
  id: nonBlankString,
  questions: z.array(z.unknown()),
});

type QuestionSchemaOutput = z.infer<typeof questionSchema>;

/** The bidirectional pin between the private schema and the public mirror, on the hot path. */
function toWireQuestion(parsed: QuestionSchemaOutput): ClassifierQuestionWire {
  const asWire: ClassifierQuestionWire = parsed;
  const asSchemaOutput: QuestionSchemaOutput = asWire;
  return asSchemaOutput;
}

/** One group or question the payload carried that could not be validated. */
export interface ClassifierQuestionParseIssue {
  /** The group's position in the payload. */
  groupIndex: number;
  /** The question's position in its group; absent when the whole group was dropped. */
  questionIndex?: number;
  /** Human-readable summary of what failed, for logs. Not user-facing copy. */
  message: string;
}

export interface ClassifierQuestionsParseResult {
  /** Every group that validated, in payload order, holding the questions that did. */
  groups: ClassifierQuestionGroupWire[];
  /** Every group or question that did not. */
  invalid: ClassifierQuestionParseIssue[];
  /** Set when the payload was not an array at all; `groups` is then empty. */
  inputError?: string;
}

function describeInput(input: unknown): string {
  if (input === null) return 'null';
  if (Array.isArray(input)) return 'array';
  return typeof input;
}

function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Validate an unknown classifier question catalog.
 *
 * **Never throws.** A payload that is not an array yields an empty result plus `inputError`. A
 * group without a readable id or question list is dropped whole; inside a group each question
 * is checked on its own, so a malformed one is dropped and reported while its siblings stay.
 * A question the picker cannot place (a blank name or text, an unknown type) is malformed;
 * a score question with fewer than two levels is not, and renders as a yes/no question, as
 * Agents' picker does. Unknown keys are stripped. A group left with no questions is kept: the
 * picker hides it.
 */
export function parseClassifierQuestions(input: unknown): ClassifierQuestionsParseResult {
  if (!Array.isArray(input)) {
    return {
      groups: [],
      invalid: [],
      inputError: `Expected an array of classifier question groups, received ${describeInput(input)}.`,
    };
  }

  const groups: ClassifierQuestionGroupWire[] = [];
  const invalid: ClassifierQuestionParseIssue[] = [];

  // Index loops and every read inside a try, for the reasons `parseGuardrailDefinitions` gives:
  // a hostile payload must not escape a never-throws contract through a getter.
  for (let groupIndex = 0; groupIndex < input.length; groupIndex += 1) {
    let group: { id: string; questions: unknown[] };
    try {
      const result = groupSchema.safeParse(input[groupIndex]);
      if (!result.success) {
        invalid.push({ groupIndex, message: describeIssues(result.error) });
        continue;
      }
      group = result.data;
    } catch (error: unknown) {
      invalid.push({ groupIndex, message: messageOf(error) });
      continue;
    }

    const questions: ClassifierQuestionWire[] = [];
    for (let questionIndex = 0; questionIndex < group.questions.length; questionIndex += 1) {
      try {
        const result = questionSchema.safeParse(group.questions[questionIndex]);
        if (result.success) {
          questions.push(toWireQuestion(result.data));
        } else {
          invalid.push({ groupIndex, questionIndex, message: describeIssues(result.error) });
        }
      } catch (error: unknown) {
        invalid.push({ groupIndex, questionIndex, message: messageOf(error) });
      }
    }
    groups.push({ id: group.id, questions });
  }

  return { groups, invalid };
}
