import React from 'react';

import { Button, styled, TooltipProps } from '@mui/material';
import token from '@uipath/apollo-core';

import { useChatState } from '../../providers/chat-state-provider';
import { AutopilotChatMode } from '../../service';
import { AutopilotChatIcon } from './icon';
import { AutopilotChatIconButton } from './icon-button';
import { AutopilotChatTooltip } from './tooltip';

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

/**
 * Either onClick or onPress and onRelease are required.
 */
type AutopilotChatActionButtonProps = AutopilotChatActionButtonBaseProps &
  (AutopilotChatActionButtonClickProps | AutopilotChatActionButtonPressProps);

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
  ariaDescribedby?: string;
  title?: string;
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

const AutopilotChatActionButtonComponent = React.forwardRef<
  HTMLButtonElement,
  AutopilotChatActionButtonProps
>(
  (
    {
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
      ariaDescribedby,
      title,
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
    },
    ref
  ) => {
    const [iconColor, setIconColor] = React.useState('var(--color-icon-default)');
    const { chatMode } = useChatState();
    const [isPressed, setIsPressed] = React.useState(false);

    const onClick = 'onClick' in props ? props.onClick : () => {};
    const onPress = 'onPress' in props ? props.onPress : () => {};
    const onRelease = 'onRelease' in props ? props.onRelease : () => {};

    // Determine if we should show tooltip
    const showTooltip = tooltip && chatMode !== AutopilotChatMode.Closed && !disabled;

    const button = text ? (
      <StyledButtonContainer>
        <Button
          ref={ref}
          onMouseEnter={(event: React.MouseEvent<HTMLButtonElement>) => {
            onMouseEnter?.(event);
            if (!preventHover) {
              setIconColor('var(--color-foreground-emp)');
            }
          }}
          onMouseLeave={(event: React.MouseEvent<HTMLButtonElement>) => {
            onMouseLeave?.(event);
            if (isPressed) {
              // Moving the mouse back over the button while still pressing does NOT retrigger onPress. The
              // mouse must be released and re-pressed. This behavior is safer for the initial use of
              // press/release behavior, which is for a "push to talk" button used to enable audio input.
              setIsPressed(false);
              onRelease(event);
            }
            if (!preventHover) {
              setIconColor('var(--color-icon-default)');
            }
          }}
          startIcon={
            <AutopilotChatIcon
              name={iconName}
              variant={variant}
              size={iconSize || token.Icon.IconS}
              color={overrideColor ?? iconColor}
            />
          }
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedby}
          title={showTooltip ? undefined : title}
          variant="text"
          size="small"
          disabled={disabled}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
            onMouseDown?.(event);
            setIsPressed(true);
            onPress(event);
          }}
          onMouseUp={(event: React.MouseEvent<HTMLButtonElement>) => {
            onMouseUp?.(event);
            setIsPressed(false);
            onRelease(event);
          }}
          tabIndex={tabIndex}
          onKeyDown={onKeyDown}
          data-testid={dataTestId}
        >
          {text}
        </Button>
      </StyledButtonContainer>
    ) : (
      <AutopilotChatIconButton
        ref={ref}
        disabled={disabled}
        color="secondary"
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
          onMouseDown?.(event);
          setIsPressed(true);
          onPress(event as React.MouseEvent<HTMLButtonElement>);
        }}
        onMouseUp={(event: React.MouseEvent<HTMLButtonElement>) => {
          onMouseUp?.(event);
          setIsPressed(false);
          onRelease(event);
        }}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        title={showTooltip ? undefined : title}
        onMouseEnter={(event: React.MouseEvent<HTMLButtonElement>) => {
          onMouseEnter?.(event);
          if (!preventHover) {
            setIconColor('var(--color-foreground-emp)');
          }
        }}
        onMouseLeave={(event: React.MouseEvent<HTMLButtonElement>) => {
          onMouseLeave?.(event);
          if (isPressed) {
            // See note above about re-enter behavior.
            setIsPressed(false);
            onRelease(event);
          }
          if (!preventHover) {
            setIconColor('var(--color-icon-default)');
          }
        }}
        data-testid={dataTestId}
        sx={variant === 'custom' ? { padding: '8px 6px 6px 8px' } : undefined}
      >
        <AutopilotChatIcon
          name={iconName}
          variant={variant}
          size={iconSize || (variant === 'custom' ? '20px' : token.Icon.IconS)}
          color={overrideColor ?? iconColor}
        />
      </AutopilotChatIconButton>
    );

    return showTooltip ? (
      <AutopilotChatTooltip
        title={tooltip}
        placement={tooltipPlacement}
        disableInteractive={disableInteractiveTooltip}
      >
        {button}
      </AutopilotChatTooltip>
    ) : (
      button
    );
  }
);

export const AutopilotChatActionButton = React.memo(AutopilotChatActionButtonComponent);
