/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatMode } from '@uipath/portal-shell-util';
import React from 'react';

import { ApButtonReact } from '../../../ap-button/ap-button.react';
import { ApIconButtonReact } from '../../../ap-icon-button/ap-icon-button.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { AutopilotChatTooltip } from './tooltip.react';

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
    tabIndex?: number;
    disableInteractiveTooltip?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
}

const AutopilotChatActionButtonComponent = React.forwardRef<HTMLButtonElement, AutopilotChatActionButtonProps>(({
    iconName,
    disabled,
    iconSize,
    onClick,
    onFocus,
    onBlur,
    onMouseDown,
    onKeyDown,
    preventHover,
    overrideColor,
    variant = 'outlined',
    text,
    tooltip,
    ariaLabel,
    tabIndex,
    onMouseEnter,
    onMouseLeave,
    disableInteractiveTooltip = false,
}, ref) => {
    const [ iconColor, setIconColor ] = React.useState('var(--color-icon-default)');
    const { chatMode } = useChatState();

    const button = text ? (
        <StyledButtonContainer>
            <ApButtonReact
                ref={ref}
                onMouseEnter={(event) => {
                    onMouseEnter?.(event as React.MouseEvent<HTMLElement>);
                    if (!preventHover) {
                        setIconColor('var(--color-foreground-emp)');
                    }
                }}
                onMouseLeave={(event) => {
                    onMouseLeave?.(event as React.MouseEvent<HTMLElement>);
                    if (!preventHover) {
                        setIconColor('var(--color-icon-default)');
                    }
                }}
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
                onMouseDown={onMouseDown}
                tabIndex={tabIndex}
                onKeyDown={onKeyDown}
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
            onMouseDown={onMouseDown}
            tabIndex={tabIndex}
            onKeyDown={onKeyDown}
            aria-label={ariaLabel}
            onMouseEnter={(event) => {
                onMouseEnter?.(event);
                if (!preventHover) {
                    setIconColor('var(--color-foreground-emp)');
                }
            }}
            onMouseLeave={(event) => {
                onMouseLeave?.(event);
                if (!preventHover) {
                    setIconColor('var(--color-icon-default)');
                }
            }}
        >
            <ap-icon
                variant={variant}
                size={iconSize ? iconSize : token.Icon.IconM}
                color={overrideColor ?? iconColor}
                name={iconName}
            />
        </ApIconButtonReact>
    );

    return tooltip && chatMode !== AutopilotChatMode.Closed && !disabled ? (
        <AutopilotChatTooltip
            title={tooltip}
            disableInteractive={disableInteractiveTooltip}
        >
            {button}
        </AutopilotChatTooltip>
    ) : button;
});

export const AutopilotChatActionButton = React.memo(AutopilotChatActionButtonComponent);
