import { fireEvent, renderHook, render as rtlRender, screen } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { CLASSIFIER_WIRE, SENTIMENT_WIRE } from './__fixtures__/definitions-wire.fixtures';
import type { GuardrailBuilderValue } from './builder-types';
import { enrichClassifierQuestions } from './classifier-questions-enrich';
import { enrichGuardrailDefinitions } from './definitions-enrich';
import type { GuardrailDefinitionWire } from './definitions-wire';
import { GuardrailBuilder } from './guardrail-builder';
import type { GuardrailParameterRenderContext, GuardrailValidatorParameter } from './types';
import { useClassifierGuardrailParameters } from './use-classifier-guardrail-parameters';

const CATEGORIES = enrichClassifierQuestions(CLASSIFIER_QUESTIONS_WIRE);
const CONTACT =
  'Does the content contain personal contact information belonging to an identifiable person, such as an email address, a phone number, or a home address?';

function enrichOne(wire: GuardrailDefinitionWire) {
  const [definition] = enrichGuardrailDefinitions([wire]);
  if (!definition) throw new Error('expected one enriched definition');
  return definition;
}

const CLASSIFIER = enrichOne(CLASSIFIER_WIRE);

function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

/** A host as the README shows it: the seam first, then its own model picker. */
function Host({
  initial,
  onSave,
}: {
  initial?: GuardrailValidatorParameter[];
  onSave: (value: GuardrailBuilderValue) => void;
}) {
  const classifier = useClassifierGuardrailParameters({
    definition: CLASSIFIER,
    categories: CATEGORIES,
  });
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

  return (
    <GuardrailBuilder
      open
      inline
      hideHeader
      definition={CLASSIFIER}
      scope="Llm"
      defaultName="Classifier 1"
      guardrail={
        initial
          ? {
              id: 'g1',
              $guardrailType: 'builtInValidator',
              name: 'Classifier 1',
              selector: { scopes: ['Llm'] },
              action: { $actionType: 'log', severityLevel: 'Info' },
              enabledForEvals: true,
              validatorType: 'classifier',
              validatorParameters: initial,
            }
          : undefined
      }
      renderParameter={(ctx) => classifier.renderParameter(ctx) ?? renderModelPicker(ctx)}
      overrideParameterIds={[...classifier.overrideParameterIds, 'model']}
      onSave={(value) => {
        if (classifier.validateParameters(value.validatorParameters)) onSave(value);
      }}
      onCancel={vi.fn()}
    />
  );
}

const save = () => fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
const savedParameters = (onSave: ReturnType<typeof vi.fn>) =>
  (onSave.mock.calls.at(-1)?.[0] as GuardrailBuilderValue | undefined)?.validatorParameters;

describe('useClassifierGuardrailParameters', () => {
  it('claims the four classifier ids, and leaves model to the host', () => {
    const { result } = renderHook(() =>
      useClassifierGuardrailParameters({ definition: CLASSIFIER, categories: CATEGORIES })
    );

    expect(result.current.overrideParameterIds).toEqual([
      'selectedQuestions',
      'questionThresholds',
      'questions',
      'modelVendor',
    ]);
  });

  it('claims nothing for another validator, or a bring-your-own one reusing the id', () => {
    const sentiment = renderHook(() =>
      useClassifierGuardrailParameters({ definition: enrichOne(SENTIMENT_WIRE), categories: [] })
    );
    const byo = renderHook(() =>
      useClassifierGuardrailParameters({
        definition: { validator: 'classifier', byoValidatorName: 'acme-classifier' },
        categories: [],
      })
    );

    for (const { result } of [sentiment, byo]) {
      expect(result.current.overrideParameterIds).toEqual([]);
      expect(result.current.validateParameters([])).toBe(true);
    }
  });

  it('renders the picker and the custom questions instead of the generic editors', () => {
    render(<Host onSave={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Predefined questions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick Jev' })).toBeInTheDocument();
    // No raw multi-select of question names, no separate threshold rows, no vendor text box.
    expect(
      screen.queryByRole('combobox', { name: /Predefined questions/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Model vendor/ })).not.toBeInTheDocument();
  });

  it('saves the picked questions, a tuned threshold, a custom question and the model', () => {
    const onSave = vi.fn();
    render(<Host onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show or hide PII questions' }));
    fireEvent.click(screen.getByRole('checkbox', { name: CONTACT }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all in Intellectual property' }));
    fireEvent.keyDown(
      screen.getByRole('slider', { name: 'Flag threshold for pii_contact_information' }),
      { key: 'ArrowLeft' }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your questions 1' }), {
      target: { value: 'Does it promise a refund?' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Counts as yes (flags) — optional' }), {
      target: { value: 'A refund is promised.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick Jev' }));
    save();

    expect(savedParameters(onSave)).toEqual(
      expect.arrayContaining([
        {
          $parameterType: 'enum-list',
          id: 'selectedQuestions',
          value: ['pii_contact_information', 'ip_verbatim_text', 'ip_proprietary_code'],
        },
        // Only the tuned question: the other two run at the backend's 0.5.
        {
          $parameterType: 'map-enum',
          id: 'questionThresholds',
          value: { pii_contact_information: 0.4 },
        },
        { $parameterType: 'text-list', id: 'questions', value: ['Does it promise a refund?'] },
        { $parameterType: 'text', id: 'questionCriteriaTrue.0', value: 'A refund is promised.' },
        { $parameterType: 'enum', id: 'model', value: 'jev-1.13.0' },
        { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
      ])
    );
  });

  it('holds Save with no question at all, says so on the picker, and lets either editor clear it', () => {
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

  it('reads a saved guardrail back into both editors', () => {
    render(
      <Host
        onSave={vi.fn()}
        initial={[
          { $parameterType: 'enum-list', id: 'selectedQuestions', value: ['harmful_hate'] },
          { $parameterType: 'map-enum', id: 'questionThresholds', value: { harmful_hate: 1 } },
          { $parameterType: 'text-list', id: 'questions', value: ['Is it rude?'] },
          { $parameterType: 'number', id: 'questionThreshold.0', value: 0.8 },
        ]}
      />
    );

    expect(
      screen.getByText('1 selected — pick any across categories, or add your own below.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show or hide Harmful content questions' }));
    expect(
      screen.getByRole('combobox', { name: 'Severity cutoff for harmful_hate' })
    ).toHaveTextContent('Critical');
    expect(screen.getByRole('textbox', { name: 'Your questions 1' })).toHaveValue('Is it rude?');
    expect(
      screen.getByRole('slider', { name: 'Flag threshold for Your questions 1' })
    ).toHaveAttribute('aria-valuenow', '0.8');
  });

  it('has no accessibility violations inside the builder', async () => {
    const { container } = render(<Host onSave={vi.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
