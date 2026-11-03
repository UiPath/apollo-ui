import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PickerEmptyState } from './picker-empty-state';

describe('PickerEmptyState', () => {
  it('reports a load failure', () => {
    render(<PickerEmptyState error="You do not have access to this folder." />);
    // An alert, so the asynchronous failure is announced.
    expect(screen.getByRole('alert')).toHaveTextContent('You do not have access to this folder.');
  });

  it('shows the loading text while a level is in flight', () => {
    render(<PickerEmptyState loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('distinguishes an empty folder from a failed search', () => {
    const { rerender } = render(<PickerEmptyState />);
    expect(screen.getByText('No results.')).toBeInTheDocument();

    rerender(<PickerEmptyState query="zzz" />);
    expect(screen.getByText('No results match “zzz”.')).toBeInTheDocument();
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  });

  it('announces an empty folder and a search with no matches as a status', () => {
    const { rerender } = render(<PickerEmptyState />);
    expect(screen.getByRole('status')).toHaveTextContent('No results.');

    rerender(<PickerEmptyState query="zzz" />);
    expect(screen.getByRole('status')).toHaveTextContent('No results match “zzz”.');
  });

  it('sizes the loading glyph, not only the spinner around it', () => {
    const { container } = render(<PickerEmptyState loading />);
    expect(container.querySelector('[data-slot="spinner"]')).toHaveClass('[&_svg]:size-3.5');
  });

  it('announces consumer loading text through the spinner status', () => {
    render(<PickerEmptyState loading loadingText="Fetching folders" />);
    // One status, announcing the consumer's wording rather than the default.
    expect(screen.getByRole('status')).toHaveTextContent('Fetching folders');
  });

  it('prefers the error over loading and empty', () => {
    render(<PickerEmptyState error="No access." loading query="zzz" />);
    expect(screen.getByText('No access.')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.queryByText(/No results match/)).not.toBeInTheDocument();
  });

  it('prefers loading over the empty and no-match messages', () => {
    render(<PickerEmptyState loading query="zzz" />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText(/No results match/)).not.toBeInTheDocument();
  });

  it('takes consumer wording for the empty and loading cases', () => {
    const { rerender } = render(<PickerEmptyState emptyText="This drive is empty." />);
    expect(screen.getByText('This drive is empty.')).toBeInTheDocument();

    rerender(<PickerEmptyState loading loadingText="Fetching folders" />);
    expect(screen.getByText('Fetching folders')).toBeInTheDocument();
  });

  it('takes consumer wording for the empty and no-match cases', () => {
    const { rerender } = render(<PickerEmptyState emptyText="No entities yet." />);
    expect(screen.getByText('No entities yet.')).toBeInTheDocument();

    rerender(
      <PickerEmptyState
        query="zzz"
        emptyText="No entities yet."
        noMatchText={(query) => `Nichts für ${query}`}
      />
    );
    expect(screen.getByText('Nichts für zzz')).toBeInTheDocument();
    expect(screen.queryByText('No entities yet.')).not.toBeInTheDocument();
  });
});
