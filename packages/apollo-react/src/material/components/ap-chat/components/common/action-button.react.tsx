/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    TooltipProps,
} from '@mui/material';
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

const StyledIconButton = styled(ApIconButtonReact)(() => ({ '&.MuiIconButton-root': { borderRadius: token.Border.BorderRadiusM } }));

/**
 * Either onClick or onPress and onRelease are required.
 */
type AutopilotChatActionButtonProps = AutopilotChatActionButtonBaseProps & (
    AutopilotChatActionButtonClickProps |
    AutopilotChatActionButtonPressProps
);

interface AutopilotChatActionButtonBaseProps {
    iconName: string;
    iconSize?: string;
    disabled?: boolean;
    preventHover?: boolean;
    overrideColor?: string;
    variant?: 'normal' | 'outlined' | 'custom';
    text?: string;
    tooltip?: React.ReactNode;
    tooltipPlacement?: TooltipProps['placement'];
    ariaLabel?: string;
    tabIndex?: number;
    disableInteractiveTooltip?: boolean;
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    'data-testid'?: string;
}

interface AutopilotChatActionButtonClickProps {
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface AutopilotChatActionButtonPressProps {
    onPress: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onRelease: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const AutopilotChatActionButtonComponent = React.forwardRef<HTMLButtonElement, AutopilotChatActionButtonProps>(({
    iconName,
    disabled,
    iconSize,
    preventHover,
    overrideColor,
    variant = 'outlined',
    text,
    tooltip,
    tooltipPlacement = 'bottom',
    ariaLabel,
    tabIndex,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onMouseDown,
    onMouseUp,
    onKeyDown,
    disableInteractiveTooltip = false,
    'data-testid': dataTestId,
    ...props
}, ref) => {
    const [ iconColor, setIconColor ] = React.useState('var(--color-icon-default)');
    const { chatMode } = useChatState();
    const [ isPressed, setIsPressed ] = React.useState(false);

    const onClick = 'onClick' in props ? props.onClick : () => {};
    const onPress = 'onPress' in props ? props.onPress : () => {};
    const onRelease = 'onRelease' in props ? props.onRelease : () => {};

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
                    if (isPressed) {
                        // Moving the mouse back over the button while still pressing does NOT retrigger onPress. The
                        // mouse must be released and re-pressed. This behavior is safer for the initial use of
                        // press/release behavior, which is for a "push to talk" button used to enable audio input.
                        setIsPressed(false);
                        onRelease(event as React.MouseEvent<HTMLButtonElement>);
                    }
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
                onMouseDown={(event) => {
                    onMouseDown?.(event as React.MouseEvent<HTMLButtonElement>);
                    setIsPressed(true);
                    onPress(event as React.MouseEvent<HTMLButtonElement>);
                }}
                onMouseUp={(event) => {
                    onMouseUp?.(event as React.MouseEvent<HTMLButtonElement>);
                    setIsPressed(false);
                    onRelease(event as React.MouseEvent<HTMLButtonElement>);
                }}
                tabIndex={tabIndex}
                onKeyDown={onKeyDown}
                data-testid={dataTestId}
            />
        </StyledButtonContainer>
    ) : (
        <StyledIconButton
            ref={ref}
            disabled={disabled}
            color="secondary"
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            onMouseDown={(event) => {
                onMouseDown?.(event as React.MouseEvent<HTMLButtonElement>);
                setIsPressed(true);
                onPress(event as React.MouseEvent<HTMLButtonElement>);
            }}
            onMouseUp={(event) => {
                onMouseUp?.(event as React.MouseEvent<HTMLButtonElement>);
                setIsPressed(false);
                onRelease(event as React.MouseEvent<HTMLButtonElement>);
            }}
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
                if (isPressed) {
                    // See note above about re-enter behavior.
                    setIsPressed(false);
                    onRelease(event as React.MouseEvent<HTMLButtonElement>);
                }
                if (!preventHover) {
                    setIconColor('var(--color-icon-default)');
                }
            }}
            data-testid={dataTestId}
        >
            <ap-icon
                variant={variant}
                size={iconSize ? iconSize : token.Icon.IconXs}
                color={overrideColor ?? iconColor}
                name={iconName}
                customvariantdisplay="flex"
            />
        </StyledIconButton>
    );

    return tooltip && chatMode !== AutopilotChatMode.Closed && !disabled ? (
        <AutopilotChatTooltip
            title={tooltip}
            placement={tooltipPlacement}
            disableInteractive={disableInteractiveTooltip}
        >
            {button}
        </AutopilotChatTooltip>
    ) : button;
});

export const AutopilotChatActionButton = React.memo(AutopilotChatActionButtonComponent);
