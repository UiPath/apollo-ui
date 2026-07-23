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
 * you pass in, with multi-step schemas presented as tabs (Parameters, Error
 * handling, Advanced, ...).
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
 *   schema={assembledSchema}              // caller-built FormSchema (steps = tabs)
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
  children,
  headerExtra,
  sectionVariant,
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
    <div
      className={cn('flex min-h-0 flex-col bg-surface-raised', className)}
      style={{ '--mf-content-inset': contentInset } as CSSProperties}
    >
      {/* ── Title bar (optional; host panel system may own it) ── */}
      {panelTitle && (
        <div className="flex h-10 shrink-0 items-center justify-between px-2">
          <div className="flex items-center gap-1">
            <div className="grid size-8 place-items-center text-foreground-subtle">
              <GripVertical size={14} />
            </div>
            <span className="text-sm font-semibold text-foreground">{panelTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            {headerExtra}
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
        </div>
      )}

      {/* ── Node identity row ── */}
      {hasNodeHeader && (
        <div className="flex shrink-0 items-center justify-between gap-4 py-4 [padding-inline:var(--mf-content-inset,1.5rem)]">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            {nodeIcon && (
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle [&>svg]:size-5">
                {nodeIcon}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              {nodeLabel && (
                // <span>, not <p>: host apps (e.g. Angular Material's `.mat-typography p`)
                // inject a bottom margin on <p> that breaks the header alignment.
                <span className="block truncate text-base font-semibold leading-5 tracking-[-0.3px] text-foreground">
                  {nodeLabel}
                </span>
              )}
              {nodeCategory && (
                <span className="block truncate text-xs leading-4 text-foreground-muted">
                  {nodeCategory}
                </span>
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}

      {/* ── Content (children) or Form ── */}
      {children ? (
        <div className="min-h-0 flex-1 overflow-auto" style={SURFACE_REMAP}>
          {children}
        </div>
      ) : !formSchema ? (
        <div className="py-4 text-xs text-foreground-subtle [padding-inline:var(--mf-content-inset,1.5rem)]">
          No form schema defined for this node.
        </div>
      ) : formSchema.steps ? (
        // Tabbed schema: MetadataForm owns the scroll so its tab bar pins under
        // the header. This wrapper is a height-filling flex column, NOT the
        // scroll container — the form's inset/padding move inside TabbedStepForm.
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            style={SURFACE_REMAP}
            className="flex min-h-0 flex-1 flex-col [&_label]:text-foreground-muted"
          >
            <MetadataForm
              key={resetKey}
              schema={formSchema}
              plugins={plugins}
              stepVariant="tabs"
              sectionVariant={sectionVariant}
              onSubmit={onSubmit}
              disabled={disabled}
              className="flex min-h-0 flex-1 flex-col"
            />
          </div>
        </div>
      ) : (
        // Single-page schema: classic behavior — this wrapper scrolls the whole form.
        <div className="min-h-0 flex-1 overflow-auto">
          <div style={SURFACE_REMAP} className="[&_label]:text-foreground-muted">
            <MetadataForm
              key={resetKey}
              schema={formSchema}
              plugins={plugins}
              stepVariant="tabs"
              sectionVariant={sectionVariant}
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
