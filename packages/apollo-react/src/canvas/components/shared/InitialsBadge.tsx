import styled from '@emotion/styled';

/**
 * Circular badge with the first character of a display name. Rendered when a
 * `ListItem` or canvas node has no icon source. Sized via the
 * `--initials-badge-size` CSS variable (default 24px).
 */
const InitialsBadgeRoot = styled.span`
  display: inline-flex;
  width: var(--initials-badge-size, 24px);
  height: var(--initials-badge-size, 24px);
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--canvas-primary);
  color: var(--canvas-on-primary, #ffffff);
  font-size: calc(var(--initials-badge-size, 24px) * 0.5);
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
`;

export interface InitialsBadgeProps {
  name: string;
  /** Override for `--initials-badge-size` (e.g. `'32px'`, `'1.5rem'`). */
  size?: string;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

/**
 * First Unicode code point of a name; falls back to `?` when blank. Multi-codepoint
 * grapheme clusters (flags, ZWJ sequences) yield only the first code point —
 * `Intl.Segmenter` handling isn't worth the cost for a 1-character fallback.
 */
export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return [...trimmed][0] ?? '?';
}

export function InitialsBadge({
  name,
  size,
  className,
  style,
  'data-testid': dataTestId,
}: InitialsBadgeProps) {
  const mergedStyle: React.CSSProperties | undefined = (() => {
    const sizeStyle = size
      ? ({ ['--initials-badge-size' as string]: size } as React.CSSProperties)
      : undefined;
    if (!sizeStyle && !style) return undefined;
    return { ...sizeStyle, ...style };
  })();

  return (
    <InitialsBadgeRoot
      aria-hidden="true"
      className={className}
      data-testid={dataTestId}
      style={mergedStyle}
    >
      {getInitial(name)}
    </InitialsBadgeRoot>
  );
}
