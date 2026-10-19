import { FormFieldError } from '@uipath/apollo-wind';
import { type ReactNode, useCallback, useState } from 'react';
import type { GuardrailDefinition } from './builder-types';
import { ClassifierCustomQuestionsEditor } from './classifier-custom-questions-editor';
import { ClassifierQuestionPicker } from './classifier-question-picker';
import type { ClassifierQuestionCategory } from './classifier-questions-enrich';
import {
  CLASSIFIER_PARAMETER_IDS,
  CLASSIFIER_VALIDATOR,
  type ClassifierParameterLike,
  hasClassifierQuestions,
  readClassifierCustomQuestions,
  writeClassifierCustomQuestions,
} from './classifier-utils';
import { type GuardrailClassifierLabels, useGuardrailClassifierLabels } from './i18n';
import type { GuardrailParameterRenderContext, GuardrailValidatorParameter } from './types';

export interface UseClassifierGuardrailParametersOptions {
  /**
   * The definition the builder is open on. Nothing is claimed unless it is the built-in
   * classifier: a bring-your-own definition reusing the id renders generically.
   */
  definition: Pick<GuardrailDefinition, 'validator' | 'byoValidatorName'> | undefined;
  /** The question catalog: `useClassifierQuestions(...).categories`. */
  categories: readonly ClassifierQuestionCategory[];
  /** Per-string overrides for the editors' chrome. */
  labels?: Partial<GuardrailClassifierLabels>;
}

export interface ClassifierGuardrailParameters {
  /**
   * The parameter ids `renderParameter` claims: `selectedQuestions`, `questionThresholds`,
   * `questions` and `modelVendor`. Empty for any other definition. Spread into the builder's
   * `overrideParameterIds` next to the host's own.
   */
  overrideParameterIds: readonly string[];
  /**
   * The classifier's editors, for the builder's `renderParameter`. Returns `undefined` for every
   * id it does not claim, `model` included, so the host's renderer composes after it:
   * `(ctx) => classifier.renderParameter(ctx) ?? renderModelPicker(ctx)`.
   */
  renderParameter: (ctx: GuardrailParameterRenderContext) => ReactNode | undefined;
  /**
   * The save gate for the one rule the builder cannot know: the classifier needs a question,
   * predefined or the author's own, though neither parameter is required on its own. Call it
   * from `onSave` with the saved `validatorParameters`; on `false` the picker says why and the
   * host should not persist. Always `true` for any other definition.
   */
  validateParameters: (
    parameters: readonly Pick<ClassifierParameterLike, 'id' | 'value'>[]
  ) => boolean;
}

const CLAIMED_IDS: readonly string[] = Object.freeze([
  CLASSIFIER_PARAMETER_IDS.selectedQuestions,
  CLASSIFIER_PARAMETER_IDS.questionThresholds,
  CLASSIFIER_PARAMETER_IDS.questions,
  CLASSIFIER_PARAMETER_IDS.modelVendor,
]);

const NOTHING_CLAIMED: readonly string[] = Object.freeze([]);

/** Replace the parameter in place, append it, or drop it when `next` is `undefined`. */
function upsert(
  parameters: GuardrailValidatorParameter[],
  id: string,
  next: GuardrailValidatorParameter | undefined
): GuardrailValidatorParameter[] {
  if (next === undefined) return parameters.filter((p) => p.id !== id);
  return parameters.some((p) => p.id === id)
    ? parameters.map((p) => (p.id === id ? next : p))
    : [...parameters, next];
}

const isMap = (value: unknown): value is Record<string, number> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Everything a host composes into `GuardrailBuilder` to make the classifier guardrail usable,
 * the same in both products:
 *
 * ```tsx
 * const { categories } = useClassifierQuestions(ctx, { enabled: isClassifier });
 * const classifier = useClassifierGuardrailParameters({ definition, categories });
 *
 * <GuardrailBuilder
 *   renderParameter={(c) => classifier.renderParameter(c) ?? renderModelPicker(c)}
 *   overrideParameterIds={[...classifier.overrideParameterIds, 'model']}
 *   onSave={(value) => classifier.validateParameters(value.validatorParameters) && persist(value)}
 * />
 * ```
 *
 * `selectedQuestions` and `questionThresholds` render as one `ClassifierQuestionPicker` and are
 * written together; `questions` and its position-keyed sidecars as one
 * `ClassifierCustomQuestionsEditor`. `modelVendor` renders nothing until the builder flags it
 * with a model chosen, then says to pick the model again. `model` stays the host's discovery
 * picker, which writes `modelVendor` with it.
 */
export function useClassifierGuardrailParameters({
  definition,
  categories,
  labels: labelOverrides,
}: UseClassifierGuardrailParametersOptions): ClassifierGuardrailParameters {
  const labels = useGuardrailClassifierLabels(labelOverrides);
  const isClassifier =
    definition?.validator === CLASSIFIER_VALIDATOR && definition.byoValidatorName === undefined;
  const [missingQuestions, setMissingQuestions] = useState(false);

  const renderParameter = useCallback(
    (ctx: GuardrailParameterRenderContext): ReactNode | undefined => {
      if (!isClassifier) return undefined;
      const { definition: parameter, parameters } = ctx;

      switch (parameter.id) {
        case CLASSIFIER_PARAMETER_IDS.selectedQuestions: {
          const selected = Array.isArray(ctx.value)
            ? ctx.value.filter((name): name is string => typeof name === 'string')
            : [];
          const stored = parameters.find(
            (p) => p.id === CLASSIFIER_PARAMETER_IDS.questionThresholds
          )?.value;
          return (
            <ClassifierQuestionPicker
              categories={categories}
              selectedQuestions={selected}
              questionThresholds={isMap(stored) ? stored : {}}
              label={parameter.label}
              tooltip={parameter.tooltip}
              required={parameter.required}
              error={ctx.error ?? (missingQuestions ? labels.questionsRequired : undefined)}
              labels={labelOverrides}
              onChange={(nextSelected, nextThresholds) => {
                setMissingQuestions(false);
                // One write for both, so the threshold map never outlives its question.
                const withSelection = upsert(
                  parameters,
                  CLASSIFIER_PARAMETER_IDS.selectedQuestions,
                  nextSelected.length === 0
                    ? undefined
                    : { $parameterType: 'enum-list', id: parameter.id, value: nextSelected }
                );
                ctx.onParametersChange(
                  upsert(
                    withSelection,
                    CLASSIFIER_PARAMETER_IDS.questionThresholds,
                    Object.keys(nextThresholds).length === 0
                      ? undefined
                      : {
                          $parameterType: 'map-enum',
                          id: CLASSIFIER_PARAMETER_IDS.questionThresholds,
                          value: nextThresholds,
                        }
                  )
                );
              }}
            />
          );
        }
        case CLASSIFIER_PARAMETER_IDS.questionThresholds:
          // Edited inside the picker.
          return null;
        case CLASSIFIER_PARAMETER_IDS.questions:
          return (
            <ClassifierCustomQuestionsEditor
              rows={readClassifierCustomQuestions(parameters)}
              label={parameter.label}
              tooltip={parameter.tooltip}
              required={parameter.required}
              maxItems={parameter.maxItems}
              maxLength={parameter.maxLength}
              error={ctx.error}
              labels={labelOverrides}
              onRowsChange={(rows) => {
                setMissingQuestions(false);
                ctx.onParametersChange(writeClassifierCustomQuestions(parameters, rows));
              }}
            />
          );
        case CLASSIFIER_PARAMETER_IDS.modelVendor: {
          // The host's picker writes the vendor with the model, so a model without one means
          // the pick went wrong. With no model at all, the model field's own error says enough.
          const model = parameters.find((p) => p.id === CLASSIFIER_PARAMETER_IDS.model)?.value;
          const hasModel = typeof model === 'string' && model.trim() !== '';
          return hasModel && ctx.error ? (
            <FormFieldError>{labels.modelVendorMissing}</FormFieldError>
          ) : null;
        }
        default:
          return undefined;
      }
    },
    [isClassifier, categories, labels, labelOverrides, missingQuestions]
  );

  const validateParameters = useCallback(
    (parameters: readonly Pick<ClassifierParameterLike, 'id' | 'value'>[]) => {
      if (!isClassifier) return true;
      const ok = hasClassifierQuestions(parameters);
      setMissingQuestions(!ok);
      return ok;
    },
    [isClassifier]
  );

  return {
    overrideParameterIds: isClassifier ? CLAIMED_IDS : NOTHING_CLAIMED,
    renderParameter,
    validateParameters,
  };
}
