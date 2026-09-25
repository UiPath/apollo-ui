import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResourcePickerEmptyState } from './resource-picker-empty-state';

describe('ResourcePickerEmptyState', () => {
  it('distinguishes an empty list from a failed search', () => {
    const { rerender } = render(<ResourcePickerEmptyState />);
    expect(screen.getByText('No matches.')).toBeInTheDocument();

    rerender(<ResourcePickerEmptyState query="zzz" />);
    expect(screen.getByText('No results match “zzz”.')).toBeInTheDocument();
    expect(screen.queryByText('No matches.')).not.toBeInTheDocument();
  });

  it('takes consumer wording for the empty case', () => {
    render(<ResourcePickerEmptyState emptyText="No entities yet." />);
    expect(screen.getByText('No entities yet.')).toBeInTheDocument();
  });

  it('keeps the consumer wording out of the no-match message', () => {
    render(<ResourcePickerEmptyState query="zzz" emptyText="No entities yet." />);
    expect(screen.getByText('No results match “zzz”.')).toBeInTheDocument();
    expect(screen.queryByText('No entities yet.')).not.toBeInTheDocument();
  });
});
