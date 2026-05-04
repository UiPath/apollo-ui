import styled from '@emotion/styled';

/**
 * Circular badge with the first character of a display name. Used as the
 * universal fallback when a {@link ListItem} or canvas node has no icon
 * source — mirrors UiPath StudioWeb's `<ui-package-icon>` behavior so the
 * canvas surface and the toolbox/picker stay visually consistent.
 *
 * Sized via the `--initials-badge-size` CSS custom property (default 24px),
 * so callers that wrap it in a sized container can size it down by setting
 * a smaller value, or up by passing `--initials-badge-size` from the parent.
 * Background uses `var(--canvas-primary)`; text is white.
 */
const InitialsBadgeRoot = styled.span`
  display: inline-flex;
  width: var(--initials-badge-size, 24px);
  height: var(--initials-badge-size, 24px);
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--canvas-primary);
  color: #ffffff;
  /** Scales legibly across sizes — caps at the badge size so the letter never overflows. */
  font-size: calc(var(--initials-badge-size, 24px) * 0.5);
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
`;

export interface InitialsBadgeProps {
  /** Display name to derive the initial from; first character is rendered. */
  name: string;
  /** Optional override for the badge size CSS variable (e.g. `'32px'` or `'1.5rem'`). */
  size?: string;
  /** Optional `data-testid` override for tests that need to disambiguate multiple badges. */
  'data-testid'?: string;
}

/**
 * First user-perceived character of a name. Code-point aware so emoji and
 * non-BMP characters survive without slicing a surrogate pair. Falls back to
 * `?` when the name is empty/whitespace.
 */
export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return [...trimmed][0] ?? '?';
}

export function InitialsBadge({ name, size, 'data-testid': dataTestId }: InitialsBadgeProps) {
  return (
    <InitialsBadgeRoot
      aria-hidden="true"
      data-testid={dataTestId}
      style={
        size ? ({ ['--initials-badge-size' as string]: size } as React.CSSProperties) : undefined
      }
    >
      {getInitial(name)}
    </InitialsBadgeRoot>
  );
}
