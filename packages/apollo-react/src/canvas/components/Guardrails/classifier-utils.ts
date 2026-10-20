/** Pure helpers for the `classifier` validator's parameters (UiPath/Agents#6449). */

export const CLASSIFIER_VALIDATOR = 'classifier';

export const CLASSIFIER_PARAMETER_IDS = {
  selectedQuestions: 'selectedQuestions',
  questionThresholds: 'questionThresholds',
  questions: 'questions',
  model: 'model',
  modelVendor: 'modelVendor',
} as const;

/** What the backend applies to a question with no threshold of its own. */
export const CLASSIFIER_DEFAULT_THRESHOLD = 0.5;

// Sidecars keyed by the custom question's position in `questions`: `questionCriteriaTrue.0`
// belongs to the first. Existing types rather than a new `$parameterType`, which this package's
// parser and the Python SDK would both reject.
const CRITERIA_TRUE_PREFIX = 'questionCriteriaTrue.';
const CRITERIA_FALSE_PREFIX = 'questionCriteriaFalse.';
const THRESHOLD_PREFIX = 'questionThreshold.';

export interface ClassifierCustomQuestion {
  question: string;
  /** What counts as yes (flags). Absent means the backend's generic criterion. */
  criteriaTrue?: string;
  criteriaFalse?: string;
  /** Absent means `CLASSIFIER_DEFAULT_THRESHOLD`. */
  threshold?: number;
}

/** The parameter shape these helpers need; each product's own union fits it. */
export interface ClassifierParameterLike {
  id: string;
  $parameterType: string;
  value?: unknown;
}

/** The author's questions, each with the sidecars at its position. */
export function readClassifierCustomQuestions(
  parameters: readonly ClassifierParameterLike[]
): ClassifierCustomQuestion[] {
  const stored = parameters.find((p) => p.id === CLASSIFIER_PARAMETER_IDS.questions)?.value;
  const questions = Array.isArray(stored)
    ? stored.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const valueFor = (id: string) => parameters.find((p) => p.id === id)?.value;
  return questions.map((question, index) => {
    const row: ClassifierCustomQuestion = { question };
    const criteriaTrue = valueFor(`${CRITERIA_TRUE_PREFIX}${index}`);
    const criteriaFalse = valueFor(`${CRITERIA_FALSE_PREFIX}${index}`);
    const threshold = valueFor(`${THRESHOLD_PREFIX}${index}`);
    if (typeof criteriaTrue === 'string') row.criteriaTrue = criteriaTrue;
    if (typeof criteriaFalse === 'string') row.criteriaFalse = criteriaFalse;
    if (typeof threshold === 'number') row.threshold = threshold;
    return row;
  });
}

/** The rows as they persist: no blank question, no blank criterion, no default threshold. */
export function sanitizeClassifierCustomQuestions(
  rows: readonly ClassifierCustomQuestion[]
): ClassifierCustomQuestion[] {
  return rows
    .filter((row) => row.question.trim() !== '')
    .map(({ question, criteriaTrue, criteriaFalse, threshold }) => ({
      question,
      ...(criteriaTrue?.trim() ? { criteriaTrue } : {}),
      ...(criteriaFalse?.trim() ? { criteriaFalse } : {}),
      ...(threshold !== undefined && Math.abs(threshold - CLASSIFIER_DEFAULT_THRESHOLD) > 1e-4
        ? { threshold }
        : {}),
    }));
}

/**
 * `parameters` with `questions` and its sidecars replaced by `rows`. The sidecars are rebuilt
 * from scratch, so a removed or blank row never leaves one pointing at the wrong question.
 */
export function writeClassifierCustomQuestions<P extends ClassifierParameterLike>(
  parameters: readonly P[],
  rows: readonly ClassifierCustomQuestion[]
): P[] {
  const kept = parameters.filter(
    (p) =>
      p.id !== CLASSIFIER_PARAMETER_IDS.questions &&
      ![CRITERIA_TRUE_PREFIX, CRITERIA_FALSE_PREFIX, THRESHOLD_PREFIX].some((prefix) =>
        p.id.startsWith(prefix)
      )
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
  return [...kept, ...(written as P[])];
}

/**
 * Whether there is a question to ask: one selected, or a non-blank one of the author's own.
 * Neither parameter is required on its own, so this is the save gate.
 */
export function hasClassifierQuestions(
  parameters: readonly Pick<ClassifierParameterLike, 'id' | 'value'>[]
): boolean {
  const valueFor = (id: string) => parameters.find((p) => p.id === id)?.value;
  const selected = valueFor(CLASSIFIER_PARAMETER_IDS.selectedQuestions);
  const custom = valueFor(CLASSIFIER_PARAMETER_IDS.questions);
  return (
    (Array.isArray(selected) && selected.length > 0) ||
    (Array.isArray(custom) && custom.some((q) => typeof q === 'string' && q.trim() !== ''))
  );
}
