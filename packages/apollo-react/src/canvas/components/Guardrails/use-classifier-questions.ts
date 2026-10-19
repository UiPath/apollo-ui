import { useMemo } from 'react';
import { type GuardrailCopyTable, useGuardrailDefinitionCopy } from './definitions-copy';
import { type ClassifierQuestionsParseResult, parseClassifierQuestions } from './definitions-parse';
import type { ClassifierQuestionGroupWire } from './definitions-wire';
import {
  type GuardrailDefinitionsRequestContext,
  useGuardrailsRequest,
} from './use-guardrails-request';

export const CLASSIFIER_QUESTIONS_PATH = '/api/execution/guardrails/classifier-questions';

/** A predefined question, verbatim as the validator runs it. */
export interface ClassifierQuestion {
  /** What `selectedQuestions` and `questionThresholds` store. */
  name: string;
  question: string;
  type: 'noul' | 'score';
  criteriaTrue?: string;
  criteriaFalse?: string;
  /** Lowest first; level 0 is the benign baseline. */
  levels?: string[];
}

export interface ClassifierQuestionCategory {
  id: string;
  /** The curated heading, else the raw id. */
  label: string;
  questions: ClassifierQuestion[];
}

export interface UseClassifierQuestionsOptions {
  /** A catalog the host already holds; no request is made. Compared by identity. */
  questions?: unknown;
  /** Overrides the lingui-backed headings. Compared by identity. */
  copy?: GuardrailCopyTable;
  /** Whether the hook may fetch, as in `useGuardrailDefinitions`. Defaults to `true`. */
  enabled?: boolean;
}

export interface UseClassifierQuestionsResult {
  categories: ClassifierQuestionCategory[];
  wire: ClassifierQuestionGroupWire[];
  invalid: ClassifierQuestionsParseResult['invalid'];
  inputError?: string;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const EMPTY_RESULT: ClassifierQuestionsParseResult = { groups: [], invalid: [] };

function toCategory(
  group: ClassifierQuestionGroupWire,
  headings: Record<string, string>
): ClassifierQuestionCategory {
  return {
    id: group.id,
    label: (Object.hasOwn(headings, group.id) && headings[group.id]) || group.id,
    questions: group.questions.map(({ criteriaTrue, criteriaFalse, levels, ...question }) => ({
      ...question,
      ...(criteriaTrue != null ? { criteriaTrue } : {}),
      ...(criteriaFalse != null ? { criteriaFalse } : {}),
      ...(levels != null ? { levels } : {}),
    })),
  };
}

/**
 * The classifier's predefined questions by category, headings resolved from the curated copy.
 * The same context, host shapes and request behaviour as `useGuardrailDefinitions`: a context
 * to fetch, `null` plus `questions` for a catalog the host already holds, `null` alone to idle.
 */
export function useClassifierQuestions(
  ctx: GuardrailDefinitionsRequestContext | null,
  options: UseClassifierQuestionsOptions = {}
): UseClassifierQuestionsResult {
  const { questions: provided, copy: copyOverride, enabled = true } = options;
  const linguiCopy = useGuardrailDefinitionCopy();
  const copy = copyOverride ?? linguiCopy;

  const {
    data: fetched,
    loading,
    error,
    refetch,
  } = useGuardrailsRequest(ctx, {
    path: CLASSIFIER_QUESTIONS_PATH,
    endpointName: 'Classifier questions',
    parse: parseClassifierQuestions,
    empty: EMPTY_RESULT,
    enabled: enabled && provided === undefined,
  });

  const parsed = useMemo(
    () => (provided === undefined ? fetched : parseClassifierQuestions(provided)),
    [provided, fetched]
  );
  const categories = useMemo(() => {
    const headings = copy.classifier?.categoryLabels ?? {};
    return parsed.groups.map((group) => toCategory(group, headings));
  }, [parsed.groups, copy]);

  return {
    categories,
    wire: parsed.groups,
    invalid: parsed.invalid,
    inputError: parsed.inputError,
    loading,
    error,
    refetch,
  };
}
