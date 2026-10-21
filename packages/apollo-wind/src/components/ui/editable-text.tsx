import * as React from 'react';
import { FormFieldError } from '@/components/ui/form-field';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** `label` matches a field label; `sm` and `lg` a secondary line and a title. */
export type EditableTextSize = 'label' | 'sm' | 'lg';

export interface EditableTextProps {
  /** The text on screen, in both modes: this is a controlled field, so an edit shows up only once `onChange` has been applied here. */
  value: string;
  placeholder?: string;
  /** Defaults to `lg`. */
  size?: EditableTextSize;
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
  /**
   * Whether the editor is open, for an owner that holds that state: it opens focused with the text
   * selected, and asks to close through `onEditingChange`. Omit to let the component hold it.
   */
  editing?: boolean;
  /**
   * Called when the editor asks to open (a click) or close (commit, Escape, or going disabled).
   * Required alongside `editing` for the editor to open or close at all.
   */
  onEditingChange?: (editing: boolean) => void;
  /** Locks the text as-is: no edit mode, no commit. Ignored for static text. */
  disabled?: boolean;
  /** Field-specific feedback rendered immediately below the text. */
  error?: React.ReactNode;
  /** Show the full text in a tooltip on hover when it is cut off. On by default. */
  truncationTooltip?: boolean;
  /** Names the editor and its click target. Unused for static text. */
  'aria-label'?: string;
  className?: string;
  'data-testid'?: string;
}

const stripNewlines = (text: string) => text.replace(/\n+/g, ' ');

const READ_CLASS = {
  label: 'text-xs font-medium leading-4 text-foreground',
  lg: 'text-base font-semibold leading-5 tracking-[-0.3px] text-foreground',
  sm: 'text-xs leading-4 text-foreground-muted',
} as const;

const EDIT_CLASS = {
  label: 'text-xs font-medium leading-4',
  lg: 'text-base font-semibold leading-5 tracking-[-0.3px]',
  sm: 'text-xs leading-4',
} as const;

/** Per-size line box, matching the `leading-*` above, so a line cap needs no measuring. */
const LINE_HEIGHT = { label: 16, lg: 20, sm: 16 } as const;

/** Vertical padding of `INTERACTIVE_CLASS` (`py-0.5`), added to the editor's line cap. */
const VERTICAL_PADDING = 4;

/**
 * Multi-line truncation, with the count fed through a CSS variable so the class stays static.
 * `wrap-break-word` is load-bearing: an unbroken token would otherwise run past the box and be cut
 * mid-glyph, since the clamp can only ellipsize at a line boundary. `line-clamp` sets its own
 * `display`, so no `block` alongside it.
 */
const CLAMP_CLASS = 'line-clamp-[var(--editable-text-lines)] whitespace-pre-line wrap-break-word';

/** Padding the ring needs to sit off the glyphs; the negative margin keeps text aligned across modes. */
const INTERACTIVE_CLASS = 'rounded px-1.5 py-0.5 -mx-1.5';

/**
 * The editor keeps only the leading negative margin: its filled box takes its full width in a row,
 * so whatever follows, such as a required asterisk, sits after the box rather than over it.
 */
const EDITOR_SPACING_CLASS = 'rounded px-1.5 py-0.5 -ml-1.5';

/**
 * The read trigger hangs out by its negative margins, so its cap is the container plus them. A
 * plain `max-w-full` would take its padding out of the text whenever the container is sized to the
 * text, as a flex row is, and truncate text that fits.
 */
const READ_MAX_WIDTH_CLASS = 'max-w-[calc(100%+--spacing(3))]';

const ERROR_RING_CLASS = 'ring-1 ring-error';

/**
 * The full text on hover, only while the trigger cuts it off: by width when it truncates, or by
 * height when it clamps lines. Measured on every open, so a resize needs no observer. Radix exposes
 * no way to detect a provider above, so each one brings its own (a context, no DOM).
 */
function TruncationTooltip({
  content,
  multiline,
  children,
}: {
  content: React.ReactNode;
  multiline: boolean;
  children: React.ReactElement;
}) {
  const triggerRef = React.useRef<HTMLElement | null>(null);
  // A callback, since the trigger is a button or, for static text, a span.
  const setTrigger = React.useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipProvider delayDuration={700}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          const node = triggerRef.current;
          setOpen(
            next &&
              !!node &&
              (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight)
          );
        }}
      >
        <TooltipTrigger asChild ref={setTrigger}>
          {children}
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            className={cn('max-w-80 wrap-break-word', multiline && 'whitespace-pre-line')}
          >
            {content}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Click-to-edit text, such as a name or title: enters on click, submits on Enter or blur, reverts
 * on Escape. Controlled: the owner holds the text and feeds it back through `value`, which lets it
 * validate what is being typed and render the message through `error`. Renders static text unless
 * both `onChange` and `onSubmit` are given. Text that is cut off shows in full in a tooltip.
 */
export function EditableText({
  value,
  placeholder,
  size = 'lg',
  multiline,
  maxLines = 3,
  onChange,
  onSubmit,
  editing: editingProp,
  onEditingChange,
  disabled,
  truncationTooltip = true,
  error,
  'aria-label': ariaLabel,
  className,
  'data-testid': dataTestId,
}: EditableTextProps) {
  const allowNewlines = multiline === true;
  const editable = !!onChange && !!onSubmit;
  const [editingState, setEditingState] = React.useState(false);
  const controlled = editingProp !== undefined;
  const requested = controlled ? editingProp : editingState;
  const isEditing = requested && editable && !disabled;
  const setEditing = React.useCallback(
    (next: boolean) => {
      if (!controlled) setEditingState(next);
      onEditingChange?.(next);
    },
    [controlled, onEditingChange]
  );
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  // What Escape reverts to. Taken when the editor opens, since by then `value`
  // is the owner's live state and no longer remembers where the edit started.
  const openedWith = React.useRef(value);
  const latestValue = React.useRef(value);
  latestValue.current = value;
  const errorId = `editable-text-${React.useId().replace(/:/g, '')}-error`;

  const hasError = !!error;
  // `aria-invalid` is only valid on the widget renders; a static span takes the
  // description alone (role=generic does not support the state).
  const describedBy = hasError ? errorId : undefined;

  // Going disabled mid-edit closes the editor without submitting, and says so, so it does not
  // reopen when re-enabled. The text itself is the owner's, so it keeps whatever it held.
  useIsomorphicLayoutEffect(() => {
    if (disabled && requested) setEditing(false);
  }, [disabled, requested, setEditing]);

  // However the editor opened (a click, or the owner), it opens on the text shown now.
  useIsomorphicLayoutEffect(() => {
    if (!isEditing) return;
    openedWith.current = latestValue.current;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const cancel = React.useCallback(() => {
    setEditing(false);
    if (openedWith.current !== value) onChange?.(openedWith.current);
  }, [value, onChange, setEditing]);

  const commit = React.useCallback(() => {
    const next = value.trim();
    setEditing(false);
    if (next !== value) onChange?.(next);
    // Opening and closing without touching the text is not an edit: staying
    // silent keeps the owner from persisting a value it already has.
    if (next !== openedWith.current) onSubmit?.(next);
  }, [value, onChange, onSubmit, setEditing]);

  const handleKeyDown = React.useCallback(
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
  const withTooltip = (trigger: React.ReactElement) =>
    truncationTooltip && (value || placeholder) ? (
      <TruncationTooltip content={value || placeholder} multiline={!!multiline}>
        {trigger}
      </TruncationTooltip>
    ) : (
      trigger
    );

  const message = (
    <FormFieldError id={errorId} data-slot="editable-text-error" className="-ml-1 mt-1">
      {error}
    </FormFieldError>
  );

  if (!editable) {
    return (
      <>
        {withTooltip(
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
        )}
        {message}
      </>
    );
  }

  if (isEditing) {
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
        'w-full min-w-0 border-none bg-surface-overlay text-foreground outline-none ring-1',
        hasError ? 'ring-error' : 'ring-brand',
        EDITOR_SPACING_CLASS,
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
      {withTooltip(
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
            setEditing(true);
          }}
          style={readClampStyle}
          className={cn(
            'cursor-text border-none bg-transparent text-left transition hover:bg-surface-overlay',
            READ_MAX_WIDTH_CLASS,
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
      )}
      {message}
    </>
  );
}
