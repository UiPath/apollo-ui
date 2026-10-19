import { FormFieldError } from '@uipath/apollo-wind';
import { type ReactNode, useCallback, useState } from 'react';
import type { GuardrailDefinition } from './builder-types';
import { ClassifierCustomQuestionsEditor } from './classifier-custom-questions-editor';
import { ClassifierQuestionPicker } from './classifier-question-picker';
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
import type { ClassifierQuestionCategory } from './use-classifier-questions';

export interface UseClassifierGuardrailParametersOptions {
  /** Nothing is claimed unless this is the built-in classifier (not a BYO reusing the id). */
  definition: Pick<GuardrailDefinition, 'validator' | 'byoValidatorName'> | undefined;
  categories: readonly ClassifierQuestionCategory[];
  labels?: Partial<GuardrailClassifierLabels>;
}

export interface ClassifierGuardrailParameters {
  /** `selectedQuestions`, `questionThresholds`, `questions`, `modelVendor`; else empty. */
  overrideParameterIds: readonly string[];
  /** `undefined` for every other id, `model` included, so the host's renderer goes next. */
  renderParameter: (ctx: GuardrailParameterRenderContext) => ReactNode | undefined;
  /** For `onSave`: `false`, with a message on the picker, when there is no question at all. */
  validateParameters: (
    parameters: readonly Pick<ClassifierParameterLike, 'id' | 'value'>[]
  ) => boolean;
}

const { selectedQuestions, questionThresholds, questions, model, modelVendor } =
  CLASSIFIER_PARAMETER_IDS;
const CLAIMED_IDS = Object.freeze([selectedQuestions, questionThresholds, questions, modelVendor]);
const NOTHING_CLAIMED: readonly string[] = Object.freeze([]);

/** Replace a parameter in place, append it, or drop it when `next` is `undefined`. */
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

/**
 * The classifier's editors for `GuardrailBuilder`'s `renderParameter`; see the README for how a
 * host composes it with its own model picker.
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
      const valueFor = (id: string) => parameters.find((p) => p.id === id)?.value;

      switch (parameter.id) {
        case selectedQuestions: {
          const stored = valueFor(questionThresholds);
          return (
            <ClassifierQuestionPicker
              parameter={parameter}
              categories={categories}
              selectedQuestions={Array.isArray(ctx.value) ? (ctx.value as string[]) : []}
              questionThresholds={
                stored && typeof stored === 'object' && !Array.isArray(stored)
                  ? (stored as Record<string, number>)
                  : {}
              }
              error={ctx.error ?? (missingQuestions ? labels.questionsRequired : undefined)}
              labels={labelOverrides}
              onChange={(names, thresholds) => {
                setMissingQuestions(false);
                // One write, so the map never outlives its question.
                const withNames = upsert(
                  parameters,
                  selectedQuestions,
                  names.length > 0
                    ? { $parameterType: 'enum-list', id: selectedQuestions, value: names }
                    : undefined
                );
                ctx.onParametersChange(
                  upsert(
                    withNames,
                    questionThresholds,
                    Object.keys(thresholds).length > 0
                      ? { $parameterType: 'map-enum', id: questionThresholds, value: thresholds }
                      : undefined
                  )
                );
              }}
            />
          );
        }
        case questionThresholds:
          // Edited in the picker; only its error, e.g. a saved value out of range, shows here.
          return ctx.error ? (
            <FormFieldError>{`${parameter.label}: ${ctx.error}`}</FormFieldError>
          ) : null;
        case questions:
          return (
            <ClassifierCustomQuestionsEditor
              parameter={parameter}
              rows={readClassifierCustomQuestions(parameters)}
              error={ctx.error}
              labels={labelOverrides}
              onRowsChange={(rows) => {
                setMissingQuestions(false);
                ctx.onParametersChange(writeClassifierCustomQuestions(parameters, rows));
              }}
            />
          );
        case modelVendor: {
          // The host's picker writes the vendor with the model; with no model, its error says enough.
          const chosen = valueFor(model);
          return typeof chosen === 'string' && chosen.trim() !== '' && ctx.error ? (
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
      const ok = !isClassifier || hasClassifierQuestions(parameters);
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
