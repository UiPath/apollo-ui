import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { GuardrailBuilderValue, GuardrailDefinition } from './builder-types';
import { GuardrailBuilder } from './guardrail-builder';

// The form renders a radix tooltip for the "Enable for evaluations" info icon, which
// requires a TooltipProvider ancestor.
function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

function makeDef(overrides?: Partial<GuardrailDefinition>): GuardrailDefinition {
  return {
    validator: 'pii_detection',
    displayName: 'PII Detection',
    allowedScopes: ['Agent', 'Llm', 'Tool'],
    parameters: [],
    status: 'Available',
    ...overrides,
  };
}

function makeGuardrail(overrides?: Partial<GuardrailBuilderValue>): GuardrailBuilderValue {
  return {
    id: 'g1',
    $guardrailType: 'builtInValidator',
    name: 'My PII guardrail',
    selector: { scopes: ['Agent'] },
    action: { $actionType: 'log', severityLevel: 'Info' },
    enabledForEvals: true,
    validatorType: 'pii_detection',
    validatorParameters: [],
    ...overrides,
  };
}

describe('GuardrailBuilder', () => {
  it('shows the guardrail type as a read-only field when editing', () => {
    render(
      <GuardrailBuilder
        open
        inline
        hideHeader
        definition={makeDef()}
        scope="Agent"
        guardrail={makeGuardrail()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const typeInput = screen.getByLabelText<HTMLInputElement>('Guardrail type');
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe('PII Detection');
    expect(typeInput).toBeDisabled();
  });

  it('does not show the guardrail type field when creating a new guardrail', () => {
    render(
      <GuardrailBuilder
        open
        inline
        hideHeader
        definition={makeDef()}
        scope="Agent"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Guardrail type')).not.toBeInTheDocument();
  });

  describe('usageNote banner', () => {
    it('renders the note when the definition declares one', () => {
      const def = makeDef({ usageNote: 'Heads up: same billing as agent LLM calls.' });
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={def}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('Heads up: same billing as agent LLM calls.')).toBeInTheDocument();
    });

    it('renders nothing when the definition omits the note', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.queryByText(/agent llm calls/i)).not.toBeInTheDocument();
    });
  });

  describe('disabled BYOG configuration', () => {
    const disabledByoDefinition = (): GuardrailDefinition =>
      makeDef({
        validator: 'vendor_validator',
        displayName: 'Vendor PII',
        byoValidatorName: 'my-pii',
        status: 'Disabled',
      });

    it('renders an error and disables Save', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={disabledByoDefinition()}
          scope="Agent"
          guardrail={makeGuardrail({ validatorType: 'byo', byoValidatorName: 'my-pii' })}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        "This guardrail's configuration has been disabled"
      );
      expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    });

    it('disables Save as new for a mixed-scope guardrail', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={disabledByoDefinition()}
          scope="Tool"
          guardrail={makeGuardrail({ validatorType: 'byo', byoValidatorName: 'my-pii' })}
          toolName="Tool A"
          onSave={vi.fn()}
          onSaveAsNew={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /save as new/i })).toBeDisabled();
    });
  });

  describe('status banners', () => {
    it('warns when the definition is unauthorised', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef({ status: 'Unauthorised' })}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText(/not entitled to use guardrails/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    });

    it('warns when the feature is disabled', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef({ status: 'FeatureDisabled' })}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText(/guardrail feature is disabled/i)).toBeInTheDocument();
    });
  });

  describe('required-param validation blocks Save', () => {
    const llmJudgeDefinition = (): GuardrailDefinition =>
      makeDef({
        validator: 'llm_as_judge',
        displayName: 'LLM as Judge',
        parameters: [
          {
            id: 'guardrailText',
            type: 'text',
            label: 'Rule prompt',
            required: true,
            defaultValue: null,
          },
          {
            id: 'model',
            type: 'enum',
            label: 'Judge model',
            required: true,
            defaultValue: null,
            options: ['m1'],
          },
          {
            id: 'positiveExamples',
            type: 'text-list',
            label: 'Positive examples',
            required: true,
            defaultValue: [],
            maxItems: 3,
          },
        ],
      });

    it('does not call onSave when a required text param is empty', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={llmJudgeDefinition()}
          scope="Agent"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getAllByText('Value is required').length).toBeGreaterThan(0);
    });

    it('does not call onSave when a required text param is whitespace-only', () => {
      const onSave = vi.fn();
      const existing = makeGuardrail({
        validatorType: 'llm_as_judge',
        validatorParameters: [
          { $parameterType: 'text', id: 'guardrailText', value: '   ' },
          { $parameterType: 'enum', id: 'model', value: 'm1' },
          { $parameterType: 'text-list', id: 'positiveExamples', value: ['ok'] },
        ],
      });

      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={llmJudgeDefinition()}
          scope="Agent"
          guardrail={existing}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('does not call onSave when a required enum param is empty', () => {
      const onSave = vi.fn();
      const existing = makeGuardrail({
        validatorType: 'llm_as_judge',
        validatorParameters: [
          { $parameterType: 'text', id: 'guardrailText', value: 'rule' },
          { $parameterType: 'enum', id: 'model', value: '' },
          { $parameterType: 'text-list', id: 'positiveExamples', value: ['ok'] },
        ],
      });

      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={llmJudgeDefinition()}
          scope="Agent"
          guardrail={existing}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('does not call onSave when a required text-list has only whitespace entries', () => {
      const onSave = vi.fn();
      const existing = makeGuardrail({
        validatorType: 'llm_as_judge',
        validatorParameters: [
          { $parameterType: 'text', id: 'guardrailText', value: 'rule' },
          { $parameterType: 'enum', id: 'model', value: 'm1' },
          { $parameterType: 'text-list', id: 'positiveExamples', value: ['', '   '] },
        ],
      });

      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={llmJudgeDefinition()}
          scope="Agent"
          guardrail={existing}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onSave when every required param has real content', () => {
      const onSave = vi.fn();
      const existing = makeGuardrail({
        validatorType: 'llm_as_judge',
        validatorParameters: [
          { $parameterType: 'text', id: 'guardrailText', value: 'rule' },
          { $parameterType: 'enum', id: 'model', value: 'm1' },
          { $parameterType: 'text-list', id: 'positiveExamples', value: ['ok'] },
        ],
      });

      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={llmJudgeDefinition()}
          scope="Agent"
          guardrail={existing}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).toHaveBeenCalled();
    });

    it('strips empty / whitespace-only entries from text-list params on save', () => {
      const onSave = vi.fn();
      const definitionWithOptionalList = makeDef({
        validator: 'llm_as_judge',
        displayName: 'LLM as Judge',
        parameters: [
          {
            id: 'guardrailText',
            type: 'text',
            label: 'Rule prompt',
            required: true,
            defaultValue: null,
          },
          {
            id: 'model',
            type: 'enum',
            label: 'Judge model',
            required: true,
            defaultValue: null,
            options: ['m1'],
          },
          {
            id: 'positiveExamples',
            type: 'text-list',
            label: 'Positive examples',
            required: false,
            defaultValue: [],
            maxItems: 3,
          },
        ],
      });
      const existing = makeGuardrail({
        validatorType: 'llm_as_judge',
        validatorParameters: [
          { $parameterType: 'text', id: 'guardrailText', value: 'rule' },
          { $parameterType: 'enum', id: 'model', value: 'm1' },
          { $parameterType: 'text-list', id: 'positiveExamples', value: ['', 'kept', '   '] },
        ],
      });

      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={definitionWithOptionalList}
          scope="Agent"
          guardrail={existing}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = onSave.mock.calls[0][0] as GuardrailBuilderValue;
      const examplesParam = saved.validatorParameters.find((p) => p.id === 'positiveExamples');
      expect(examplesParam).toEqual({
        $parameterType: 'text-list',
        id: 'positiveExamples',
        value: ['kept'],
      });
    });
  });

  describe('name validation', () => {
    it('blocks Save and shows a message when the name is empty', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          guardrail={makeGuardrail({ name: '   ' })}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('Guardrail name is required')).toBeInTheDocument();
    });

    it('blocks Save on a case-insensitive duplicate name', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          guardrail={makeGuardrail({ name: 'My Guardrail' })}
          existingNames={['my guardrail']}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('A guardrail with this name already exists')).toBeInTheDocument();
    });
  });

  describe('scope validation', () => {
    it('blocks Save when no scope is selected (Agent context only)', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          guardrail={makeGuardrail({ selector: { scopes: [] } })}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('At least one scope is required')).toBeInTheDocument();
    });

    it('ignores selector validation when opened from a tool node', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Tool"
          guardrail={makeGuardrail({ selector: { scopes: [] } })}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('host errors override', () => {
    it('displays host errors immediately and gates Save', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          guardrail={makeGuardrail()}
          errors={{ name: 'Backend rejected this name' }}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Backend rejected this name')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('lets the host message win over the internal one per field', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          guardrail={makeGuardrail({ name: '' })}
          errors={{ name: 'Host-specific message' }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(screen.getByText('Host-specific message')).toBeInTheDocument();
      expect(screen.queryByText('Guardrail name is required')).not.toBeInTheDocument();
    });
  });

  describe('BYOG guardrails', () => {
    const makeByoDef = (overrides?: Partial<GuardrailDefinition>): GuardrailDefinition =>
      makeDef({
        validator: 'vendor_validator',
        displayName: 'Vendor PII',
        byoValidatorName: 'my-pii',
        ...overrides,
      });

    it('persists the byo sentinel and validator name on save', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeByoDef()}
          scope="Agent"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = onSave.mock.calls[0][0] as GuardrailBuilderValue;
      expect(saved.validatorType).toBe('byo');
      expect(saved.byoValidatorName).toBe('my-pii');
    });

    it('does not stamp byo fields for a UiPath-managed definition', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      const saved = onSave.mock.calls[0][0] as GuardrailBuilderValue;
      expect(saved.validatorType).toBe('pii_detection');
      expect(saved.byoValidatorName).toBeUndefined();
    });

    it('drops optional params left empty on save but keeps filled ones', () => {
      const onSave = vi.fn();
      const definition = makeByoDef({
        parameters: [
          {
            id: 'optionalText',
            type: 'text',
            label: 'Optional text',
            required: false,
            defaultValue: '',
          },
          {
            id: 'strictMode',
            type: 'boolean',
            label: 'Strict mode',
            required: false,
            defaultValue: true,
          },
        ],
      });
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={definition}
          scope="Agent"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      const saved = onSave.mock.calls[0][0] as GuardrailBuilderValue;
      expect(saved.validatorParameters).toEqual([
        { $parameterType: 'boolean', id: 'strictMode', value: true },
      ]);
    });

    it('renders a toggle for boolean params and persists the flipped value', () => {
      const onSave = vi.fn();
      const definition = makeByoDef({
        parameters: [
          {
            id: 'strictMode',
            type: 'boolean',
            label: 'Strict mode',
            required: false,
            defaultValue: false,
          },
        ],
      });
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={definition}
          scope="Agent"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('switch', { name: /strict mode/i }));
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      const saved = onSave.mock.calls[0][0] as GuardrailBuilderValue;
      expect(saved.validatorParameters).toEqual([
        { $parameterType: 'boolean', id: 'strictMode', value: true },
      ]);
    });
  });

  describe('required map-enum validation', () => {
    it('does not call onSave when a required map-enum param is empty', () => {
      const onSave = vi.fn();
      const definition = makeDef({
        parameters: [
          {
            id: 'thresholds',
            type: 'map-enum',
            label: 'Thresholds',
            required: true,
            defaultValue: {},
            keySource: 'entities',
            min: 0,
            max: 1,
            step: 0.1,
          },
        ],
      });
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={definition}
          scope="Agent"
          guardrail={makeGuardrail({
            validatorParameters: [{ $parameterType: 'map-enum', id: 'thresholds', value: {} }],
          })}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('layout options', () => {
    it('renders the evals toggle in the footer when evalsTogglePlacement is footer', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          evalsTogglePlacement="footer"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const toggle = screen.getByRole('switch', { name: /enable guardrail for evaluations/i });
      const footer = toggle.closest('div.border-t');
      expect(footer).not.toBeNull();
    });

    it('renders a custom title node when provided', () => {
      render(
        <GuardrailBuilder
          open
          inline
          definition={makeDef()}
          scope="Agent"
          title={<span data-testid="custom-title">Fancy title</span>}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('computes the Add title from the definition display name', () => {
      render(
        <GuardrailBuilder
          open
          inline
          definition={makeDef()}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('Add PII Detection guardrail')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('saves edited name, description, evals flag, and scope selection', () => {
      const onSave = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          onSave={onSave}
          onCancel={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/guardrail name/i), { target: { value: 'Renamed' } });
      fireEvent.change(screen.getByLabelText(/guardrail description/i), {
        target: { value: 'Why it exists' },
      });
      fireEvent.click(screen.getByRole('switch', { name: /enable guardrail for evaluations/i }));
      fireEvent.click(screen.getByText('LLM calls'));
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = onSave.mock.calls[0][0] as GuardrailBuilderValue;
      expect(saved.name).toBe('Renamed');
      expect(saved.description).toBe('Why it exists');
      expect(saved.enabledForEvals).toBe(false);
      expect(saved.selector.scopes).toEqual(['Agent', 'Llm']);
      expect(saved.id).toMatch(/^guardrail-/);
    });

    it('calls onSaveAsNew with the current value when valid', () => {
      const onSaveAsNew = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Tool"
          guardrail={makeGuardrail()}
          onSave={vi.fn()}
          onSaveAsNew={onSaveAsNew}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save as new/i }));
      expect(onSaveAsNew).toHaveBeenCalledTimes(1);
      expect((onSaveAsNew.mock.calls[0][0] as GuardrailBuilderValue).name).toBe('My PII guardrail');
    });

    it('blocks onSaveAsNew and surfaces errors when invalid', () => {
      const onSaveAsNew = vi.fn();
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Tool"
          guardrail={makeGuardrail({ name: '' })}
          onSave={vi.fn()}
          onSaveAsNew={onSaveAsNew}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save as new/i }));
      expect(onSaveAsNew).not.toHaveBeenCalled();
      expect(screen.getByText('Guardrail name is required')).toBeInTheDocument();
    });

    it('merges host parameter errors into the validator form', () => {
      const definition = makeDef({
        parameters: [
          { id: 'prompt', type: 'text', label: 'Prompt', required: false, defaultValue: 'ok' },
        ],
      });
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={definition}
          scope="Agent"
          guardrail={makeGuardrail({
            validatorParameters: [{ $parameterType: 'text', id: 'prompt', value: 'ok' }],
          })}
          errors={{ parameters: { prompt: 'Backend rejected this prompt' } }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Backend rejected this prompt')).toBeInTheDocument();
    });

    it('renders the mixed-scopes banner from otherAppliedScopes', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Tool"
          guardrail={makeGuardrail()}
          otherAppliedScopes={{ scopes: ['Agent'], tools: ['Other tool'] }}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('This guardrail is also applied to:')).toBeInTheDocument();
      expect(screen.getByText('Other tool')).toBeInTheDocument();
    });

    it('passes the escalate slots through to the action section', () => {
      render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={makeDef()}
          scope="Agent"
          guardrail={makeGuardrail({
            action: {
              $actionType: 'escalate',
              app: { id: '', version: '', name: '' },
              recipient: { type: 1, value: '', displayName: '' },
            },
          })}
          renderRecipientSearch={() => <div data-testid="host-directory-search" />}
          renderAppPicker={() => <div data-testid="host-app-picker" />}
          escalateHelp={<p data-testid="host-help" />}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId('host-directory-search')).toBeInTheDocument();
      expect(screen.getByTestId('host-app-picker')).toBeInTheDocument();
      expect(screen.getByTestId('host-help')).toBeInTheDocument();
    });

    it('renders in modal mode with a dialog', () => {
      render(
        <GuardrailBuilder
          open
          definition={makeDef()}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add PII Detection guardrail')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations on a full definition', async () => {
      const definition = makeDef({
        usageNote: 'Runs on every LLM call.',
        parameters: [
          {
            id: 'prompt',
            type: 'text',
            label: 'Prompt',
            required: true,
            defaultValue: 'check tone',
          },
          {
            id: 'strict',
            type: 'boolean',
            label: 'Strict mode',
            required: false,
            defaultValue: true,
          },
        ],
      });
      const { container } = render(
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={definition}
          scope="Agent"
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
