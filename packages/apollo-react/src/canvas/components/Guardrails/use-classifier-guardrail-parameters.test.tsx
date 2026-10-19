import { fireEvent, renderHook, render as rtlRender, screen } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { CLASSIFIER_WIRE, SENTIMENT_WIRE } from './__fixtures__/definitions-wire.fixtures';
import type { GuardrailBuilderValue } from './builder-types';
import { enrichGuardrailDefinitions } from './definitions-enrich';
import { GuardrailBuilder } from './guardrail-builder';
import type { GuardrailParameterRenderContext, GuardrailValidatorParameter } from './types';
import { useClassifierGuardrailParameters } from './use-classifier-guardrail-parameters';
import { useClassifierQuestions } from './use-classifier-questions';

const [CLASSIFIER, SENTIMENT] = enrichGuardrailDefinitions([CLASSIFIER_WIRE, SENTIMENT_WIRE]);

/** A host as the README shows it: the seam first, then its own model picker. */
function Host({
  initial,
  errors,
  onSave,
}: {
  initial?: GuardrailValidatorParameter[];
  errors?: Record<string, string>;
  onSave: (value: GuardrailBuilderValue) => void;
}) {
  const { categories } = useClassifierQuestions(null, { questions: CLASSIFIER_QUESTIONS_WIRE });
  const classifier = useClassifierGuardrailParameters({ definition: CLASSIFIER, categories });
  const renderModelPicker = (ctx: GuardrailParameterRenderContext) =>
    ctx.definition.id === 'model' ? (
      <button
        type="button"
        onClick={() =>
          ctx.onParametersChange([
            ...ctx.parameters.filter((p) => p.id !== 'model' && p.id !== 'modelVendor'),
            { $parameterType: 'enum', id: 'model', value: 'jev-1.13.0' },
            { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
          ])
        }
      >
        Pick Jev
      </button>
    ) : undefined;
  if (!CLASSIFIER) throw new Error('expected the classifier definition');

  return (
    <GuardrailBuilder
      open
      inline
      hideHeader
      definition={CLASSIFIER}
      scope="Llm"
      defaultName="Classifier 1"
      guardrail={
        initial && {
          id: 'g1',
          $guardrailType: 'builtInValidator',
          name: 'Classifier 1',
          selector: { scopes: ['Llm'] },
          action: { $actionType: 'log', severityLevel: 'Info' },
          enabledForEvals: true,
          validatorType: 'classifier',
          validatorParameters: initial,
        }
      }
      renderParameter={(ctx) => classifier.renderParameter(ctx) ?? renderModelPicker(ctx)}
      overrideParameterIds={[...classifier.overrideParameterIds, 'model']}
      errors={errors && { parameters: errors }}
      onSave={(value) => classifier.validateParameters(value.validatorParameters) && onSave(value)}
      onCancel={vi.fn()}
    />
  );
}

function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

const save = () => fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

describe('useClassifierGuardrailParameters', () => {
  it('claims the four classifier ids, and nothing for another validator or a BYO one', () => {
    const claimed = (
      definition: Parameters<typeof useClassifierGuardrailParameters>[0]['definition']
    ) =>
      renderHook(() => useClassifierGuardrailParameters({ definition, categories: [] })).result
        .current.overrideParameterIds;

    expect(claimed(CLASSIFIER)).toEqual([
      'selectedQuestions',
      'questionThresholds',
      'questions',
      'modelVendor',
    ]);
    expect(claimed(SENTIMENT)).toEqual([]);
    expect(claimed({ validator: 'classifier', byoValidatorName: 'acme' })).toEqual([]);
  });

  it('replaces the generic editors and saves what both write, with the host’s model', () => {
    const onSave = vi.fn();
    render(<Host onSave={onSave} />);

    expect(
      screen.queryByRole('combobox', { name: /Predefined questions/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all in Intellectual property' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your questions 1' }), {
      target: { value: 'Does it promise a refund?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick Jev' }));
    save();

    expect(onSave.mock.calls[0]?.[0].validatorParameters).toEqual(
      expect.arrayContaining([
        {
          $parameterType: 'enum-list',
          id: 'selectedQuestions',
          value: ['ip_verbatim_text', 'ip_proprietary_code'],
        },
        { $parameterType: 'text-list', id: 'questions', value: ['Does it promise a refund?'] },
        { $parameterType: 'enum', id: 'model', value: 'jev-1.13.0' },
        { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
      ])
    );
  });

  it('holds Save with no question, says so on the picker, and lets either editor clear it', () => {
    const onSave = vi.fn();
    render(<Host onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pick Jev' }));

    save();

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Predefined questions' })).toHaveAccessibleDescription(
      'Pick at least one question or add your own.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(
      screen.queryByText('Pick at least one question or add your own.')
    ).not.toBeInTheDocument();
  });

  it('asks for the model again when it was saved without a vendor', () => {
    render(
      <Host
        onSave={vi.fn()}
        initial={[
          { $parameterType: 'enum-list', id: 'selectedQuestions', value: ['harmful_hate'] },
          { $parameterType: 'enum', id: 'model', value: 'jev-1.13.0' },
        ]}
      />
    );

    save();

    expect(screen.getByText('This model has no vendor. Pick the model again.')).toBeInTheDocument();
  });

  describe('the threshold map’s errors', () => {
    const saved = (thresholds: Record<string, number>): GuardrailValidatorParameter[] => [
      { $parameterType: 'enum-list', id: 'selectedQuestions', value: ['ip_verbatim_text'] },
      { $parameterType: 'map-enum', id: 'questionThresholds', value: thresholds },
      { $parameterType: 'enum', id: 'model', value: 'jev-1.13.0' },
      { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
    ];
    const tighten = () => {
      fireEvent.click(screen.getByRole('button', { name: /^Intellectual property \d/ }));
      fireEvent.keyDown(screen.getByRole('slider', { name: /ip_verbatim_text/ }), {
        key: 'ArrowLeft',
      });
    };

    it('shows a saved value out of range, which holds Save until it is fixed', () => {
      const onSave = vi.fn();
      render(<Host onSave={onSave} initial={saved({ ip_verbatim_text: 1.4 })} />);

      save();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText(/Value is out of range/)).toBeInTheDocument();

      tighten();
      save();
      expect(onSave).toHaveBeenCalled();
    });

    it('clears a host’s map error once the picker rewrites the map', () => {
      const onSave = vi.fn();
      render(
        <Host
          onSave={onSave}
          initial={saved({ ip_verbatim_text: 0.5 })}
          errors={{ questionThresholds: 'Too lenient for this tenant.' }}
        />
      );
      expect(screen.getByText(/Too lenient for this tenant/)).toBeInTheDocument();

      tighten();
      save();

      expect(onSave).toHaveBeenCalled();
    });
  });
});
