import { cn, MetadataForm } from '@uipath/apollo-wind';
import { GripVertical, X } from 'lucide-react';
import { type CSSProperties, useMemo } from 'react';
import type { NodePropertyPanelProps } from './NodePropertyPanel.types';

// Remap surface-raised -> surface-overlay so inputs read lighter than the panel.
const SURFACE_REMAP = { '--surface-raised': 'var(--surface-overlay)' } as CSSProperties;

/**
 * NodePropertyPanel — a presentational, docked properties panel for canvas nodes.
 *
 * The panel owns only the *chrome*: an optional title bar (drag handle + close),
 * a node identity row (icon / label / category + an action slot), and the form
 * frame. The form itself is a single `MetadataForm` rendered from the `schema`
 * you pass in, presented as tabs (Parameters, Error handling, Advanced, ...).
 * Prefer a schema-driven `TabbedFormSchema` (`tabs` + `section.tab`); legacy
 * multi-step (`steps`) schemas are also rendered as tabs for compatibility.
 *
 * The caller owns everything domain-specific: schema assembly, real-time change
 * handling, custom field components, and validation are all supplied through
 * `schema` + `plugins`. The panel renders ONE form instance, so values and
 * validation are shared across tabs and nothing is lost when switching tabs.
 *
 * @example
 * ```tsx
 * <NodePropertyPanel
 *   panelTitle="Properties"               // omit when dockview owns the title bar
 *   nodeLabel="Fetch invoice details"
 *   nodeCategory="HTTP Request"
 *   action={<RunButton />}
 *   schema={assembledSchema}              // caller-built TabbedFormSchema (tabs + section.tab)
 *   plugins={formPlugins}                 // real-time onChange, custom fields
 *   resetKey={selectedNodeId}             // remount on node change
 *   onClose={() => deselect()}
 * />
 * ```
 */
export function NodePropertyPanel({
  panelTitle,
  onClose,
  nodeIcon,
  nodeLabel,
  nodeCategory,
  action,
  schema,
  plugins,
  onSubmit,
  disabled,
  resetKey,
  className,
  contentInset = '1.5rem',
}: NodePropertyPanelProps) {
  const hasNodeHeader = !!(nodeLabel || nodeCategory || nodeIcon || action);

  // This panel is a live-edit surface: changes persist via plugins/onChange, so
  // there is no Submit button by default. Callers can still opt in by setting
  // `actions` on the schema. Memoized so MetadataForm's identity stays stable.
  const formSchema = useMemo(
    () => (schema && schema.actions === undefined ? { ...schema, actions: [] } : schema),
    [schema]
  );

  return (
    <div className={cn('flex min-h-0 flex-col bg-surface-raised', className)}>
      {/* ── Title bar (optional; host panel system may own it) ── */}
      {panelTitle && (
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-subtle px-2">
          <div className="flex items-center gap-1">
            <div className="grid size-8 place-items-center text-foreground-subtle">
              <GripVertical size={14} />
            </div>
            <span className="text-sm font-semibold text-foreground">{panelTitle}</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="grid size-6 place-items-center rounded text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── Node identity row ── */}
      {hasNodeHeader && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-6 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {nodeIcon && (
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle [&>svg]:size-5">
                {nodeIcon}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              {nodeLabel && (
                // <span>, not <p>: host apps (e.g. Angular Material's `.mat-typography p`)
                // inject a bottom margin on <p> that breaks the header alignment.
                <span className="block truncate text-lg font-semibold leading-6 tracking-[-0.4px] text-foreground">
                  {nodeLabel}
                </span>
              )}
              {nodeCategory && (
                <span className="block truncate text-sm leading-5 text-foreground-muted">
                  {nodeCategory}
                </span>
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}

      {/* ── Form ── */}
      {!formSchema ? (
        <div className="px-6 py-4 text-xs text-foreground-subtle">
          No form schema defined for this node.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            style={{ ...SURFACE_REMAP, '--mf-content-inset': contentInset } as CSSProperties}
            className="[&_label]:text-foreground-muted"
          >
            {/* Horizontal padding + the tab underline's full-bleed both derive from
                `--mf-content-inset`, so they stay in lockstep. A `TabbedFormSchema`
                renders as tabs on its own; `stepVariant="tabs"` only keeps legacy
                `steps` schemas rendering as tabs (it is ignored for tabbed schemas). */}
            <MetadataForm
              key={resetKey}
              schema={formSchema}
              plugins={plugins}
              stepVariant="tabs"
              onSubmit={onSubmit}
              disabled={disabled}
              className="flex flex-col gap-4 pb-6 pt-3 [padding-inline:var(--mf-content-inset)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
