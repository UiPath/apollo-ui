import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { ValueModeIndicator } from './value-mode-indicator';

describe('ValueModeIndicator', () => {
  it.each(['literal', 'variable', 'prompt'] as const)('renders nothing in %s mode', (mode) => {
    const { container } = render(<ValueModeIndicator mode={mode} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks an expression with `=` and names it on hover', () => {
    render(<ValueModeIndicator mode="expression" />);
    expect(screen.getByTitle('JavaScript expression')).toHaveTextContent('=');
  });

  it('dims when the field is disabled', () => {
    render(<ValueModeIndicator mode="expression" disabled />);
    expect(screen.getByTitle('JavaScript expression')).toHaveClass('opacity-50');
  });

  it('takes an alignment override for a growable editor', () => {
    render(<ValueModeIndicator mode="expression" className="mt-[5px]" />);
    expect(screen.getByTitle('JavaScript expression')).toHaveClass('mt-[5px]');
  });

  it('names itself for screen readers, which would otherwise read the glyph', () => {
    render(<ValueModeIndicator mode="expression" />);
    expect(screen.getByRole('img', { name: 'JavaScript expression' })).toBeInTheDocument();
  });

  it('forwards its ref and extra props to the glyph’s box', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ValueModeIndicator mode="expression" ref={ref} data-testid="indicator" />);
    expect(ref.current).toBe(screen.getByTestId('indicator'));
  });

  it('names itself with the host’s translation', () => {
    render(
      <ValueModeIndicator
        mode="expression"
        strings={{ expressionIndicator: 'Expression JavaScript' }}
      />
    );
    expect(screen.getByTitle('Expression JavaScript')).toBeInTheDocument();
  });
});
