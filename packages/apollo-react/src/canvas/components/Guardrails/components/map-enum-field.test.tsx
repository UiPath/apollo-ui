import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuardrailValidatorForm } from '../guardrail-validator-form';
import type { GuardrailParameterDefinition } from '../types';

// Uses the real Radix tooltip (the shared setup stubs it out).
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const LONG_LABEL = 'China Resident Identity Card Number';

const DEFS: GuardrailParameterDefinition[] = [
  {
    id: 'entities',
    type: 'enum-list',
    label: 'Entities',
    required: true,
    defaultValue: ['CNResidentIdentityCardNumber'],
    options: ['CNResidentIdentityCardNumber'],
    optionLabels: { CNResidentIdentityCardNumber: LONG_LABEL },
  },
  {
    id: 'thresholds',
    type: 'map-enum',
    label: 'Thresholds',
    required: true,
    defaultValue: {},
    keySource: 'entities',
  },
];

describe('MapEnumField', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a tooltip with the full entity name when hovering a threshold row label', () => {
    vi.useFakeTimers();
    // No ancestor provider: the field brings its own.
    render(
      <GuardrailValidatorForm parameterDefinitions={DEFS} parameters={[]} onChange={() => {}} />
    );

    const row = screen.getByRole('spinbutton', { name: `Thresholds: ${LONG_LABEL}` }).parentElement;
    const label = within(row as HTMLElement).getByText(LONG_LABEL);
    expect(label).toHaveAttribute('data-state', 'closed');

    fireEvent.pointerMove(label, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(label).toHaveAttribute('data-state', 'delayed-open');
    expect(screen.getByRole('tooltip')).toHaveTextContent(LONG_LABEL);
  });
});
