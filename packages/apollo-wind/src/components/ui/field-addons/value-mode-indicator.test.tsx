import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { ValueModeIndicator } from './value-mode-indicator';
import { DEFAULT_VALUE_MODE_STRINGS, ValueModeStringsProvider } from './value-mode-strings';

const renderWithStrings = (ui: React.ReactElement) =>
  render(
    <ValueModeStringsProvider strings={DEFAULT_VALUE_MODE_STRINGS}>{ui}</ValueModeStringsProvider>
  );

describe('ValueModeIndicator', () => {
  it('renders nothing in literal mode', () => {
    const { container } = renderWithStrings(<ValueModeIndicator mode="literal" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks an expression with `=` and names it on hover', () => {
    renderWithStrings(<ValueModeIndicator mode="expression" />);
    expect(screen.getByTitle('JavaScript expression')).toHaveTextContent('=');
  });

  it('dims when the field is disabled', () => {
    renderWithStrings(<ValueModeIndicator mode="expression" disabled />);
    expect(screen.getByTitle('JavaScript expression')).toHaveClass('opacity-50');
  });

  it('takes an alignment override for a growable editor', () => {
    renderWithStrings(<ValueModeIndicator mode="expression" className="mt-[5px]" />);
    expect(screen.getByTitle('JavaScript expression')).toHaveClass('mt-[5px]');
  });

  it('names itself for screen readers, which would otherwise read the glyph', () => {
    renderWithStrings(<ValueModeIndicator mode="expression" />);
    expect(screen.getByRole('img', { name: 'JavaScript expression' })).toBeInTheDocument();
  });

  it('forwards its ref and extra props to the glyph’s box', () => {
    const ref = React.createRef<HTMLDivElement>();
    renderWithStrings(<ValueModeIndicator mode="expression" ref={ref} data-testid="indicator" />);
    expect(ref.current).toBe(screen.getByTestId('indicator'));
  });

  it('names itself with the host’s translation', () => {
    render(
      <ValueModeStringsProvider strings={{ expressionIndicator: 'Expression JavaScript' }}>
        <ValueModeIndicator mode="expression" />
      </ValueModeStringsProvider>
    );
    expect(screen.getByTitle('Expression JavaScript')).toBeInTheDocument();
  });
});
