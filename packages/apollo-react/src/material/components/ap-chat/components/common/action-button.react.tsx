/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { ApButtonReact } from '../../../ap-button/ap-button.react';
import { ApIconButtonReact } from '../../../ap-icon-button/ap-icon-button.react';
import { ApTooltipReact } from '../../../ap-tooltip/ap-tooltip.react';

const StyledButtonContainer = styled('div')(() => ({
    '& .MuiButton-root': {
        background: 'transparent',
        color: 'var(--color-foreground)',
        fontFamily: token.FontFamily.FontLFamily,
        fontWeight: token.FontFamily.FontWeightDefault,
        fontSize: token.FontFamily.FontSSize,
        lineHeight: token.FontFamily.FontSLineHeight,
        fontStyle: 'normal',
        minWidth: '78px',

        '&:active': { backgroundColor: 'transparent !important' },
        '&:hover, &:focus': {
            color: 'var(--color-foreground-emp)',
            backgroundColor: 'var(--color-icon-button-hover) !important',
        },
    },
}));

interface AutopilotChatActionButtonProps {
    iconName: string;
    iconSize?: string;
    disabled?: boolean;
    preventHover?: boolean;
    overrideColor?: string;
    variant?: 'normal' | 'outlined' | 'custom';
    text?: string;
    tooltip?: string;
    ariaLabel?: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
}

const AutopilotChatActionButtonComponent = React.forwardRef<HTMLButtonElement, AutopilotChatActionButtonProps>(({
    iconName,
    disabled,
    iconSize,
    onClick,
    onFocus,
    onBlur,
    preventHover,
    overrideColor,
    variant = 'outlined',
    text,
    tooltip,
    ariaLabel,
}, ref) => {
    const [ iconColor, setIconColor ] = React.useState('var(--color-icon-default)');

    const button = text ? (
        <StyledButtonContainer>
            <ApButtonReact
                ref={ref}
                {...(!preventHover && {
                    onMouseEnter: () => setIconColor('var(--color-foreground-emp)'),
                    onMouseLeave: () => setIconColor('var(--color-icon-default)'),
                })}
                startIcon={
                    <ap-icon
                        variant={variant}
                        size={iconSize ? iconSize : token.Icon.IconM}
                        color={overrideColor ?? iconColor}
                        name={iconName}
                    />
                }
                aria-label={ariaLabel}
                variant="text"
                size="small"
                label={text}
                onClick={onClick}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </StyledButtonContainer>
    ) : (
        <ApIconButtonReact
            ref={ref}
            disabled={disabled}
            color="secondary"
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-label={ariaLabel}
            {...(!preventHover && {
                onMouseEnter: () => setIconColor('var(--color-foreground-emp)'),
                onMouseLeave: () => setIconColor('var(--color-icon-default)'),
            })}
        >
            <ap-icon
                variant={variant}
                size={iconSize ? iconSize : token.Icon.IconM}
                color={overrideColor ?? iconColor}
                name={iconName}
            />
        </ApIconButtonReact>
    );

    return tooltip ? (
        <ApTooltipReact disabled={disabled} content={tooltip}>
            {button}
        </ApTooltipReact>
    ) : button;
});

export const AutopilotChatActionButton = React.memo(AutopilotChatActionButtonComponent);
