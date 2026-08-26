import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DefaultEntryPointIndicator } from './TriggerNode';

describe('DefaultEntryPointIndicator', () => {
  it('renders an accessible default entry point marker', () => {
    render(<DefaultEntryPointIndicator />);

    expect(screen.getByLabelText('Default entry point')).toBeInTheDocument();
  });
});
