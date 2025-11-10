import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Label } from '../../src/components/ui/label';

describe('Label', () => {
  it('renders label text', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates with input via htmlFor', () => {
    render(
      <div>
        <Label htmlFor="test-input">Label</Label>
        <input id="test-input" />
      </div>
    );
    const label = screen.getByText('Label');
    expect(label).toHaveAttribute('for', 'test-input');
  });
});
