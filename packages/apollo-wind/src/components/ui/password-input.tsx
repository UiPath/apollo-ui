import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { Input, type InputProps } from './input';
import { InputGroup, InputGroupAddon, InputGroupButton } from './input-group';
import { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from './tooltip';

/** `className` styles the field box, not the inner `<input>`. */
export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** Translated toggle label and tooltip while hidden. Use a different label for each field on the page. */
  showLabel?: string;
  /** Translated toggle label and tooltip while shown. */
  hideLabel?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      variant,
      size,
      disabled,
      errorId,
      visible: visibleProp,
      defaultVisible = false,
      onVisibleChange,
      showLabel = 'Show password',
      hideLabel = 'Hide password',
      ...props
    },
    ref
  ) => {
    const [visibleState, setVisibleState] = React.useState(defaultVisible);
    const visible = visibleProp ?? visibleState;
    const label = visible ? hideLabel : showLabel;
    const toggle = () => {
      setVisibleState(!visible);
      onVisibleChange?.(!visible);
    };

    return (
      <InputGroup
        className={className}
        variant={variant}
        size={size}
        disabled={disabled}
        errorId={errorId}
      >
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  icon
                  size={size === 'xs' ? '4xs' : '3xs'}
                  aria-label={label}
                  aria-pressed={visible}
                  aria-controls={props.id}
                  onClick={toggle}
                >
                  {visible ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>{label}</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </TooltipProvider>
        </InputGroupAddon>
      </InputGroup>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
