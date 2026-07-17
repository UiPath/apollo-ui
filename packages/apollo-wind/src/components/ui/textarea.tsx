import * as React from 'react';

import { cn } from '@/lib/index';

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
  ({ className, minRows, maxRows, onChange, style, ...props }, ref) => {
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
      <textarea
        className={cn(
          // Base styles (all themes)
          'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          // Future Dark / Future Light overrides
          'future:rounded-xl future:border-0 future:bg-surface-overlay future:text-sm future:placeholder:text-foreground-muted future:placeholder:font-normal future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
          // Fixed floor only in the unmanaged default; managed mode owns its min-height inline.
          !managed && 'min-h-[80px]',
          // Vertical resize handle (uncapped above; bounded below by the `minRows` floor).
          managed && 'resize-y',
          className
        )}
        ref={setRef}
        style={style}
        onChange={(event) => {
          onChange?.(event);
          resize();
        }}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
