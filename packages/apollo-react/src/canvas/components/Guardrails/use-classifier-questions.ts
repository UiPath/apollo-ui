import { useMemo } from 'react';
import {
  type ClassifierQuestionCategory,
  enrichClassifierQuestions,
} from './classifier-questions-enrich';
import {
  type ClassifierQuestionParseIssue,
  type ClassifierQuestionsParseResult,
  parseClassifierQuestions,
} from './classifier-questions-parse';
import type { ClassifierQuestionGroupWire } from './classifier-questions-wire';
import { type GuardrailCopyTable, useGuardrailDefinitionCopy } from './definitions-copy';
import {
  type GuardrailDefinitionsRequestContext,
  useGuardrailsRequest,
} from './use-guardrails-request';

/** Path of the classifier question catalog, appended to `baseUrl`. */
export const CLASSIFIER_QUESTIONS_PATH = '/api/execution/guardrails/classifier-questions';

export interface UseClassifierQuestionsOptions {
  /**
   * A catalog the host already has. When present no request is made, which is how a product
   * keeps its own transport. Compared by **identity**: pass a stable reference.
   */
  questions?: unknown;
  /**
   * Override the lingui-backed copy the category headings come from, e.g. to pin English in a
   * test. Compared by **identity**.
   */
  copy?: GuardrailCopyTable;
  /**
   * Whether the hook may fetch. Defaults to `true`. The catalog only matters while a classifier
   * guardrail is open, so a host mounting the hook higher up passes
   * `enabled: definition?.validator === 'classifier'`; a host feeding `questions` from its own
   * cache passes `enabled: !isLoading`, for the reason `useGuardrailDefinitions` gives.
   */
  enabled?: boolean;
}

export interface UseClassifierQuestionsResult {
  /** Display-ready categories, ready to hand to the classifier editors. */
  categories: ClassifierQuestionCategory[];
  /** The validated wire groups behind them. */
  wire: ClassifierQuestionGroupWire[];
  /** Groups and questions dropped during validation. */
  invalid: ClassifierQuestionParseIssue[];
  /** Set when the payload was not an array at all. */
  inputError?: string;
  loading: boolean;
  /** Transport failure. Validation failures are reported through `invalid`, not here. */
  error: Error | null;
  refetch: () => void;
}

const EMPTY_RESULT: ClassifierQuestionsParseResult = { groups: [], invalid: [] };

/**
 * Load the classifier's predefined questions, grouped by category, with the headings resolved.
 *
 * The same three host shapes as `useGuardrailDefinitions`, and the same request behaviour
 * underneath (one shared core): a context to fetch, `null` plus `options.questions` to parse
 * and enrich a catalog the host already holds, and `null` alone to stay idle. The context is
 * the very object `useGuardrailDefinitions` takes, and is compared by content. Never throws: a
 * transport failure lands in `error`, a malformed catalog in `invalid` / `inputError`, and a
 * failed refetch keeps the previous catalog.
 *
 * Re-enriches when the locale changes, through the copy table.
 */
export function useClassifierQuestions(
  ctx: GuardrailDefinitionsRequestContext | null,
  options: UseClassifierQuestionsOptions = {}
): UseClassifierQuestionsResult {
  const { questions: provided, copy: copyOverride, enabled: enabledOption = true } = options;

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
    enabled: enabledOption && provided === undefined,
  });

  const parsed = useMemo(
    () => (provided === undefined ? fetched : parseClassifierQuestions(provided)),
    [provided, fetched]
  );

  const categories = useMemo(
    () => enrichClassifierQuestions(parsed.groups, { copy }),
    [parsed.groups, copy]
  );

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
