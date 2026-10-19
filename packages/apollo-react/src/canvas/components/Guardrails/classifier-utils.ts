/**
 * Pure helpers for the `classifier` validator's parameters (UiPath/Agents#6449). React-free, so a
 * host's save path and its legacy screens can use them as they are.
 */

/** The raw validator id. */
export const CLASSIFIER_VALIDATOR = 'classifier';

/** The classifier's parameter ids, as the definition declares them. */
export const CLASSIFIER_PARAMETER_IDS = {
  /** `enum-list` of predefined question names. */
  selectedQuestions: 'selectedQuestions',
  /** `map-enum` keyed by `selectedQuestions`: 0..1 for each tuned question. */
  questionThresholds: 'questionThresholds',
  /** `text-list` of the author's own yes/no questions. */
  questions: 'questions',
  /** `enum` with no options: the host's model picker. */
  model: 'model',
  /** `text`, required: the chosen model's vendor, written by the host's model picker. */
  modelVendor: 'modelVendor',
} as const;

/** What the backend applies to a question with no threshold of its own. */
export const CLASSIFIER_DEFAULT_THRESHOLD = 0.5;

/** Cap on a custom question's "counts as yes" / "counts as no"; the backend's own limit. */
export const CLASSIFIER_CRITERIA_MAX_LENGTH = 500;

// Undeclared sidecars keyed by the custom question's position in `questions`, so
// `questionCriteriaTrue.0` belongs to the first one. Sidecars of existing types rather than a
// new `$parameterType`, which both this package's parser and the Python SDK would reject.
const CRITERIA_TRUE_PREFIX = 'questionCriteriaTrue.';
const CRITERIA_FALSE_PREFIX = 'questionCriteriaFalse.';
const THRESHOLD_PREFIX = 'questionThreshold.';

const THRESHOLD_EPSILON = 0.0001;

/** One of the author's own questions, with its optional definitions and threshold. */
export interface ClassifierCustomQuestion {
  question: string;
  /** What counts as yes, which flags. Blank means the backend's generic criterion. */
  criteriaTrue?: string;
  /** What counts as no. */
  criteriaFalse?: string;
  /** 0..1; absent means `CLASSIFIER_DEFAULT_THRESHOLD`. */
  threshold?: number;
}

/**
 * The wire shape these helpers rely on. Each product carries parameters as its own union with
 * this shape, so any of them is accepted and returned as it came in.
 */
export interface ClassifierParameterLike {
  id: string;
  $parameterType: string;
  value?: unknown;
}

const isDefaultThreshold = (threshold: number | undefined) =>
  threshold === undefined || Math.abs(threshold - CLASSIFIER_DEFAULT_THRESHOLD) < THRESHOLD_EPSILON;

/** The author's questions with the sidecars that belong to each, in order. */
export function readClassifierCustomQuestions(
  parameters: readonly ClassifierParameterLike[]
): ClassifierCustomQuestion[] {
  const stored = parameters.find((p) => p.id === CLASSIFIER_PARAMETER_IDS.questions)?.value;
  const questions = Array.isArray(stored)
    ? stored.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const textById = new Map<string, string>();
  const numberById = new Map<string, number>();
  for (const p of parameters) {
    if (p.$parameterType === 'text' && typeof p.value === 'string') textById.set(p.id, p.value);
    if (p.$parameterType === 'number' && typeof p.value === 'number') numberById.set(p.id, p.value);
  }
  return questions.map((question, index) => {
    const row: ClassifierCustomQuestion = { question };
    const criteriaTrue = textById.get(`${CRITERIA_TRUE_PREFIX}${index}`);
    const criteriaFalse = textById.get(`${CRITERIA_FALSE_PREFIX}${index}`);
    const threshold = numberById.get(`${THRESHOLD_PREFIX}${index}`);
    if (criteriaTrue !== undefined) row.criteriaTrue = criteriaTrue;
    if (criteriaFalse !== undefined) row.criteriaFalse = criteriaFalse;
    if (threshold !== undefined) row.threshold = threshold;
    return row;
  });
}

/**
 * The rows as they persist: a row with a blank question is dropped, a blank criterion becomes
 * absent and a threshold at the default is omitted. Dropping blank rows here, rather than
 * leaving them to the builder's save-time trim, is what keeps the sidecar indexes pointing at
 * the right question.
 */
export function sanitizeClassifierCustomQuestions(
  rows: readonly ClassifierCustomQuestion[]
): ClassifierCustomQuestion[] {
  return rows
    .filter((row) => row.question.trim().length > 0)
    .map((row) => {
      const clean: ClassifierCustomQuestion = { question: row.question };
      if (row.criteriaTrue?.trim()) clean.criteriaTrue = row.criteriaTrue;
      if (row.criteriaFalse?.trim()) clean.criteriaFalse = row.criteriaFalse;
      if (!isDefaultThreshold(row.threshold)) clean.threshold = row.threshold;
      return clean;
    });
}

/**
 * `parameters` with `questions` and every classifier sidecar replaced by `rows`. The sidecars are
 * rebuilt from scratch on every write, so a reorder or a removal never leaves a stale pair
 * behind; with no question left, `questions` is dropped too. Everything else passes through.
 */
export function writeClassifierCustomQuestions<P extends ClassifierParameterLike>(
  parameters: readonly P[],
  rows: readonly ClassifierCustomQuestion[]
): P[] {
  const kept = parameters.filter(
    (p) =>
      p.id !== CLASSIFIER_PARAMETER_IDS.questions &&
      !p.id.startsWith(CRITERIA_TRUE_PREFIX) &&
      !p.id.startsWith(CRITERIA_FALSE_PREFIX) &&
      !p.id.startsWith(THRESHOLD_PREFIX)
  );
  const clean = sanitizeClassifierCustomQuestions(rows);
  if (clean.length === 0) return kept;

  const written: ClassifierParameterLike[] = [
    {
      $parameterType: 'text-list',
      id: CLASSIFIER_PARAMETER_IDS.questions,
      value: clean.map((row) => row.question),
    },
  ];
  clean.forEach((row, index) => {
    if (row.criteriaTrue !== undefined) {
      written.push({
        $parameterType: 'text',
        id: `${CRITERIA_TRUE_PREFIX}${index}`,
        value: row.criteriaTrue,
      });
    }
    if (row.criteriaFalse !== undefined) {
      written.push({
        $parameterType: 'text',
        id: `${CRITERIA_FALSE_PREFIX}${index}`,
        value: row.criteriaFalse,
      });
    }
    if (row.threshold !== undefined) {
      written.push({
        $parameterType: 'number',
        id: `${THRESHOLD_PREFIX}${index}`,
        value: row.threshold,
      });
    }
  });
  // The caller's own union has the same shape; these entries are built to it.
  return [...kept, ...(written as P[])];
}

/**
 * Whether the parameters ask anything: a predefined question selected, or a non-blank question
 * of the author's own. The classifier saves with neither (both parameters are optional), so a
 * host gates Save on this; `useClassifierGuardrailParameters` wraps it with its message.
 */
export function hasClassifierQuestions(
  parameters: readonly Pick<ClassifierParameterLike, 'id' | 'value'>[]
): boolean {
  const valueFor = (id: string) => parameters.find((p) => p.id === id)?.value;
  const selected = valueFor(CLASSIFIER_PARAMETER_IDS.selectedQuestions);
  const custom = valueFor(CLASSIFIER_PARAMETER_IDS.questions);
  return (
    (Array.isArray(selected) && selected.length > 0) ||
    (Array.isArray(custom) &&
      custom.some((question) => typeof question === 'string' && question.trim() !== ''))
  );
}

/**
 * A score question's cutoff "flag at level `i` and above" as the 0..1 the backend compares the
 * graded level against: `i / (levels - 1)`.
 */
export function classifierLevelToThreshold(levelIndex: number, levelCount: number): number {
  return levelCount <= 1 ? 1 : levelIndex / (levelCount - 1);
}

/**
 * The level a stored 0..1 threshold reads back as: the nearest one, never the benign level 0,
 * which is no cutoff at all.
 */
export function classifierThresholdToLevel(threshold: number, levelCount: number): number {
  return levelCount <= 1
    ? 1
    : Math.min(levelCount - 1, Math.max(1, Math.round(threshold * (levelCount - 1))));
}

export type ClassifierSeverityTier = 'low' | 'moderate' | 'high' | 'critical';

const MIDDLE_TIERS: readonly ClassifierSeverityTier[] = ['low', 'moderate', 'high'];

/**
 * The short tier a level shows as, since the level's own sentence is the classifier's grading
 * rubric and reads as clutter in a picker. The top level is always critical; the levels between
 * the benign baseline and the top spread over low, moderate and high.
 */
export function getClassifierSeverityTier(
  levelIndex: number,
  levelCount: number
): ClassifierSeverityTier {
  if (levelIndex >= levelCount - 1) return 'critical';
  // Middle cutoffs are 1..levelCount-2: 0 is the baseline, levelCount-1 is critical.
  const middleCount = levelCount - 2;
  const position = middleCount > 1 ? (levelIndex - 1) / (middleCount - 1) : 0;
  const tier = Math.round(position * (MIDDLE_TIERS.length - 1));
  return MIDDLE_TIERS[Math.min(MIDDLE_TIERS.length - 1, Math.max(0, tier))] ?? 'low';
}
