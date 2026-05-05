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
    expect(screen.getByTestId('badge').style.getPropertyValue('--initials-badge-size')).toBe(
      '48px'
    );
  });

  it('forwards className for consumer-side styling overrides', () => {
    render(<InitialsBadge name="Foo" className="custom-badge" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('custom-badge');
  });

  it('merges consumer-supplied style on top of the size CSS variable', () => {
    render(<InitialsBadge name="Foo" size="48px" style={{ opacity: 0.5 }} data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(badge.style.getPropertyValue('--initials-badge-size')).toBe('48px');
    expect(badge).toHaveStyle({ opacity: '0.5' });
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

  it('handles leading whitespace before an emoji (trim then code-point)', () => {
    expect(getInitial('  🤖 Robot')).toBe('🤖');
  });

  // Documented limitation: multi-codepoint grapheme clusters yield only the
  // first code point. We accept the imperfect-but-cheap behavior — see
  // `getInitial` JSDoc.
  it('returns only the first code point of multi-codepoint grapheme clusters', () => {
    // 🇺🇸 = two regional-indicator code points; only the first survives.
    const initial = getInitial('🇺🇸 USA');
    expect(initial.length).toBeLessThanOrEqual(2); // surrogate pair = 2 UTF-16 units
    // Sanity: not '?', not a literal '🇺🇸' grapheme.
    expect(initial).not.toBe('?');
    expect(initial).not.toBe('🇺🇸');
  });
});
