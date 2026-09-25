import * as React from 'react';

import { cn } from '@/lib/index';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';

// Inside an InputGroup the group draws the box. Pads only the difference between the group's own
// padding and a standalone Textarea's inset (8px), so the first line sits where a standalone
// Textarea's does. The full `py-2` stacked on the group's pushed it 4px lower, and the future
// theme's group pads 8px itself.
const IN_GROUP_CLASS =
  'min-h-0 flex-1 resize-none rounded-none !border-0 !ring-0 bg-transparent p-0 py-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 future:rounded-none future:border-0 future:bg-transparent future:py-0 future:focus-visible:ring-offset-0';

export type TextareaProps = React.ComponentProps<'textarea'> & {
  /**
   * Minimum number of visible rows.
   */
  minRows?: number;
  /**
   * Enables auto-grow and sets the ceiling, in rows. The field grows with its content
   * up to `maxRows`, then scrolls.
   */
  maxRows?: number;
  /**
   * Field-specific feedback rendered immediately below the textarea.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
};

/** Coerce a row count to a positive integer, or `undefined` when unusable. */
function normalizeRows(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(1, Math.floor(value));
}

interface RowMetrics {
  lineHeight: number;
  padding: number;
  border: number;
  borderBox: boolean;
}

/** Reads the per-row line height and vertical padding/border of a textarea. */
function measureRowMetrics(el: HTMLTextAreaElement): RowMetrics {
  const styles = window.getComputedStyle(el);
  const lineHeight = parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.2 || 20;
  const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) || 0;
  const border = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth) || 0;
  return {
    lineHeight,
    padding,
    border,
    borderBox: styles.boxSizing === 'border-box',
  };
}

/** Serialize a React style value to a CSS string (numbers become px), or '' when unset. */
function cssLength(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'number' ? `${value}px` : String(value);
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-invalid': ariaInvalid,
      className,
      error,
      errorId,
      id,
      minRows,
      maxRows,
      onChange,
      style,
      ...props
    },
    ref
  ) => {
    const group = useInputGroup();
    const generatedId = React.useId();
    const validationId = errorId ?? `${id ?? `textarea-${generatedId.replace(/:/g, '')}`}-error`;
    const validation = useControlValidation(group, {
      error,
      errorId: validationId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });
    // Normalize + guard inverted bounds: a floor taller than the ceiling would trip the
    // manual-resize detector and permanently disable auto-sizing (min never exceeds max).
    const { effMinRows, effMaxRows } = React.useMemo(() => {
      const nMin = normalizeRows(minRows);
      const nMax = normalizeRows(maxRows);
      return {
        effMinRows: nMin !== undefined && nMax !== undefined ? Math.min(nMin, nMax) : nMin,
        effMaxRows: nMax,
      };
    }, [minRows, maxRows]);

    const managed = effMinRows !== undefined || effMaxRows !== undefined;

    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const manuallyResized = React.useRef(false);
    // Keep the latest consumer style available to imperative code without re-subscribing.
    const styleRef = React.useRef(style);
    styleRef.current = style;

    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    // Restore the inline styles auto-grow owns to the consumer's declared values (or clear
    // ours). React doesn't track these because we set them imperatively, so switching modes
    // would otherwise leave stale height/overflow behind.
    const restoreOwnedStyles = React.useCallback((el: HTMLTextAreaElement) => {
      const consumer = styleRef.current;
      el.style.height = cssLength(consumer?.height);
      el.style.minHeight = cssLength(consumer?.minHeight);
      el.style.overflowY = cssLength(consumer?.overflowY);
    }, []);

    // Apply the `minRows` floor and, when `maxRows` is set, fit the height to the content up
    // to the ceiling (scrolling past it). `scrollHeight` excludes the border, so add it back
    // in border-box mode; content-box keeps the content-only calculation.
    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el || !managed) return;

      const { lineHeight, padding, border, borderBox } = measureRowMetrics(el);
      const extra = borderBox ? padding + border : 0;
      const minHeight = effMinRows !== undefined ? effMinRows * lineHeight + extra : 0;

      el.style.minHeight =
        effMinRows !== undefined ? `${minHeight}px` : cssLength(styleRef.current?.minHeight);

      if (effMaxRows === undefined || manuallyResized.current) return;

      const maxHeight = effMaxRows * lineHeight + extra;
      el.style.height = 'auto';
      const contentNeeded = borderBox
        ? el.scrollHeight + border
        : Math.max(0, el.scrollHeight - padding);
      const target = Math.min(Math.max(contentNeeded, minHeight), maxHeight);
      el.style.height = `${target}px`;
      el.style.overflowY = contentNeeded > maxHeight ? 'auto' : 'hidden';
    }, [managed, effMinRows, effMaxRows]);

    // Re-fit on mount and whenever the (possibly controlled) value changes.
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-fit when the content value changes
    React.useLayoutEffect(() => {
      resize();
    }, [resize, props.value, props.defaultValue]);

    // React to the sizing contract itself changing: reset the manual-drag latch and clear any
    // stale inline styles (auto-grow -> floor-only, or managed -> unmanaged), then re-fit.
    React.useLayoutEffect(() => {
      manuallyResized.current = false;
      const el = innerRef.current;
      if (!el) return;
      if (!managed) {
        restoreOwnedStyles(el);
        return;
      }
      // Floor-only now: drop any height/overflow a previous `maxRows` left behind.
      if (effMaxRows === undefined) {
        el.style.height = cssLength(styleRef.current?.height);
        el.style.overflowY = cssLength(styleRef.current?.overflowY);
      }
      resize();
    }, [managed, effMaxRows, resize, restoreOwnedStyles]);

    // Observe the element for (a) width/breakpoint reflow — content can rewrap to a new height
    // that a value-only refit would miss — and (b) manual drags past the ceiling, after which
    // the user owns the height (and we keep it scrollable).
    React.useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el || !managed || typeof ResizeObserver === 'undefined') return;

      let lastWidth = el.clientWidth;
      const observer = new ResizeObserver(() => {
        const width = el.clientWidth;
        if (width !== lastWidth) {
          lastWidth = width;
          resize();
          return;
        }
        if (effMaxRows === undefined || manuallyResized.current) return;

        const { lineHeight, padding, border, borderBox } = measureRowMetrics(el);
        const maxHeight = effMaxRows * lineHeight + (borderBox ? padding + border : 0);
        if (el.offsetHeight > maxHeight + 1) {
          manuallyResized.current = true;
          // Keep content scrollable at the user's chosen height instead of freezing `hidden`.
          el.style.overflowY = cssLength(styleRef.current?.overflowY) || 'auto';
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [managed, effMaxRows, resize]);

    return (
      // A Fragment, not a wrapper element: `InputGroup`'s `has-[>textarea]` layout selector
      // needs the `<textarea>` to stay a direct child wherever this renders. A Fragment also keeps the
      // element at this position stable across renders -- switching between a bare control and
      // a wrapped one when `error` toggles would remount the textarea and drop focus/caret
      // position mid-keystroke under validate-on-change. FormFieldError already renders nothing
      // when `error` is falsy, so the bare-vs-message look is unaffected either way.
      <>
        <textarea
          data-slot={group.inGroup ? 'input-group-control' : 'textarea'}
          id={id}
          {...validation.aria}
          className={cn(
            // Base styles (all themes)
            'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error future:aria-invalid:ring-1 future:aria-invalid:ring-error/40 aria-invalid:focus-visible:ring-error md:text-sm',
            // Future Dark / Future Light overrides
            'future:rounded-xl future:border-0 future:bg-surface-overlay future:text-sm future:placeholder:text-foreground-muted future:placeholder:font-normal future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
            // Fixed floor only in the unmanaged default; managed mode owns its min-height inline.
            !managed && 'min-h-[80px]',
            // Vertical resize handle (uncapped above; bounded below by the `minRows` floor).
            managed && 'resize-y',
            group.inGroup && IN_GROUP_CLASS,
            className
          )}
          ref={setRef}
          style={style}
          onChange={(event) => {
            onChange?.(event);
            resize();
          }}
          {...props}
          disabled={props.disabled || group.disabled}
        />
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
