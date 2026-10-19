import { Button, cn, FormField, FormFieldError, Input, Label, Textarea } from '@uipath/apollo-wind';
import { Plus, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import {
  CLASSIFIER_DEFAULT_THRESHOLD,
  type ClassifierCustomQuestion,
  sanitizeClassifierCustomQuestions,
} from './classifier-utils';
import { ClassifierThresholdSlider } from './components/classifier-threshold-slider';
import { ParameterLabel } from './components/parameter-label';
import {
  formatGuardrailFormMessage,
  type GuardrailClassifierLabels,
  useGuardrailClassifierLabels,
} from './i18n';
import type { GuardrailParameterDefinition } from './types';

// Mirrors the backend's cap on a custom question's criteria.
const CRITERIA_MAX_LENGTH = 500;

export interface ClassifierCustomQuestionsEditorProps {
  /** The `questions` definition: label, tooltip, required, `maxItems`, `maxLength`. */
  parameter: GuardrailParameterDefinition;
  /** `readClassifierCustomQuestions(parameters)`. */
  rows: readonly ClassifierCustomQuestion[];
  /** Every row, blank ones included; `writeClassifierCustomQuestions` persists the rest. */
  onRowsChange: (rows: ClassifierCustomQuestion[]) => void;
  error?: string;
  labels?: Partial<GuardrailClassifierLabels>;
  className?: string;
}

const serialize = (rows: readonly ClassifierCustomQuestion[]) =>
  JSON.stringify(sanitizeClassifierCustomQuestions(rows));

/**
 * The author's own classifier questions, each with its Strictness and optional "counts as yes" /
 * "counts as no". Rows live in local state so a new, blank row can be typed into; they reseed
 * only when the persisted rows change from outside, not on the echo of an edit.
 */
export function ClassifierCustomQuestionsEditor({
  parameter,
  rows: persistedRows,
  onRowsChange,
  error,
  labels: labelOverrides,
  className,
}: ClassifierCustomQuestionsEditorProps) {
  const labels = useGuardrailClassifierLabels(labelOverrides);
  const uid = useId();
  const [rows, setRows] = useState<ClassifierCustomQuestion[]>(() => [...persistedRows]);
  // Stable keys, so removing a row does not hand its DOM and focus to the next one.
  const lastKey = useRef(0);
  const newKey = () => ++lastKey.current;
  const [keys, setKeys] = useState<number[]>(() => persistedRows.map(newKey));

  const incoming = serialize(persistedRows);
  const [seededFrom, setSeededFrom] = useState(incoming);
  if (incoming !== seededFrom) {
    setSeededFrom(incoming);
    if (incoming !== serialize(rows)) {
      setRows([...persistedRows]);
      setKeys(persistedRows.map(newKey));
    }
  }

  const update = (next: ClassifierCustomQuestion[], nextKeys = keys) => {
    setRows(next);
    setKeys(nextKeys);
    onRowsChange(next);
  };
  const updateRow = (index: number, patch: Partial<ClassifierCustomQuestion>) =>
    update(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <FormField data-slot="classifier-custom-questions-editor" className={cn('gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <ParameterLabel paramDef={parameter} labels={labels} asTextHeader />
        {rows.length < (parameter.maxItems ?? Number.POSITIVE_INFINITY) && (
          <Button
            type="button"
            variant="ghost"
            size="2xs"
            onClick={() => update([...rows, { question: '' }], [...keys, newKey()])}
          >
            <Plus aria-hidden="true" />
            {labels.addQuestion}
          </Button>
        )}
      </div>
      <div className="grid gap-4">
        {rows.map((row, index) => {
          const key = keys[index];
          const named = (template: string) =>
            formatGuardrailFormMessage(template, { label: parameter.label, position: index + 1 });
          return (
            <div key={key} className="grid gap-2">
              <div className="flex items-start gap-2">
                <Textarea
                  value={row.question}
                  rows={2}
                  placeholder={labels.questionPlaceholder}
                  aria-label={named(labels.customQuestion)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${uid}-error` : undefined}
                  maxLength={parameter.maxLength}
                  className="resize-y"
                  onChange={(e) => updateRow(index, { question: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon
                  aria-label={named(labels.removeCustomQuestion)}
                  onClick={() =>
                    update(
                      rows.filter((_, i) => i !== index),
                      keys.filter((_, i) => i !== index)
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <div className="grid gap-2 pr-10 pl-4">
                <ClassifierThresholdSlider
                  value={row.threshold ?? CLASSIFIER_DEFAULT_THRESHOLD}
                  ariaLabel={named(labels.customQuestionStrictness)}
                  labels={labels}
                  onChange={(threshold) => updateRow(index, { threshold })}
                />
                <div className="grid gap-1">
                  <Label htmlFor={`${uid}-yes-${key}`} variant="muted">
                    {labels.criteriaTrueLabel}
                  </Label>
                  <Input
                    id={`${uid}-yes-${key}`}
                    value={row.criteriaTrue ?? ''}
                    placeholder={labels.criteriaTruePlaceholder}
                    maxLength={CRITERIA_MAX_LENGTH}
                    onChange={(e) => updateRow(index, { criteriaTrue: e.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${uid}-no-${key}`} variant="muted">
                    {labels.criteriaFalseLabel}
                  </Label>
                  <Input
                    id={`${uid}-no-${key}`}
                    value={row.criteriaFalse ?? ''}
                    placeholder={labels.criteriaFalsePlaceholder}
                    maxLength={CRITERIA_MAX_LENGTH}
                    onChange={(e) => updateRow(index, { criteriaFalse: e.target.value })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <FormFieldError id={`${uid}-error`}>{error}</FormFieldError>
    </FormField>
  );
}
