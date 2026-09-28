import { cn, FormFieldError } from '@uipath/apollo-wind';
import { type ReactNode, useCallback, useId, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { CanvasTooltip } from '../CanvasTooltip';

export interface EditableTextProps {
  /** The text on screen, in both modes: this is a controlled field, so an edit shows up only once `onChange` has been applied here. */
  value: string;
  placeholder?: string;
  size?: 'sm' | 'lg';
  /**
   * Text layout. `true` accepts newlines (Shift+Enter); `'wrap'` wraps across lines but keeps the
   * value single-line, so every Enter commits and pasted newlines collapse. Enter always commits.
   */
  multiline?: boolean | 'wrap';
  /** Visible-line ceiling when `multiline`. The editor scrolls past it. Defaults to 3. */
  maxLines?: number;
  /** Fires on every keystroke with the text as typed, like any controlled input. Pair with `onSubmit`: both are required to make the text editable, and `value` has to follow this callback or the field won't accept input. Escape reports the text held when the editor opened, so the owner reverts through this same path. */
  onChange?: (next: string) => void;
  /** Fires on Enter or blur with the trimmed `value`, and only when it differs from the text the editor opened with, so a click in and straight back out is silent. The owner decides whether to persist it. */
  onSubmit?: (next: string) => void;
  /** Locks the text as-is: no edit mode, no commit. Ignored for static text. */
  disabled?: boolean;
  /** Field-specific feedback rendered immediately below the text. */
  error?: ReactNode;
  /** Names the editor and its click target. Unused for static text. */
  'aria-label'?: string;
  className?: string;
  'data-testid'?: string;
}

const stripNewlines = (text: string) => text.replace(/\n+/g, ' ');

const READ_CLASS = {
  lg: 'text-base font-semibold leading-5 tracking-[-0.3px] text-foreground',
  sm: 'text-xs leading-4 text-foreground-muted',
} as const;

const EDIT_CLASS = {
  lg: 'text-base font-semibold leading-5 tracking-[-0.3px]',
  sm: 'text-xs leading-4',
} as const;

/** Per-size line box, matching the `leading-*` above, so a line cap needs no measuring. */
const LINE_HEIGHT = { lg: 20, sm: 16 } as const;

/** Vertical padding of `INTERACTIVE_CLASS` (`py-0.5`), added to the editor's line cap. */
const VERTICAL_PADDING = 4;

/**
 * Multi-line truncation, the same `line-clamp` idiom the canvas node label uses, with the count
 * fed through a CSS variable so the class stays static. `wrap-break-word` is load-bearing: an
 * unbroken token would otherwise run past the box and be cut mid-glyph, since the clamp can only
 * ellipsize at a line boundary. `line-clamp` sets its own `display`, so no `block` alongside it.
 */
const CLAMP_CLASS = 'line-clamp-[var(--editable-text-lines)] whitespace-pre-line wrap-break-word';

/** Padding the ring needs to sit off the glyphs; the negative margin keeps text aligned across modes. */
const INTERACTIVE_CLASS = 'rounded px-1.5 py-0.5 -mx-1.5';

const ERROR_RING_CLASS = 'ring-1 ring-error';

/**
 * Click-to-edit text for the node identity row: enters on click, submits on Enter or blur, reverts
 * on Escape. Controlled — the owner holds the text and feeds it back through `value`, which lets it
 * validate what is being typed and render the message through `error`. Renders static text unless
 * both `onChange` and `onSubmit` are given.
 */
export function EditableText({
  value,
  placeholder,
  size = 'lg',
  multiline,
  maxLines = 3,
  onChange,
  onSubmit,
  disabled,
  error,
  'aria-label': ariaLabel,
  className,
  'data-testid': dataTestId,
}: EditableTextProps) {
  const allowNewlines = multiline === true;
  const editable = !!onChange && !!onSubmit;
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  // What Escape reverts to. Taken when the editor opens, since by then `value`
  // is the owner's live state and no longer remembers where the edit started.
  const openedWith = useRef(value);
  const errorId = `editable-text-${useId().replace(/:/g, '')}-error`;

  const hasError = !!error;
  // `aria-invalid` is only valid on the widget renders; a static span takes the
  // description alone (role=generic does not support the state).
  const describedBy = hasError ? errorId : undefined;

  useIsomorphicLayoutEffect(() => {
    // Going disabled mid-edit closes the editor (below) without submitting. The
    // text itself is the owner's, so re-enabling shows whatever it kept.
    if (disabled) return setIsEditing(false);
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing, disabled]);

  const commit = useCallback(() => {
    setIsEditing(false);
    const next = value.trim();
    if (next !== value) onChange?.(next);
    // Opening and closing without touching the text is not an edit: staying
    // silent keeps the owner from persisting a value it already has.
    if (next !== openedWith.current) onSubmit?.(next);
  }, [value, onChange, onSubmit]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    if (openedWith.current !== value) onChange?.(openedWith.current);
  }, [value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Only `multiline` (not `'wrap'`) lets Shift+Enter fall through to a newline;
      // every other Enter commits.
      if (e.key === 'Enter' && !(allowNewlines && e.shiftKey)) {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
      e.stopPropagation();
    },
    [commit, cancel, allowNewlines]
  );

  // Read mode caps the rendered lines through the clamp; edit mode grows with
  // content up to the same height, then scrolls.
  const editorMaxHeight = multiline
    ? { maxHeight: maxLines * LINE_HEIGHT[size] + VERTICAL_PADDING }
    : undefined;
  const readClampStyle = multiline
    ? ({ '--editable-text-lines': maxLines } as React.CSSProperties)
    : undefined;
  const readClampClass = multiline ? CLAMP_CLASS : 'block truncate';

  const message = (
    <FormFieldError id={errorId} data-slot="editable-text-error" className="-ml-1 mt-1">
      {error}
    </FormFieldError>
  );

  if (!editable) {
    return (
      <>
        <CanvasTooltip content={value || placeholder} smartTooltip delay>
          <span
            data-slot="editable-text"
            data-testid={dataTestId}
            aria-describedby={describedBy}
            style={readClampStyle}
            className={cn(
              readClampClass,
              READ_CLASS[size],
              !value && 'text-foreground-subtle',
              hasError && cn(INTERACTIVE_CLASS, ERROR_RING_CLASS),
              className
            )}
          >
            {value || placeholder}
          </span>
        </CanvasTooltip>
        {message}
      </>
    );
  }

  if (isEditing && !disabled) {
    const sharedProps = {
      'data-slot': 'editable-text-input',
      'data-testid': dataTestId ? `${dataTestId}-input` : undefined,
      value,
      placeholder,
      'aria-label': ariaLabel,
      'aria-describedby': describedBy,
      'aria-errormessage': hasError ? errorId : undefined,
      'aria-invalid': hasError || undefined,
      onKeyDown: handleKeyDown,
      onBlur: commit,
      className: cn(
        'nodrag nowheel w-full min-w-0 border-none bg-surface-overlay text-foreground outline-none ring-1',
        hasError ? 'ring-error' : 'ring-brand',
        INTERACTIVE_CLASS,
        EDIT_CLASS[size],
        className
      ),
    } as const;

    return (
      <>
        {multiline ? (
          <textarea
            {...sharedProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={1}
            style={editorMaxHeight}
            className={cn(
              sharedProps.className,
              'field-sizing-content max-w-full resize-none overflow-y-auto wrap-break-word'
            )}
            onChange={(e) =>
              onChange?.(allowNewlines ? e.target.value : stripNewlines(e.target.value))
            }
          />
        ) : (
          <input
            {...sharedProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            autoComplete="off"
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}
        {message}
      </>
    );
  }

  return (
    <>
      <CanvasTooltip content={value || placeholder} smartTooltip delay>
        <button
          type="button"
          data-slot="editable-text"
          data-testid={dataTestId}
          aria-label={ariaLabel && `${ariaLabel}: ${value || placeholder || ''}`}
          aria-describedby={describedBy}
          aria-errormessage={hasError ? errorId : undefined}
          aria-invalid={hasError || undefined}
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (disabled) return;
            openedWith.current = value;
            setIsEditing(true);
          }}
          style={readClampStyle}
          className={cn(
            'nodrag max-w-full cursor-text border-none bg-transparent text-left transition hover:bg-surface-overlay',
            'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent',
            readClampClass,
            INTERACTIVE_CLASS,
            READ_CLASS[size],
            !value && 'text-foreground-subtle',
            hasError && ERROR_RING_CLASS,
            className
          )}
        >
          {value || placeholder}
        </button>
      </CanvasTooltip>
      {message}
    </>
  );
}
