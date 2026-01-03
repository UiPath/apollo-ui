import { CircularProgress } from '@mui/material';
import Button, { type ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import React from 'react';

import type { ApButtonProps, ButtonVariants } from './ApButton.types';

const variantToProps: Record<ButtonVariants, Partial<ButtonProps>> = {
  primary: { variant: 'contained' },
  secondary: {
    variant: 'outlined',
    sx: { background: 'transparent' },
  },

  destructive: { className: 'warning' },
  tertiary: {},
  text: {
    variant: 'text',
    sx: { background: 'transparent' },
  },
  'text-foreground': {
    variant: 'text',
    sx: {
      color: 'var(--color-foreground)',
      '&&:hover': { backgroundColor: 'var(--color-background-hover)' },
      '&&:focus': { backgroundColor: 'var(--color-background-hover)' },
      '&&:focus-visible': { backgroundColor: 'var(--color-background-hover)' },
      '&&:active': { backgroundColor: 'var(--color-background-pressed)' },
    },
  },
};

function joinClasses(...classes: Array<string | boolean | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const LoadingMouseInteractionBlocker = styled('div')({
  position: 'absolute',
  inset: 0,
  cursor: 'not-allowed',
});

const LabelLoadingIndicatorContainer = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const ApButton = React.forwardRef<HTMLButtonElement, ApButtonProps>((props, ref) => {
  const {
    startIcon,
    endIcon,
    id,
    variant = 'primary',
    size = 'tall',
    widthMode = 'default',
    label,
    customContent,
    type = 'button',
    disabled = false,
    loading = false,
    onClick,
    href,
    tabIndex,
    expanded,
    title,
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    onFocus,
    onBlur,
    onKeyDown,
  } = props;

  const hasStartIcon = !!startIcon;
  const hasEndIcon = !!endIcon;
  const shouldShowLoadingAsStartIcon = loading && hasStartIcon;
  const shouldShowLoadingAsEndIcon = loading && !hasStartIcon && hasEndIcon;
  const shouldShowLoadingAsLabel = loading && !hasStartIcon && !hasEndIcon;
  const variantProps = variantToProps[variant];

  const loadingIndicator = loading ? <ButtonLoadingIndicator aria-label={label} /> : null;

  return (
    <div style={{ position: 'relative' }}>
      <StyledButton
        ref={ref}
        type={type}
        id={id}
        color="secondary"
        {...(disabled ? { disabled: true } : {})}
        disableElevation={true}
        onClick={!loading ? onClick : undefined}
        onKeyDown={onKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onFocus={onFocus}
        onBlur={onBlur}
        startIcon={loading && shouldShowLoadingAsStartIcon ? loadingIndicator : startIcon}
        endIcon={loading && shouldShowLoadingAsEndIcon ? loadingIndicator : endIcon}
        {...variantProps}
        tabIndex={tabIndex ?? (loading ? -1 : undefined)}
        aria-disabled={disabled || loading ? 'true' : undefined}
        aria-expanded={expanded}
        title={title}
        className={joinClasses(variantProps?.className, loading && 'loading')}
        href={href}
        customSize={size}
        customWidth={widthMode}
      >
        <span
          style={{
            opacity: shouldShowLoadingAsLabel ? 0 : 1,
          }}
        >
          {customContent ?? label}
        </span>

        {shouldShowLoadingAsLabel && (
          <LabelLoadingIndicatorContainer>{loadingIndicator}</LabelLoadingIndicatorContainer>
        )}
      </StyledButton>
      {loading && <LoadingMouseInteractionBlocker />}
    </div>
  );
});

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'customSize' && prop !== 'customWidth',
})<
  ButtonProps & {
    customSize: string;
    customWidth: string;
  }
>(({ customSize, customWidth }) => ({
  '--border-radius': `3px`,
  '--focus-border-offset': `1px`,
  '--focus-border-width': `2px`,
  // Automatically calculate the outer focus border radius and position
  '--focus-border-radius': `calc( var(--border-radius) + var(--focus-border-offset) + var(--focus-border-width) )`,
  '--focus-border-inset': `calc( -1 * (var(--focus-border-offset) + var(--focus-border-width) + 1px))`,

  position: 'relative',
  borderRadius: 'var(--border-radius)',
  minWidth: customWidth === 'fit-content' ? undefined : '120px',
  height: customSize === 'tall' ? '40px' : '32px',

  '&.loading': { pointerEvents: 'none' },

  ':before': {
    content: `''`,
    boxSizing: 'border-box',
    position: 'absolute',
    inset: `var(--focus-border-inset)`,
    border: `var(--focus-border-width) solid var(--color-focus-indicator)`,
    borderRadius: 'var(--focus-border-radius)',
    pointerEvents: 'none',
    display: 'none',
  },

  ':focus-visible': {
    outline: 'none',

    ':before': { display: 'block' },
  },
}));

const StyledCircularProgress = styled(CircularProgress)({
  color: 'inherit !important',
  stroke: 'currentColor !important',
});

function ButtonLoadingIndicator(props: Readonly<React.ComponentProps<typeof CircularProgress>>) {
  return <StyledCircularProgress size={16} {...props} className={props.className} />;
}

ApButton.displayName = 'ApButton';
