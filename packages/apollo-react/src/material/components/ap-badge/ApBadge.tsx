import React from 'react';

import {
  Chip,
  styled,
} from '@mui/material';
import token from '@uipath/apollo-core';

import { StatusTypes } from '../../../types/statusTypes';
import {
  ApBadgeProps,
  BadgeSize,
} from './ApBadge.types';

interface StyledBadgeProps {
    badgeSize?: BadgeSize;
    badgeStatus?: StatusTypes;
}

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

    return {
        backgroundColor,
        color: textColor,
        fontWeight: token.FontFamily.FontWeightSemibold,
        height: badgeSize === 'small' ? token.Spacing.SpacingBase : token.Spacing.SpacingL,
        fontSize: badgeSize === 'small' ? token.FontFamily.FontXsSize : token.FontFamily.FontMSize,
        lineHeight: badgeSize === 'small' ? token.FontFamily.FontSLineHeight : token.FontFamily.FontMLineHeight,

        '.MuiChip-label': {
            padding: badgeSize === 'small' ? '0' : `${token.Spacing.SpacingMicro} ${token.Spacing.SpacingS}`,
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
    ({ label, size = BadgeSize.SMALL, status = 'default', className, style }, ref) => {
        return (
            <StyledBadge
                ref={ref}
                label={label}
                badgeSize={size}
                badgeStatus={status as StatusTypes}
                className={className}
                style={style}
            />
        );
    }
);

ApBadge.displayName = 'ApBadge';
