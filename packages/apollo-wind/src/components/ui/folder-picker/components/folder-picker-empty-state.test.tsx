import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FolderPickerEmptyState } from './folder-picker-empty-state';

describe('FolderPickerEmptyState', () => {
  it('reports a load failure', () => {
    render(<FolderPickerEmptyState error="You do not have access to this folder." />);
    expect(screen.getByText('You do not have access to this folder.')).toBeInTheDocument();
  });

  it('shows the loading text while a level is in flight', () => {
    render(<FolderPickerEmptyState loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('distinguishes an empty folder from a failed search', () => {
    const { rerender } = render(<FolderPickerEmptyState />);
    expect(screen.getByText('No subfolders.')).toBeInTheDocument();

    rerender(<FolderPickerEmptyState query="zzz" />);
    expect(screen.getByText('No folders match “zzz”.')).toBeInTheDocument();
    expect(screen.queryByText('No subfolders.')).not.toBeInTheDocument();
  });

  it('prefers the error over loading and empty', () => {
    render(<FolderPickerEmptyState error="No access." loading query="zzz" />);
    expect(screen.getByText('No access.')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.queryByText(/No folders match/)).not.toBeInTheDocument();
  });

  it('prefers loading over the empty and no-match messages', () => {
    render(<FolderPickerEmptyState loading query="zzz" />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText(/No folders match/)).not.toBeInTheDocument();
  });

  it('takes consumer wording for the empty and loading cases', () => {
    const { rerender } = render(<FolderPickerEmptyState emptyText="This drive is empty." />);
    expect(screen.getByText('This drive is empty.')).toBeInTheDocument();

    rerender(<FolderPickerEmptyState loading loadingText="Fetching folders" />);
    expect(screen.getByText('Fetching folders')).toBeInTheDocument();
  });
});
