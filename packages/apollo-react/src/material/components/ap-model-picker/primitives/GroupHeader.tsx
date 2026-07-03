import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Colors } from '@uipath/apollo-core';
import type React from 'react';

export interface GroupHeaderProps {
  label: string;
  /**
   * Descriptive hint about the group. Surfaced as a `title` tooltip on
   * the header — inline hints added more chrome than information.
   */
  hint?: string;
  /**
   * Right-aligned model count (e.g. "3 models"). Pass when known; the
   * header pluralizes automatically. Omit to suppress.
   */
  count?: number;
  /**
   * Pre-localized "{n} models" / "{n} model" label rendered to the
   * right of the title. When provided, overrides the built-in
   * (English-only) ternary derived from `count`.
   */
  countLabel?: string;
  /** Reduces vertical padding for the compact picker. */
  dense?: boolean;
  /**
   * Whether this is the first header in the list. When true, no
   * `border-top` is drawn — that line would double up with the search
   * row's existing `border-bottom`.
   */
  isFirst?: boolean;
  /**
   * Leading icon glyph rendered before the label. Used for the BYO
   * accordion's shield icon. Falls back to nothing when omitted.
   */
  leadingIcon?: React.ReactNode;
  /**
   * When `true`, the header renders as a button with a trailing
   * chevron (rotated based on `collapsed`) and calls `onToggle` on
   * click. Used for the BYO accordion at the bottom of the list.
   */
  collapsible?: boolean;
  /** Current collapsed state (rotates chevron) when `collapsible`. */
  collapsed?: boolean;
  /** Click handler; required when `collapsible`. */
  onToggle?: () => void;
  /** Optional test id forwarded to the header. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'data-testid'?: string;
}

/**
 * Section header rendered between model groups in the picker dropdown.
 * Exportable so teams can render their own grouped layouts.
 *
 * Two modes:
 *   - **Static** (default): a label band with optional leading icon +
 *     trailing count. No interactivity. Used for Recommended / Preview
 *     / More / Deprecating / per-vendor sections.
 *   - **Collapsible**: same chrome, but the entire band is a button
 *     with a trailing chevron that flips on `collapsed`. Used by the
 *     BYO accordion at the bottom of the Category view.
 *
 * All colors read through Apollo's CSS custom properties so the
 * header dark-modes correctly when used as a web component.
 */
export const GroupHeader: React.FC<GroupHeaderProps> = ({
  label,
  hint,
  count,
  countLabel,
  dense,
  isFirst,
  leadingIcon,
  collapsible,
  collapsed,
  onToggle,
  'data-testid': dataTestId,
}) => {
  const resolvedCountLabel =
    countLabel ?? (count != null ? `${count} ${count === 1 ? 'model' : 'models'}` : null);

  const content = (
    <>
      {leadingIcon && (
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            mr: 0.25,
          }}
        >
          {leadingIcon}
        </Box>
      )}
      <Typography
        variant="overline"
        sx={{
          fontSize: dense ? 9 : 11,
          fontWeight: 700,
          color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
          letterSpacing: 0.7,
          lineHeight: 1.2,
          display: 'block',
          flex: '1 1 auto',
        }}
      >
        {label}
      </Typography>
      {resolvedCountLabel != null && (
        <Typography
          variant="caption"
          sx={{
            color: `var(--color-foreground-disable, ${Colors.ColorGray500})`,
            fontSize: dense ? 10 : 11,
            fontWeight: 400,
            flexShrink: 0,
          }}
        >
          {resolvedCountLabel}
        </Typography>
      )}
      {collapsible && (
        <KeyboardArrowRightIcon
          aria-hidden
          sx={{
            fontSize: 18,
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            transition: 'transform 150ms',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            flexShrink: 0,
          }}
        />
      )}
    </>
  );

  const baseSx = {
    width: '100%',
    px: dense ? 1.5 : 1.75,
    pt: isFirst ? (dense ? 0.75 : 1.5) : dense ? 1.25 : 1.75,
    pb: dense ? 0.5 : 0.875,
    backgroundColor: `var(--color-background-secondary, ${Colors.ColorGray150})`,
    borderTop: isFirst ? 'none' : `1px solid var(--color-border-grid, ${Colors.ColorGray150})`,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    textAlign: 'left' as const,
  };

  if (collapsible) {
    return (
      <ButtonBase
        component="div"
        role="button"
        title={hint}
        data-testid={dataTestId}
        onClick={onToggle}
        aria-expanded={!collapsed}
        sx={{
          ...baseSx,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: `var(--color-background-hover, rgba(82, 96, 105, 0.078))`,
          },
        }}
      >
        {content}
      </ButtonBase>
    );
  }
  return (
    <Box title={hint} role="presentation" data-testid={dataTestId} sx={baseSx}>
      {content}
    </Box>
  );
};
