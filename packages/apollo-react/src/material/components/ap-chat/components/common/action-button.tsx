import { Button, styled, type TooltipProps } from '@mui/material';
import token from '@uipath/apollo-core';
import { ApIcon } from '@uipath/apollo-react/material/components';
import React from 'react';
import { useChatState } from '../../providers/chat-state-provider';
import { AutopilotChatMode } from '../../service';
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

interface AutopilotChatActionButtonProps {
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
  ariaPressed?: boolean;
  title?: string;
  tabIndex?: number;
  disableInteractiveTooltip?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
  'data-testid'?: string;
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
      ariaPressed,
      title,
      tabIndex,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onMouseDown,
      onMouseUp,
      onKeyDown,
      disableInteractiveTooltip = false,
      'data-testid': dataTestId,
    },
    ref
  ) => {
    const [iconColor, setIconColor] = React.useState('var(--color-icon-default)');
    const { chatMode } = useChatState();

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
            if (!preventHover) {
              setIconColor('var(--color-icon-default)');
            }
          }}
          startIcon={
            <ApIcon
              name={iconName}
              variant={variant}
              size={iconSize || token.Icon.IconS}
              color={overrideColor ?? iconColor}
            />
          }
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedby}
          aria-pressed={ariaPressed}
          title={showTooltip ? undefined : title}
          variant="text"
          size="small"
          disabled={disabled}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
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
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-pressed={ariaPressed}
        title={showTooltip ? undefined : title}
        onMouseEnter={(event: React.MouseEvent<HTMLButtonElement>) => {
          onMouseEnter?.(event);
          if (!preventHover) {
            setIconColor('var(--color-foreground-emp)');
          }
        }}
        onMouseLeave={(event: React.MouseEvent<HTMLButtonElement>) => {
          onMouseLeave?.(event);
          if (!preventHover) {
            setIconColor('var(--color-icon-default)');
          }
        }}
        data-testid={dataTestId}
        sx={variant === 'custom' ? { padding: '8px 6px 6px 8px' } : undefined}
      >
        <ApIcon
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
