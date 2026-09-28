import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApI18nProvider } from '../../../i18n';
import { GuardrailValidatorForm } from './guardrail-validator-form';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';

// TooltipProvider is required by the parameter label's info tooltip; wrapped via `wrapper:`
// so rerender() inherits it.
function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
function render(ui: ReactElement) {
  return rtlRender(ui, { wrapper: Providers });
}

const REQUIRED_ERROR = 'Value is required';

function requiredErrors(...ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, REQUIRED_ERROR]));
}

describe('GuardrailValidatorForm', () => {
  describe('number parameter', () => {
    it('renders number input with label', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'threshold',
          type: 'number',
          label: 'Detection threshold',
          required: true,
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByText('Detection threshold')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toHaveValue(0.5);
    });

    it('uses current parameter value over default', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'threshold',
          type: 'number',
          label: 'Threshold',
          required: true,
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
        },
      ];
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'number', id: 'threshold', value: 0.8 },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={params}
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('spinbutton')).toHaveValue(0.8);
    });

    it('calls onChange with updated value', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'threshold',
          type: 'number',
          label: 'Threshold',
          required: false,
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0.7' } });
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'number', id: 'threshold', value: 0.7 },
      ]);
    });

    it('shows required indicator when required', () => {
      const defs: GuardrailParameterDefinition[] = [
        { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 0.5 },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    // Contract pin, not a reproduction. The concern raised in review was that onChange-mode
    // revalidation replaces the externally-set error while `errors` is unchanged, losing the
    // host's message. I could not reproduce that on RHF 7.66 — the message survives here with
    // the re-assert disabled — so this guards the guarantee rather than proving a fix: if a
    // future RHF or resolver change starts dropping external errors, this fails.
    it('keeps a host error visible after the user edits another field', async () => {
      const defs: GuardrailParameterDefinition[] = [
        { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 0.5 },
        { id: 'other', type: 'text', label: 'Other', required: false, defaultValue: '' },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('threshold')}
        />
      );

      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();

      // Edit a *different* field: onChange mode revalidates the whole form, and the resolver's
      // verdict for `threshold` then overwrites the externally-set error.
      fireEvent.change(screen.getByLabelText('Other'), { target: { value: 'typed' } });

      await waitFor(() => {
        expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
      });
    });

    it('renders a host-supplied error message', () => {
      const defs: GuardrailParameterDefinition[] = [
        { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 0.5 },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('threshold')}
        />
      );
      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });
  });

  describe('enum-list parameter', () => {
    it('renders enum options as toggle buttons', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email'],
          options: ['Email', 'Address', 'Phone'],
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByText('Entities')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    // The chips are Toggle buttons, so the label has nothing to bind to with htmlFor and names
    // nothing on its own. axe has no orphan-<label> rule, so the a11y suite stayed green over
    // this — these assert the association directly.
    it('exposes the chips as a group named by the parameter label', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email'],
          options: ['Email', 'Address'],
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      const group = screen.getByRole('group', { name: /Entities/ });
      expect(group).toBeInTheDocument();
      expect(group.getAttribute('aria-invalid')).toBeNull();
      // Not permitted on role=group; asserting its absence keeps aria-allowed-attr green.
      expect(group).not.toHaveAttribute('aria-required');
    });

    it('marks the group invalid and points it at the error message', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: [],
          options: ['Email', 'Address'],
        },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          errors={{ entities: 'Pick at least one' }}
          onChange={() => {}}
        />
      );

      const group = screen.getByRole('group', { name: /Entities/ });
      expect(group).toHaveAttribute('aria-invalid', 'true');
      const describedBy = group.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy as string)).toHaveTextContent('Pick at least one');
    });

    it('calls onChange when toggling an option on', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email'],
          options: ['Email', 'Address'],
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      fireEvent.click(screen.getByText('Address'));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Address'] },
      ]);
    });

    it('calls onChange when toggling an option off', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email', 'Address'],
          options: ['Email', 'Address'],
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      fireEvent.click(screen.getByText('Email'));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'enum-list', id: 'entities', value: ['Address'] },
      ]);
    });

    it('renders friendly labels when optionLabels is provided, but saves raw option values', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: [],
          options: ['USSocialSecurityNumber', 'NOIdentityNumber'],
          optionLabels: {
            USSocialSecurityNumber: 'US Social Security Number (SSN)',
            NOIdentityNumber: 'Norway Identity Number',
          },
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      // Friendly labels are visible to the user
      expect(screen.getByText('US Social Security Number (SSN)')).toBeInTheDocument();
      expect(screen.getByText('Norway Identity Number')).toBeInTheDocument();
      // Raw values are not rendered
      expect(screen.queryByText('USSocialSecurityNumber')).not.toBeInTheDocument();
      expect(screen.queryByText('NOIdentityNumber')).not.toBeInTheDocument();

      // But the saved payload still uses the raw option value
      fireEvent.click(screen.getByText('Norway Identity Number'));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'enum-list', id: 'entities', value: ['NOIdentityNumber'] },
      ]);
    });

    it('falls back to the raw option value when optionLabels has no entry for it', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: [],
          options: ['Email', 'SomeUnmappedEntity'],
          optionLabels: { Email: 'Email address' },
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByText('Email address')).toBeInTheDocument();
      expect(screen.getByText('SomeUnmappedEntity')).toBeInTheDocument();
    });

    it('renders a MultiSelect for more than eight options and saves raw values', async () => {
      const onChange = vi.fn();
      const manyOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: [],
          options: manyOptions,
          optionLabels: { A: 'Option A' },
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      // Options live behind the closed MultiSelect popover.
      expect(screen.queryByText('Option A')).not.toBeInTheDocument();

      // Named by the visible field label, not the placeholder: the renderer now associates
      // the label with the combobox via htmlFor/id.
      fireEvent.click(screen.getByRole('combobox', { name: 'Entities' }));
      fireEvent.click(await screen.findByText('Option A'));

      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'enum-list', id: 'entities', value: ['A'] },
      ]);
    });

    it('renders a host-supplied error message', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: [],
          options: ['Email'],
        },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('entities')}
        />
      );
      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });
  });

  describe('overrideParameterIds', () => {
    const defs: GuardrailParameterDefinition[] = [
      { id: 'threshold', type: 'number', label: 'Threshold', required: false, defaultValue: 0.5 },
      { id: 'other', type: 'text', label: 'Other', required: false, defaultValue: '' },
    ];

    it('declares overrides without calling renderParameter to discover them', () => {
      const renderParameter = vi.fn(({ definition }) =>
        definition.id === 'threshold' ? <div data-testid="custom">custom</div> : undefined
      );

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          renderParameter={renderParameter}
          overrideParameterIds={['threshold']}
        />
      );

      expect(screen.getByTestId('custom')).toBeInTheDocument();
      // The point of the prop: the unclaimed definition is never handed to the host at all.
      // Asserting on which ids were passed rather than on a call count, which also moves with
      // React's render behaviour.
      const seenIds = renderParameter.mock.calls.map((c) => c[0].definition.id);
      expect(seenIds).not.toContain('other');
      expect(new Set(seenIds)).toEqual(new Set(['threshold']));
    });

    it('falls back to probing every definition when the ids are not declared', () => {
      const renderParameter = vi.fn(({ definition }) =>
        definition.id === 'threshold' ? <div data-testid="custom">custom</div> : undefined
      );

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          renderParameter={renderParameter}
        />
      );

      expect(screen.getByTestId('custom')).toBeInTheDocument();
      // The deprecated path: probed for both definitions, then rendered the claimed one.
      const probedIds = renderParameter.mock.calls.map((c) => c[0].definition.id);
      expect(probedIds).toContain('other');
      expect(renderParameter.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('map-enum parameter', () => {
    it('renders threshold inputs for each key from source parameter', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email', 'Phone'],
          options: ['Email', 'Phone'],
        },
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
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByText('Thresholds')).toBeInTheDocument();
      // "Email" and "Phone" appear both as enum-list chips and as map-enum threshold labels
      expect(screen.getAllByText('Email')).toHaveLength(2);
      expect(screen.getAllByText('Phone')).toHaveLength(2);
    });

    it('renders friendly labels for threshold rows via the source parameter optionLabels', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['USSocialSecurityNumber'],
          options: ['USSocialSecurityNumber'],
          optionLabels: { USSocialSecurityNumber: 'US Social Security Number (SSN)' },
        },
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
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      // Friendly label appears twice: once in the entities chip and once in the threshold row
      expect(screen.getAllByText('US Social Security Number (SSN)')).toHaveLength(2);
      expect(screen.queryByText('USSocialSecurityNumber')).not.toBeInTheDocument();
    });

    it('displays the per-entity default threshold for a newly selected entity not yet in the map', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email'],
          options: ['Email', 'Address'],
        },
        {
          id: 'thresholds',
          type: 'map-enum',
          label: 'Thresholds',
          required: true,
          // Backend ships a per-entity default map; min is a distinct value to prove the
          // display falls back to the default (0.5), not to min (0.1).
          defaultValue: { Email: 0.5, Address: 0.5 },
          keySource: 'entities',
          min: 0.1,
          max: 1,
          step: 0.1,
        },
      ];

      // 'Address' is selected but absent from the saved threshold map.
      const parameters: GuardrailValidatorParameter[] = [
        { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Address'] },
        { $parameterType: 'map-enum', id: 'thresholds', value: { Email: 0.9 } },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={parameters}
          onChange={() => {}}
        />
      );

      const inputs = screen.getAllByRole('spinbutton');
      // Email keeps its edited value; Address shows the per-entity default, not min (0.1) or 0.
      expect(inputs.map((i) => (i as HTMLInputElement).value)).toEqual(['0.9', '0.5']);
    });

    it('renders nothing when source parameter has no keys', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: [],
          options: [],
        },
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
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.queryByText('Thresholds')).not.toBeInTheDocument();
    });
  });

  describe('text parameter', () => {
    it('renders a multiline textarea with the parameter label and maxLength', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: '',
          maxLength: 4000,
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByText('Rule prompt')).toBeInTheDocument();
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('maxlength', '4000');
    });

    it('uses current parameter value over default', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: '',
        },
      ];
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text', id: 'guardrailText', value: 'be polite' },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={params}
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('be polite');
    });

    it('falls back to empty string when defaultValue is null', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: null,
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('calls onChange with updated value', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: false,
          defaultValue: '',
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi' } });
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'text', id: 'guardrailText', value: 'hi' },
      ]);
    });

    it('renders the error message only while the errors map carries one', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: '',
        },
      ];

      const { rerender } = render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );
      expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument();

      rerender(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('guardrailText')}
        />
      );
      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });
  });

  describe('enum parameter', () => {
    it('renders backend options and keeps raw values in the payload', async () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'tier',
          type: 'enum',
          label: 'Tier',
          required: false,
          defaultValue: '',
          options: ['fast', 'slow'],
          optionLabels: { fast: 'Fast tier', slow: 'Slow tier' },
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      fireEvent.click(screen.getByRole('combobox'));
      expect(await screen.findByText('Fast tier')).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'fast' })).not.toBeInTheDocument();
    });

    it('lists every backend option', async () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'tier',
          type: 'enum',
          label: 'Tier',
          required: false,
          defaultValue: 'a',
          options: ['a', 'b'],
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      fireEvent.click(screen.getByRole('combobox'));
      expect(await screen.findByRole('option', { name: 'a' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'b' })).toBeInTheDocument();
    });

    it('keeps a stored value absent from the options as a synthetic option', async () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'tier',
          type: 'enum',
          label: 'Tier',
          required: false,
          defaultValue: '',
          options: ['a', 'b'],
        },
      ];
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'enum', id: 'tier', value: 'legacy-option' },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={params}
          onChange={() => {}}
        />
      );

      // The stale stored value is still shown in the trigger instead of blanking the field.
      expect(screen.getByRole('combobox')).toHaveTextContent('legacy-option');
      fireEvent.click(screen.getByRole('combobox'));
      expect(await screen.findByRole('option', { name: 'legacy-option' })).toBeInTheDocument();
    });

    it('renders the error message only while the errors map carries one', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'tier',
          type: 'enum',
          label: 'Tier',
          required: true,
          defaultValue: null,
          options: ['a'],
        },
      ];

      const { rerender } = render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );
      expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument();

      rerender(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('tier')}
        />
      );
      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });
  });

  describe('text-list parameter', () => {
    const listDef = (
      overrides?: Partial<GuardrailParameterDefinition>
    ): GuardrailParameterDefinition => ({
      id: 'positiveExamples',
      type: 'text-list',
      label: 'Positive examples',
      required: false,
      defaultValue: [],
      maxItems: 3,
      ...overrides,
    });

    it('renders one row per item', () => {
      const defs = [listDef({ maxLength: 1000 })];
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['one', 'two'] },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={params}
          onChange={() => {}}
        />
      );

      expect(screen.getByDisplayValue('one')).toBeInTheDocument();
      expect(screen.getByDisplayValue('two')).toBeInTheDocument();
    });

    it('clicking Add appends an empty entry', () => {
      const onChange = vi.fn();

      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef()]}
          parameters={[]}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'text-list', id: 'positiveExamples', value: [''] },
      ]);
    });

    it('hides the Add button when at maxItems', () => {
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['a', 'b'] },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef({ maxItems: 2 })]}
          parameters={params}
          onChange={() => {}}
        />
      );

      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('shows the Add button when below maxItems', () => {
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['a'] },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef()]}
          parameters={params}
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('clicking Remove drops that index from the value', () => {
      const onChange = vi.fn();
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['a', 'b', 'c'] },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef()]}
          parameters={params}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Remove Positive examples 2' }));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['a', 'c'] },
      ]);
    });

    it('editing a single row preserves the other rows', () => {
      const onChange = vi.fn();
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['one', 'two'] },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef()]}
          parameters={params}
          onChange={onChange}
        />
      );

      fireEvent.change(screen.getByDisplayValue('two'), { target: { value: 'TWO' } });
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['one', 'TWO'] },
      ]);
    });

    it('honors per-row maxLength on the textarea', () => {
      const params: GuardrailValidatorParameter[] = [
        { $parameterType: 'text-list', id: 'positiveExamples', value: ['x'] },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef({ maxLength: 1000 })]}
          parameters={params}
          onChange={() => {}}
        />
      );

      expect(screen.getByDisplayValue('x')).toHaveAttribute('maxlength', '1000');
    });

    it('renders a host-supplied error message', () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef({ required: true })]}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('positiveExamples')}
        />
      );

      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });

    // Precedence pin. The resolver and the host predicate genuinely disagree here: a single
    // whitespace row satisfies the array's `.min(1)` (length is 1) but counts as empty for
    // `getRequiredEmptyParameterIds`, which trims every entry. RHF documents that `setError`
    // "will not persist the associated input error if the input passes register's associated
    // rules", so this pins which verdict the user actually sees rather than leaving it to
    // whichever ran last.
    it("a host 'required' error survives a value the resolver considers valid (whitespace-only row)", () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={[listDef({ required: true })]}
          parameters={[{ $parameterType: 'text-list', id: 'positiveExamples', value: ['   '] }]}
          onChange={() => {}}
          errors={requiredErrors('positiveExamples')}
        />
      );

      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });
  });

  describe('map-enum parameter', () => {
    const mapDefs: GuardrailParameterDefinition[] = [
      {
        id: 'entities',
        type: 'enum-list',
        label: 'Entities',
        required: false,
        defaultValue: [],
        options: ['Email', 'Phone'],
      },
      {
        id: 'thresholds',
        type: 'map-enum',
        label: 'Thresholds',
        required: true,
        defaultValue: {},
        keySource: 'entities',
        min: 0,
        max: 1,
      },
    ];

    // With no selected keys there are no rows to render, but the builder still gates Save on a
    // required map's error — returning null left the user blocked with the reason nowhere on
    // screen.
    it('shows the label and host error when the source selection is empty', () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={mapDefs}
          parameters={[{ $parameterType: 'enum-list', id: 'entities', value: [] }]}
          onChange={() => {}}
          errors={requiredErrors('thresholds')}
        />
      );

      expect(screen.getByText('Thresholds')).toBeInTheDocument();
      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });

    it('still renders nothing when the selection is empty and there is no error', () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={mapDefs}
          parameters={[{ $parameterType: 'enum-list', id: 'entities', value: [] }]}
          onChange={() => {}}
        />
      );

      expect(screen.queryByText('Thresholds')).not.toBeInTheDocument();
    });
  });

  describe('boolean parameter', () => {
    it('toggles and reports the new value', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'strict',
          type: 'boolean',
          label: 'Strict mode',
          required: false,
          defaultValue: false,
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
      );

      fireEvent.click(screen.getByRole('switch'));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'boolean', id: 'strict', value: true },
      ]);
    });

    it('renders a host-supplied error message', () => {
      const defs: GuardrailParameterDefinition[] = [
        { id: 'strict', type: 'boolean', label: 'Strict mode', required: true, defaultValue: null },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          errors={requiredErrors('strict')}
        />
      );
      expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument();
    });
  });

  describe('parameter label', () => {
    it('renders the info-tooltip trigger when the definition has a tooltip', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: '',
          tooltip: 'Some helpful explanation.',
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.getByLabelText('More information')).toBeInTheDocument();
    });

    it('does not render the info-tooltip trigger without a tooltip', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: '',
        },
      ];

      render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      expect(screen.queryByLabelText('More information')).not.toBeInTheDocument();
    });
  });

  describe('updates existing parameters', () => {
    it('replaces existing parameter value on change', () => {
      const onChange = vi.fn();
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'threshold',
          type: 'number',
          label: 'Threshold',
          required: false,
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
        },
      ];
      const existingParams: GuardrailValidatorParameter[] = [
        { $parameterType: 'number', id: 'threshold', value: 0.3 },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={existingParams}
          onChange={onChange}
        />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0.9' } });
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'number', id: 'threshold', value: 0.9 },
      ]);
    });
  });

  describe('onClearError', () => {
    it('fires with the parameter id before onChange on any edit of that parameter', () => {
      const calls: string[] = [];
      const onClearError = vi.fn(() => calls.push('clear'));
      const onChange = vi.fn(() => calls.push('change'));
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'guardrailText',
          type: 'text',
          label: 'Rule prompt',
          required: true,
          defaultValue: '',
        },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={onChange}
          onClearError={onClearError}
        />
      );

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi' } });
      expect(onClearError).toHaveBeenCalledWith('guardrailText');
      expect(calls).toEqual(['clear', 'change']);
    });
  });

  describe('renderParameter override', () => {
    const defs: GuardrailParameterDefinition[] = [
      {
        id: 'model',
        type: 'enum',
        label: 'Judge model',
        required: true,
        defaultValue: null,
        options: [],
      },
      { id: 'threshold', type: 'number', label: 'Threshold', required: false, defaultValue: 0.5 },
    ];

    it('replaces the matched parameter and falls through for the rest', () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          renderParameter={(ctx) =>
            ctx.definition.id === 'model' ? (
              <div data-testid="custom-picker">picker</div>
            ) : undefined
          }
        />
      );

      expect(screen.getByTestId('custom-picker')).toBeInTheDocument();
      // The default editor for the overridden param is gone, the sibling stays.
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('onValueChange upserts the overridden parameter', () => {
      const onChange = vi.fn();
      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={onChange}
          renderParameter={(ctx) =>
            ctx.definition.id === 'model' ? (
              <button type="button" onClick={() => ctx.onValueChange('model-a')}>
                pick
              </button>
            ) : undefined
          }
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'pick' }));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'enum', id: 'model', value: 'model-a' },
      ]);
    });

    it('onParametersChange can write sidecar parameters alongside the overridden one', () => {
      const onChange = vi.fn();
      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={onChange}
          renderParameter={(ctx) =>
            ctx.definition.id === 'model' ? (
              <button
                type="button"
                onClick={() =>
                  ctx.onParametersChange([
                    { $parameterType: 'enum', id: 'model', value: 'byo-model' },
                    { $parameterType: 'text', id: 'byomConnectionId', value: 'conn-1' },
                  ])
                }
              >
                pick byo
              </button>
            ) : undefined
          }
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'pick byo' }));
      expect(onChange).toHaveBeenCalledWith([
        { $parameterType: 'enum', id: 'model', value: 'byo-model' },
        { $parameterType: 'text', id: 'byomConnectionId', value: 'conn-1' },
      ]);
    });
  });

  describe('localization', () => {
    it('overrides individual strings via the labels prop', () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'positiveExamples',
          type: 'text-list',
          label: 'Positive examples',
          required: false,
          defaultValue: [],
        },
      ];

      render(
        <GuardrailValidatorForm
          parameterDefinitions={defs}
          parameters={[]}
          onChange={() => {}}
          labels={{ addItem: 'Hinzufügen' }}
        />
      );

      expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('resolves the component strings from the ambient lingui catalog', async () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'positiveExamples',
          type: 'text-list',
          label: 'Positive examples',
          required: false,
          defaultValue: [],
        },
      ];

      render(
        <ApI18nProvider component="canvas" locale="ja">
          <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
        </ApI18nProvider>
      );

      expect(await screen.findByRole('button', { name: '追加' })).toBeInTheDocument();
    });

    // The resolver messages are the easiest strings to leave behind: apollo-wind has its own
    // English fallbacks, so omitting `messages` fails silently rather than rendering a missing
    // key. This asserts the translated text so a dropped catalog entry is a failing test.
    it('resolves the resolver validation messages from the catalog, not wind English', async () => {
      const defs: GuardrailParameterDefinition[] = [
        {
          id: 'threshold',
          type: 'number',
          label: 'Threshold',
          required: false,
          defaultValue: 0.5,
          min: 0,
          max: 1,
        },
      ];

      render(
        <ApI18nProvider component="canvas" locale="ja">
          <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
        </ApI18nProvider>
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });

      expect(await screen.findByText('1 以下である必要があります')).toBeInTheDocument();
      expect(screen.queryByText('Must be at most 1')).not.toBeInTheDocument();
    });
  });

  // `validateLive` is the only thing standing between the resolver and the screen here: mounted
  // standalone there is no host `errors` channel, so these assert Channel B directly.
  describe('validateLive', () => {
    const rangeDefs: GuardrailParameterDefinition[] = [
      {
        id: 'threshold',
        type: 'number',
        label: 'Threshold',
        required: false,
        defaultValue: 0.5,
        min: 0,
        max: 1,
      },
    ];

    it('validates as the user types by default, for hosts with no save of their own', async () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={rangeDefs}
          parameters={[]}
          onChange={() => {}}
        />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });

      expect(await screen.findByText('Must be at most 1')).toBeInTheDocument();
    });

    it('stays silent while false', async () => {
      render(
        <GuardrailValidatorForm
          parameterDefinitions={rangeDefs}
          parameters={[]}
          validateLive={false}
          onChange={() => {}}
        />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });

      // `findByText` waits the full timeout before rejecting, so this fails if the resolver
      // reports at any point. A `queryByText` here would pass simply by running first.
      await expect(screen.findByText('Must be at most 1')).rejects.toThrow();
    });

    it('reports the already-invalid value when it flips true, without a further edit', async () => {
      const { rerender } = render(
        <GuardrailValidatorForm
          parameterDefinitions={rangeDefs}
          parameters={[]}
          validateLive={false}
          onChange={() => {}}
        />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
      expect(screen.queryByText('Must be at most 1')).not.toBeInTheDocument();

      rerender(
        <GuardrailValidatorForm
          parameterDefinitions={rangeDefs}
          parameters={[]}
          validateLive={true}
          onChange={() => {}}
        />
      );

      expect(await screen.findByText('Must be at most 1')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations on a kitchen-sink definition', async () => {
      const defs: GuardrailParameterDefinition[] = [
        { id: 'prompt', type: 'text', label: 'Prompt', required: true, defaultValue: 'check tone' },
        {
          id: 'model',
          type: 'enum',
          label: 'Model',
          required: true,
          defaultValue: 'a',
          options: ['a', 'b'],
        },
        { id: 'threshold', type: 'number', label: 'Threshold', required: false, defaultValue: 0.5 },
        {
          id: 'strict',
          type: 'boolean',
          label: 'Strict mode',
          required: false,
          defaultValue: true,
        },
        {
          id: 'entities',
          type: 'enum-list',
          label: 'Entities',
          required: true,
          defaultValue: ['Email'],
          options: ['Email', 'Phone'],
        },
        {
          id: 'thresholds',
          type: 'map-enum',
          label: 'Entity thresholds',
          required: false,
          defaultValue: { Email: 0.5, Phone: 0.5 },
          keySource: 'entities',
          min: 0,
          max: 1,
          step: 0.1,
        },
        {
          id: 'examples',
          type: 'text-list',
          label: 'Examples',
          required: false,
          defaultValue: ['sample'],
          maxItems: 3,
        },
      ];

      const { container } = render(
        <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={() => {}} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// Controlled contract under the MetadataForm internals
// ============================================================================

describe('controlled contract (MetadataForm internals)', () => {
  const textDef: GuardrailParameterDefinition = {
    id: 'prompt',
    type: 'text',
    label: 'Prompt',
    required: true,
    defaultValue: '',
  };

  it('a synchronous host echo is a no-op: no re-emission, focus and value survive', () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <GuardrailValidatorForm
        parameterDefinitions={[textDef]}
        parameters={[]}
        onChange={onChange}
      />
    );

    const textarea = screen.getByLabelText(/Prompt/);
    textarea.focus();
    fireEvent.change(textarea, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0] as GuardrailValidatorParameter[];
    expect(emitted).toEqual([{ $parameterType: 'text', id: 'prompt', value: 'hello' }]);

    // Host echoes the emitted array back, as controlled hosts do on every keystroke.
    rerender(
      <GuardrailValidatorForm
        parameterDefinitions={[textDef]}
        parameters={emitted}
        onChange={onChange}
      />
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveValue('hello');
  });

  it('an external (non-echo) parameters change updates the rendered value', () => {
    const { rerender } = render(
      <GuardrailValidatorForm
        parameterDefinitions={[textDef]}
        parameters={[{ $parameterType: 'text', id: 'prompt', value: 'one' }]}
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/Prompt/)).toHaveValue('one');

    rerender(
      <GuardrailValidatorForm
        parameterDefinitions={[textDef]}
        parameters={[{ $parameterType: 'text', id: 'prompt', value: 'two' }]}
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/Prompt/)).toHaveValue('two');
  });

  it('sidecar parameters without a definition ride along untouched through later edits', () => {
    const onChange = vi.fn();
    const defs: GuardrailParameterDefinition[] = [
      {
        id: 'model',
        type: 'enum',
        label: 'Model',
        required: true,
        defaultValue: 'a',
        options: ['a', 'b'],
      },
      textDef,
    ];
    // byomConnectionId has no definition — it was written by a renderParameter override.
    const parameters: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum', id: 'model', value: 'byo-model' },
      { $parameterType: 'text', id: 'byomConnectionId', value: 'conn-1' },
    ];

    render(
      <GuardrailValidatorForm
        parameterDefinitions={defs}
        parameters={parameters}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/Prompt/), { target: { value: 'edited' } });
    expect(onChange).toHaveBeenCalledWith([
      { $parameterType: 'enum', id: 'model', value: 'byo-model' },
      { $parameterType: 'text', id: 'byomConnectionId', value: 'conn-1' },
      { $parameterType: 'text', id: 'prompt', value: 'edited' },
    ]);
  });

  it('clearing a number input emits 0, never NaN', () => {
    const onChange = vi.fn();
    const defs: GuardrailParameterDefinition[] = [
      { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 0.5 },
    ];

    render(
      <GuardrailValidatorForm parameterDefinitions={defs} parameters={[]} onChange={onChange} />
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith([
      { $parameterType: 'number', id: 'threshold', value: 0 },
    ]);
  });
});
