import * as React from 'react';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueModeStrings,
} from '@/components/ui/field-addons/value-mode-strings';
import { Textarea } from '@/components/ui/textarea';
import { composeRefs } from '@/lib';

export interface PromptValueControlProps {
  id?: string;
  name?: string;
  /** The prompt, in plain text. */
  value?: string;
  onChange: (prompt: string) => void;
  onBlur?: () => void;
  /** Also gets the textarea, as a form library's field ref does to focus an invalid field. */
  inputRef?: React.Ref<HTMLTextAreaElement>;
  disabled?: boolean;
  /** Shown while the prompt is empty. Defaults to `strings.promptPlaceholder`. */
  placeholder?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ValueModeStrings>;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * A prompt an agent fills the value from: a textarea that starts one line tall and grows to six.
 * Render it in an `InputGroup` with `variant="agent"` and `layout="grow"`, whose box marks the value
 * as a prompt. Props are picked, not spread: as a registered value-mode control it is handed every
 * `ValueModeControlProps` member.
 */
const PromptValueControl = React.forwardRef<HTMLTextAreaElement, PromptValueControlProps>(
  (
    {
      id,
      name,
      value,
      onChange,
      onBlur,
      inputRef,
      disabled,
      placeholder,
      strings,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const text = { ...DEFAULT_VALUE_MODE_STRINGS, ...strings };
    const setRef = React.useMemo(() => composeRefs(ref, inputRef), [ref, inputRef]);
    return (
      <Textarea
        ref={setRef}
        id={id}
        name={name}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder ?? text.promptPlaceholder}
        className={className}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // Set `rows` too: auto-grow measures from the natural height, which defaults to two rows.
        rows={1}
        minRows={1}
        maxRows={6}
      />
    );
  }
);
PromptValueControl.displayName = 'PromptValueControl';

export { PromptValueControl };
