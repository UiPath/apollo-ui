import React from 'react';
import { Chip, CircularProgress, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import token from '@uipath/apollo-core';

import type { ApChipProps } from './ApChip.types';

const StyledChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'error' && prop !== 'loading',
})<ApChipProps>(({ error }) => ({
    backgroundColor: 'var(--color-background-gray)',
    borderRadius: '1000px', // Large number for circular pill shape
    boxSizing: 'border-box',
    color: 'var(--color-foreground)',
    fontWeight: token.FontFamily.FontWeightDefault,
    gap: token.Spacing.SpacingXs,
    height: token.Spacing.SpacingXl,
    outline: 'none',
    paddingLeft: token.Spacing.SpacingS,
    paddingRight: token.Spacing.SpacingS,
    cursor: 'default',

    '.MuiChip-label': {
        padding: 0,
    },
    '.MuiChip-deleteIcon': {
        margin: 0,
        color: 'inherit',
        '&:hover': {
            color: 'inherit',
        },
    },

    ':hover': {
        backgroundColor: 'var(--color-background-hover)',
    },

    ':focus-visible:not(.Mui-disabled)': {
        backgroundColor: 'var(--color-background-gray)',
        outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
        outlineOffset: token.Spacing.SpacingMicro,
    },

    '&.Mui-disabled': {
        outline: 'none !important',
        backgroundColor: 'var(--color-background-disabled)',
        color: 'var(--color-foreground-light)',
        opacity: 1,
    },

    ...(error && {
        backgroundColor: 'var(--color-error-background) !important',
        color: 'var(--color-foreground) !important',
        fontWeight: token.FontFamily.FontWeightDefault,

        ':after': {
            content: '""',
            borderRadius: 'inherit',
            position: 'absolute',
            inset: '0px',
            boxSizing: 'border-box',
            border: `${token.Border.BorderThickS} solid var(--color-error-text)`,
            pointerEvents: 'none',
        },
    }),
}));

const LoadingSpinner = styled(CircularProgress)({
    width: `${token.Spacing.SpacingM} !important`,
    height: `${token.Spacing.SpacingM} !important`,
    color: 'inherit',
});

/**
 * ApChip - Compact chip component with Apollo design system styling
 * Supports loading states, error styling, and tooltips
 */
export const ApChip = React.forwardRef<HTMLDivElement, ApChipProps>(
    (
        {
            loading,
            disabled,
            tooltip,
            debugForceOpen = false,
            error,
            label,
            onDelete,
            ...restProps
        },
        ref
    ) => {
        const shouldDisable = disabled || loading;

        const deleteIcon = loading ? (
            <LoadingSpinner />
        ) : onDelete ? (
            <CloseIcon fontSize="small" />
        ) : undefined;

        const chip = (
            <StyledChip
                ref={ref}
                label={label}
                deleteIcon={deleteIcon}
                onDelete={onDelete}
                disabled={shouldDisable}
                error={error}
                loading={loading}
                {...(shouldDisable && { tabIndex: -1 })}
                {...restProps}
            />
        );

        if (tooltip && tooltip.length > 0) {
            return (
                <Tooltip
                    title={tooltip}
                    placement="top"
                    open={debugForceOpen ? true : undefined}
                    arrow
                >
                    <span>{chip}</span>
                </Tooltip>
            );
        }

        return chip;
    }
);

ApChip.displayName = 'ApChip';
