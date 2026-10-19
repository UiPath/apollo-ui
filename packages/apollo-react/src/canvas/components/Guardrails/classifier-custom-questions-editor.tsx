import {
  Button,
  cn,
  FormField,
  FormFieldError,
  InfoTooltip,
  Input,
  Label,
  RequiredIndicator,
  Textarea,
} from '@uipath/apollo-wind';
import { Plus, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import {
  CLASSIFIER_CRITERIA_MAX_LENGTH,
  CLASSIFIER_DEFAULT_THRESHOLD,
  type ClassifierCustomQuestion,
  sanitizeClassifierCustomQuestions,
} from './classifier-utils';
import { ClassifierThresholdSlider } from './components/classifier-threshold-slider';
import {
  formatGuardrailFormMessage,
  type GuardrailClassifierLabels,
  useGuardrailClassifierLabels,
} from './i18n';

export interface ClassifierCustomQuestionsEditorProps {
  /** The persisted rows: `readClassifierCustomQuestions(parameters)`. */
  rows: readonly ClassifierCustomQuestion[];
  /**
   * Every edit, with every row the editor holds, blank ones included. Write them with
   * `writeClassifierCustomQuestions`, which persists only the rows with a question.
   */
  onRowsChange: (rows: ClassifierCustomQuestion[]) => void;
  /** The parameter's label, pre-resolved (the definition's). */
  label: string;
  /** The parameter's tooltip, pre-resolved. */
  tooltip?: string;
  required?: boolean;
  /** Cap on the number of questions; the add button goes once it is reached. */
  maxItems?: number;
  /** Cap on a question's length. */
  maxLength?: number;
  /** Shown under the editor. */
  error?: string;
  /** Per-string overrides; take precedence over the ambient lingui catalog. */
  labels?: Partial<GuardrailClassifierLabels>;
  className?: string;
}

const serialize = (rows: readonly ClassifierCustomQuestion[]) =>
  JSON.stringify(sanitizeClassifierCustomQuestions(rows));

/**
 * The author's own classifier questions: each row is a yes/no question where yes flags, its
 * Strictness, and optional "counts as yes" / "counts as no" definitions. The classifier anchors
 * its calibration on those definitions, so a crisp question works bare and a judgment call
 * benefits from them.
 *
 * Rows live in local state, so a row just added can be typed into before it holds anything;
 * only rows with a question reach the parameters. The local rows are reseeded from `rows` only
 * when the persisted value changes from outside (an undo, a reopened guardrail), never by the
 * echo of the editor's own edit. Requires an ancestor `TooltipProvider` when `tooltip` is set.
 */
export function ClassifierCustomQuestionsEditor({
  rows: persistedRows,
  onRowsChange,
  label,
  tooltip,
  required = false,
  maxItems = Number.POSITIVE_INFINITY,
  maxLength,
  error,
  labels: labelOverrides,
  className,
}: ClassifierCustomQuestionsEditorProps) {
  const labels = useGuardrailClassifierLabels(labelOverrides);
  const uid = useId();

  const [rows, setRows] = useState<ClassifierCustomQuestion[]>(() => [...persistedRows]);
  // Stable keys, so removing row N does not hand row N+1's DOM (and focus) to its neighbour.
  const nextKey = useRef(0);
  const newKey = () => {
    nextKey.current += 1;
    return nextKey.current;
  };
  const [keys, setKeys] = useState<number[]>(() => persistedRows.map(newKey));

  // Adjusting state during render, React's pattern for state derived from a prop. While the user
  // types, the persisted rows are the sanitized local rows, so this stays quiet.
  const incoming = serialize(persistedRows);
  const [seededFrom, setSeededFrom] = useState(incoming);
  if (incoming !== seededFrom) {
    setSeededFrom(incoming);
    if (incoming !== serialize(rows)) {
      setRows([...persistedRows]);
      setKeys(persistedRows.map(newKey));
    }
  }

  const update = (next: ClassifierCustomQuestion[], nextKeys: number[] = keys) => {
    setRows(next);
    setKeys(nextKeys);
    onRowsChange(next);
  };

  const updateRow = (index: number, patch: Partial<ClassifierCustomQuestion>) =>
    update(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addRow = () => update([...rows, { question: '' }], [...keys, newKey()]);

  const removeRow = (index: number) =>
    update(
      rows.filter((_, i) => i !== index),
      keys.filter((_, i) => i !== index)
    );

  const marks = {
    strict: labels.thresholdStrict,
    balanced: labels.thresholdBalanced,
    lenient: labels.thresholdLenient,
  };

  return (
    <FormField data-slot="classifier-custom-questions-editor" className={cn('gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-foreground">
          {label}
          {required && <RequiredIndicator />}
          {tooltip && <InfoTooltip content={tooltip} aria-label={labels.moreInformation} />}
        </div>
        {rows.length < maxItems && (
          <Button type="button" variant="ghost" size="2xs" onClick={addRow}>
            <Plus aria-hidden="true" />
            {labels.addQuestion}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {rows.map((row, index) => {
          const position = index + 1;
          const trueId = `${uid}-criteria-true-${keys[index]}`;
          const falseId = `${uid}-criteria-false-${keys[index]}`;
          return (
            <div key={keys[index]} data-slot="classifier-custom-question" className="grid gap-2">
              <div className="flex items-start gap-2">
                <Textarea
                  value={row.question}
                  rows={2}
                  placeholder={labels.questionPlaceholder}
                  aria-label={formatGuardrailFormMessage(labels.customQuestion, {
                    label,
                    position,
                  })}
                  aria-invalid={error ? true : undefined}
                  maxLength={maxLength}
                  className="resize-y"
                  onChange={(e) => updateRow(index, { question: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon
                  aria-label={formatGuardrailFormMessage(labels.removeCustomQuestion, {
                    label,
                    position,
                  })}
                  onClick={() => removeRow(index)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              {/* Indented under the question, as its refinement rather than a sibling field. */}
              <div className="grid gap-2 pr-10 pl-4">
                <ClassifierThresholdSlider
                  label={labels.strictnessLabel}
                  value={row.threshold ?? CLASSIFIER_DEFAULT_THRESHOLD}
                  ariaLabel={formatGuardrailFormMessage(labels.customQuestionStrictness, {
                    label,
                    position,
                  })}
                  marks={marks}
                  onChange={(threshold) => updateRow(index, { threshold })}
                />
                <div className="grid gap-1">
                  <Label htmlFor={trueId} variant="muted">
                    {labels.criteriaTrueLabel}
                  </Label>
                  <Input
                    id={trueId}
                    value={row.criteriaTrue ?? ''}
                    placeholder={labels.criteriaTruePlaceholder}
                    maxLength={CLASSIFIER_CRITERIA_MAX_LENGTH}
                    onChange={(e) => updateRow(index, { criteriaTrue: e.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={falseId} variant="muted">
                    {labels.criteriaFalseLabel}
                  </Label>
                  <Input
                    id={falseId}
                    value={row.criteriaFalse ?? ''}
                    placeholder={labels.criteriaFalsePlaceholder}
                    maxLength={CLASSIFIER_CRITERIA_MAX_LENGTH}
                    onChange={(e) => updateRow(index, { criteriaFalse: e.target.value })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
}
