import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { SearchBox } from './SearchBox';

const baseProps = {
  value: 'query',
  onChange: vi.fn(),
  clear: vi.fn(),
};

describe('SearchBox clear button accessible name', () => {
  it('exposes a default accessible name on the clear button when a value is present', () => {
    render(<SearchBox {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('uses the provided clearButtonLabel as the accessible name', () => {
    render(<SearchBox {...baseProps} clearButtonLabel="Clear search nodes" />);

    expect(screen.getByRole('button', { name: 'Clear search nodes' })).toBeInTheDocument();
  });

  it('does not render the clear button when there is no value', () => {
    render(<SearchBox {...baseProps} value="" />);

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
