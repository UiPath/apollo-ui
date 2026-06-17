import { ChevronDown, Maximize2, Redo2, Sparkles, Undo2 } from 'lucide-react';

export type ExpressionMode = 'expr' | 'json';

export interface ExpressionFieldProps {
  /** Display label shown above the editor. */
  label?: string;
  /** Current expression value. */
  value?: string;
  /** Editor mode — JavaScript expression or JSON template. Defaults to 'expr'. */
  mode?: ExpressionMode;
  /** Short description shown below the editor. */
  description?: string;
  /** Called when the expression value changes (Phase 2 — editing not yet wired). */
  onChange?: (value: string) => void;
  /** Called when the user switches between expr and json modes. */
  onModeChange?: (mode: ExpressionMode) => void;
}

/**
 * ExpressionField — syntax-highlighted expression editor with mode switcher.
 *
 * Phase 1: read-only display with Expr / JSON mode toggle, undo/redo chrome,
 * AI assist button, and Insert variable affordance.
 *
 * Phase 2: live editing via Monaco/CodeMirror with variable binding ({x} pill),
 * real-time validation, and IntelliSense.
 */
export function ExpressionField({
  label,
  value,
  mode = 'expr',
  description,
  onModeChange,
}: ExpressionFieldProps) {
  const expression = value ?? '';
  const activeMode = mode;

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground-muted">{label}</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title="AI assist"
              aria-label="AI assist"
              className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
            >
              <Sparkles size={12} />
            </button>
            <button
              type="button"
              title="Insert variable"
              aria-label="Insert variable"
              className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
            >
              <span className="font-mono text-[10px]">{'{x}'}</span>
              <span>Insert</span>
              <ChevronDown size={9} />
            </button>
          </div>
        </div>
      )}

      {/* Editor block */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
        {/* Block header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-3 py-2">
          <span className="font-mono text-xs text-foreground-muted">result</span>
          <button
            type="button"
            title="Expand editor"
            aria-label="Expand editor"
            className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
          >
            <Maximize2 size={11} />
          </button>
        </div>

        {/* Toolbar: undo / redo | mode switcher */}
        <div className="flex items-center gap-1 border-b border-border-subtle bg-surface px-2.5 py-1.5">
          <button
            type="button"
            title="Undo"
            aria-label="Undo"
            className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
          >
            <Undo2 size={12} />
          </button>
          <button
            type="button"
            title="Redo"
            aria-label="Redo"
            className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
          >
            <Redo2 size={12} />
          </button>
          <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
          <button
            type="button"
            onClick={() => onModeChange?.('expr')}
            className="rounded px-2 py-0.5 text-[11px] transition"
            style={{
              color: activeMode === 'expr' ? 'var(--foreground)' : 'var(--foreground-subtle)',
              fontWeight: activeMode === 'expr' ? 600 : 400,
            }}
          >
            expr
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('json')}
            className="rounded px-2 py-0.5 text-[11px] transition"
            style={{
              color: activeMode === 'json' ? 'var(--foreground)' : 'var(--foreground-subtle)',
              fontWeight: activeMode === 'json' ? 600 : 400,
            }}
          >
            json
          </button>
        </div>

        {/* Code display */}
        <pre className="overflow-auto whitespace-pre-wrap bg-surface-raised p-3 text-xs font-mono leading-5 text-foreground">
          {expression || '// Enter expression…'}
        </pre>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 shrink-0 rounded-full bg-green-500" />
            <span className="text-[10px] text-foreground-subtle">No errors</span>
          </div>
          <span className="text-[10px] text-foreground-subtle">Ln 1, Col 1</span>
        </div>
      </div>

      {description && <p className="text-[11px] leading-4 text-foreground-subtle">{description}</p>}
    </div>
  );
}
