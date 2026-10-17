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

  it('uses the provided clearButtonAriaLabel as the accessible name', () => {
    render(<SearchBox {...baseProps} clearButtonAriaLabel="Clear search nodes" />);

    expect(screen.getByRole('button', { name: 'Clear search nodes' })).toBeInTheDocument();
  });

  it('does not render the clear button when there is no value', () => {
    render(<SearchBox {...baseProps} value="" />);

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});

describe('SearchBox pending indicator', () => {
  it('does not render a spinner by default', () => {
    render(<SearchBox {...baseProps} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a labelled spinner while pending', () => {
    render(<SearchBox {...baseProps} pending />);

    expect(screen.getByRole('status', { name: 'Searching' })).toBeInTheDocument();
  });

  it('uses the provided pendingLabel as the spinner accessible name', () => {
    render(<SearchBox {...baseProps} pending pendingLabel="Searching nodes" />);

    expect(screen.getByRole('status', { name: 'Searching nodes' })).toBeInTheDocument();
  });

  it('keeps the clear button while pending', () => {
    render(<SearchBox {...baseProps} pending />);

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });
});
