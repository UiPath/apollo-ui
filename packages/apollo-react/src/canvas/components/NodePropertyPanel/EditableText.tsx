import { cn, FormFieldError } from '@uipath/apollo-wind';
import { type ReactNode, useCallback, useId, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { CanvasTooltip } from '../CanvasTooltip';

export interface EditableTextProps {
  value: string;
  placeholder?: string;
  size?: 'sm' | 'lg';
  /** Accept newlines (Shift+Enter). Enter still commits. */
  multiline?: boolean;
  /** Visible-line ceiling when `multiline`. The editor scrolls past it. Defaults to 3. */
  maxLines?: number;
  onChange?: (next: string) => void;
  /** Field-specific feedback rendered immediately below the text. */
  error?: ReactNode;
  /** Names the editor and its click target. Unused for static text (no `onChange`). */
  'aria-label'?: string;
  className?: string;
  'data-testid'?: string;
}

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

/** Click-to-edit text for the node identity row: enters on click, commits on Enter or blur, reverts on Escape. Static text without `onChange`. */
export function EditableText({
  value,
  placeholder,
  size = 'lg',
  multiline,
  maxLines = 3,
  onChange,
  error,
  'aria-label': ariaLabel,
  className,
  'data-testid': dataTestId,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const errorId = `editable-text-${useId().replace(/:/g, '')}-error`;

  const hasError = !!error;
  // `aria-invalid` is only valid on the widget renders; a static span takes the
  // description alone (role=generic does not support the state).
  const describedBy = hasError ? errorId : undefined;

  useIsomorphicLayoutEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const commit = useCallback(() => {
    setIsEditing(false);
    const next = draft.trim();
    if (next !== value) onChange?.(next);
  }, [draft, value, onChange]);

  const cancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Shift+Enter falls through to insert a newline; every other Enter commits.
      if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
      e.stopPropagation();
    },
    [commit, cancel, multiline]
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

  if (!onChange) {
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

  if (isEditing) {
    const sharedProps = {
      'data-slot': 'editable-text-input',
      'data-testid': dataTestId ? `${dataTestId}-input` : undefined,
      value: draft,
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
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <input
            {...sharedProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
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
          onClick={() => {
            setDraft(value);
            setIsEditing(true);
          }}
          style={readClampStyle}
          className={cn(
            'nodrag max-w-full cursor-text border-none bg-transparent text-left transition hover:bg-surface-overlay',
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
