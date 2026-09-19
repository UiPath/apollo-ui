import { Chip, styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import type { StatusTypes } from '../../../types/statusTypes';
import { type ApBadgeProps, BadgeSize } from './ApBadge.types';

interface StyledBadgeProps {
  badgeSize?: BadgeSize;
  badgeStatus?: StatusTypes;
}

/**
 * One step per size on the token scale, so a badge can sit beside 12px body text without the caller
 * overriding the component: 16/10, 20/12, 24/14.
 */
const SIZE_METRICS: Record<
  BadgeSize,
  {
    height: string;
    fontSize: string;
    lineHeight: string;
    padding: string;
    labelPadding: string;
    iconSize: string;
  }
> = {
  [BadgeSize.SMALL]: {
    height: token.Spacing.SpacingBase,
    fontSize: token.FontFamily.FontXsSize,
    lineHeight: token.FontFamily.FontSLineHeight,
    padding: `${token.Padding.PadXs} ${token.Padding.PadL}`,
    labelPadding: '0',
    iconSize: token.Spacing.SpacingS,
  },
  [BadgeSize.MEDIUM]: {
    height: token.Spacing.SpacingM,
    fontSize: token.FontFamily.FontSSize,
    lineHeight: token.FontFamily.FontSLineHeight,
    padding: `${token.Padding.PadXs} ${token.Padding.PadL}`,
    labelPadding: '0',
    iconSize: token.Spacing.SpacingBase,
  },
  [BadgeSize.LARGE]: {
    height: token.Spacing.SpacingL,
    fontSize: token.FontFamily.FontMSize,
    lineHeight: token.FontFamily.FontMLineHeight,
    padding: `${token.Padding.PadS} ${token.Padding.PadL}`,
    labelPadding: `${token.Spacing.SpacingMicro} ${token.Spacing.SpacingS}`,
    iconSize: token.Spacing.SpacingBase,
  },
};

const StyledBadge = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'badgeSize' && prop !== 'badgeStatus',
})<StyledBadgeProps>(({ badgeSize, badgeStatus }) => {
  let backgroundColor: string;
  let textColor: string;

  switch (badgeStatus) {
    case 'error':
      backgroundColor = 'var(--color-error-background)';
      textColor = 'var(--color-error-text)';
      break;
    case 'warning':
      backgroundColor = 'var(--color-warning-background)';
      textColor = 'var(--color-warning-text)';
      break;
    case 'info':
      backgroundColor = 'var(--color-info-background)';
      textColor = 'var(--color-info-text)';
      break;
    case 'success':
      backgroundColor = 'var(--color-success-background)';
      textColor = 'var(--color-success-text)';
      break;
    default:
      backgroundColor = 'var(--color-background-secondary)';
      textColor = 'var(--color-foreground)';
  }

  const metrics = SIZE_METRICS[badgeSize ?? BadgeSize.SMALL] ?? SIZE_METRICS[BadgeSize.SMALL];

  return {
    backgroundColor,
    color: textColor,
    fontWeight: token.FontFamily.FontWeightSemibold,
    height: metrics.height,
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight,
    padding: metrics.padding,

    '.MuiChip-label': { padding: metrics.labelPadding },

    // The icon inherits the badge's text colour so a status badge stays one colour, and it sits on the
    // label's own gap rather than MUI's default negative margins.
    '.MuiChip-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: metrics.iconSize,
      height: metrics.iconSize,
      fontSize: metrics.iconSize,
      margin: `0 ${token.Spacing.SpacingMicro} 0 0`,
      color: 'inherit',
      flexShrink: 0,

      '& > *': { width: '100%', height: '100%' },
    },

    '&.MuiChip-root:hover': {
      backgroundColor,
    },
  };
});

/**
 * ApBadge is a compact element to display status, labels, or metadata.
 * It wraps MUI's Chip component with Apollo design system styling and semantic colors.
 */
export const ApBadge = React.forwardRef<HTMLDivElement, ApBadgeProps>(
  (
    { label, size = BadgeSize.SMALL, status = 'default', icon, className, style, title, ...aria },
    ref
  ) => {
    return (
      <StyledBadge
        ref={ref}
        label={label}
        // Wrapped, because MUI sizes the icon by cloning it with its own className. An arbitrary node
        // need not accept className, so the class would be dropped and the icon would go unstyled.
        icon={icon ? <span>{icon}</span> : undefined}
        badgeSize={size}
        badgeStatus={status as StatusTypes}
        className={className}
        style={style}
        // An icon-bearing badge usually needs a name of its own, and MUI's Chip types do not overlap
        // with the rest of HTMLAttributes cleanly, so only these are forwarded.
        title={title}
        aria-label={aria['aria-label']}
      />
    );
  }
);

ApBadge.displayName = 'ApBadge';
