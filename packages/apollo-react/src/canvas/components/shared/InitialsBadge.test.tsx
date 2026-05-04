import { describe, expect, it } from 'vitest';
import { render, screen } from '../../utils/testing';
import { getInitial, InitialsBadge } from './InitialsBadge';

describe('InitialsBadge', () => {
  it('renders the first character of the name uppercased', () => {
    render(<InitialsBadge name="Microsoft Azure AI Foundry" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('M');
  });

  it('keeps a leading emoji intact instead of slicing a surrogate pair', () => {
    render(<InitialsBadge name="🤖 Robot Agent" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('🤖');
  });

  it('falls back to "?" when the name is blank', () => {
    render(<InitialsBadge name="   " data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('?');
  });

  it('is hidden from assistive tech (the surrounding row/node already announces the name)', () => {
    render(<InitialsBadge name="Foo" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards a custom size to the --initials-badge-size CSS variable', () => {
    render(<InitialsBadge name="Foo" size="48px" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveStyle({ '--initials-badge-size': '48px' });
  });
});

describe('getInitial', () => {
  it('returns "?" for empty or whitespace-only names', () => {
    expect(getInitial('')).toBe('?');
    expect(getInitial('   ')).toBe('?');
    expect(getInitial('\n\t')).toBe('?');
  });

  it('returns the first user-perceived character for ASCII names', () => {
    expect(getInitial('Foundry')).toBe('F');
    expect(getInitial('  Foundry  ')).toBe('F');
  });

  it('returns the first code point for emoji-leading names', () => {
    expect(getInitial('🤖 Robot')).toBe('🤖');
  });
});
