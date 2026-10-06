import { cn, MetadataForm } from '@uipath/apollo-wind';
import { GripVertical, X } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useRef } from 'react';
import { useSafeLingui } from '../../../i18n';
import { EditableText } from './EditableText';
import type { NodePropertyPanelProps } from './NodePropertyPanel.types';

// Future themes raise the panel surface, so inputs remap surface-raised ->
// surface-overlay to read lighter than the panel. Current themes keep the
// classic bg-surface panel and stock input surfaces (no remap).
const SURFACE_REMAP = 'future:[--surface-raised:var(--surface-overlay)]';

// Compares attribute values instead of building a selector, so any field name matches as-is.
function findFieldElement(root: HTMLElement, name: string): HTMLElement | null {
  const fields = root.querySelectorAll<HTMLElement>('[data-field-name]');
  for (const field of fields) {
    if (field.getAttribute('data-field-name') === name) {
      return field;
    }
  }
  return null;
}

/**
 * NodePropertyPanel — a presentational, docked properties panel for canvas nodes.
 *
 * The panel owns only the *chrome*: an optional title bar (drag handle + close),
 * a node identity row (icon / label / description-or-category + an action slot),
 * and the form frame. The label and description lines become click-to-edit when
 * both matching callbacks are passed (`onNode*Change` and `onNode*Submit`).
 *
 * The form itself is a single `MetadataForm` rendered from the `schema` you pass
 * in, with multi-step schemas presented as tabs (Parameters, Error handling,
 * Advanced, ...).
 *
 * The caller owns everything domain-specific: schema assembly, real-time change
 * handling, custom field components, and validation are all supplied through
 * `schema` + `plugins`. The panel renders ONE form instance, so values and
 * validation are shared across tabs and nothing is lost when switching tabs.
 *
 * @example
 * ```tsx
 * // The label is controlled: the draft has to flow back through `nodeLabel`.
 * const [draftLabel, setDraftLabel] = useState(node.label);
 *
 * <NodePropertyPanel
 *   panelTitle="Properties"               // omit when dockview owns the title bar
 *   nodeLabel={draftLabel}
 *   nodeCategory="HTTP Request"         // fallback second line; a description wins
 *   onNodeLabelChange={setDraftLabel}   // per keystroke; omit either for a read-only label
 *   onNodeLabelSubmit={renameNode}      // on Enter or blur, trimmed
 *   action={<RunButton />}
 *   schema={assembledSchema}              // caller-built FormSchema (steps = tabs)
 *   plugins={formPlugins}                 // real-time onChange, custom fields
 *   resetKey={selectedNodeId}             // remount on node change
 *   changedFields={['url', 'headers']}    // flagged; the first is scrolled into view
 *   onClose={() => deselect()}
 * />
 * ```
 */
export function NodePropertyPanel({
  panelTitle,
  dragHandleProps,
  onClose,
  nodeIcon,
  nodeLabel,
  nodeCategory,
  nodeDescription,
  nodeLabelPlaceholder,
  nodeDescriptionPlaceholder,
  onNodeLabelChange,
  onNodeLabelSubmit,
  onNodeDescriptionChange,
  onNodeDescriptionSubmit,
  nodeLabelError,
  nodeDescriptionError,
  action,
  schema,
  plugins,
  onSubmit,
  disabled,
  autoComplete,
  resetKey,
  className,
  contentInset = '1.5rem',
  children,
  headerExtra,
  sectionVariant,
  activeStepId,
  onActiveStepChange,
  changedFields,
}: NodePropertyPanelProps) {
  const { _ } = useSafeLingui();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrolledKeyRef = useRef<string | null>(null);
  const changedFieldLabel = _({
    id: 'canvas.node_property_panel.changed_field',
    message: 'Changed',
  });

  // Scrolls the first rendered field in `changedFields` order into view, once per distinct
  // `changedFields`/`resetKey` pair. A field on an unopened tab mounts later, so a
  // MutationObserver waits for it and disconnects once found.
  useEffect(() => {
    if (children || !changedFields || changedFields.length === 0) {
      return;
    }

    const scrollKey = JSON.stringify([resetKey ?? null, changedFields]);
    if (scrolledKeyRef.current === scrollKey) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const findTarget = (): HTMLElement | null => {
      for (const name of changedFields) {
        const el = findFieldElement(root, name);
        if (el) {
          return el;
        }
      }
      return null;
    };

    const scrollToTarget = (target: HTMLElement) => {
      scrolledKeyRef.current = scrollKey;
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      // 'nearest' scrolls only as far as needed, so a host page around the panel stays put.
      target.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    };

    const immediateTarget = findTarget();
    if (immediateTarget) {
      scrollToTarget(immediateTarget);
      return;
    }

    const observer = new MutationObserver(() => {
      const target = findTarget();
      if (target) {
        scrollToTarget(target);
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [children, changedFields, resetKey]);

  const isLabelEditable = !!onNodeLabelChange && !!onNodeLabelSubmit;
  const isDescriptionEditable = !!onNodeDescriptionChange && !!onNodeDescriptionSubmit;
  const showsDescription = !!nodeDescription || isDescriptionEditable || !!nodeDescriptionError;
  const showsLabel = !!nodeLabel || isLabelEditable || !!nodeLabelError;
  const hasNodeHeader = !!(showsLabel || nodeCategory || nodeIcon || action || showsDescription);

  // This panel is a live-edit surface: changes persist via plugins/onChange, so
  // there is no Submit button by default. Callers can still opt in by setting
  // `actions` on the schema. Memoized so MetadataForm's identity stays stable.
  const formSchema = useMemo(
    () => (schema && schema.actions === undefined ? { ...schema, actions: [] } : schema),
    [schema]
  );

  return (
    <div
      ref={rootRef}
      className={cn('flex min-h-0 flex-col bg-surface future:bg-surface-raised', className)}
      style={{ '--mf-content-inset': contentInset } as CSSProperties}
    >
      {/* ── Title bar (optional; host panel system may own it) ── */}
      {panelTitle && (
        <div
          data-slot="node-property-panel-titlebar"
          className="flex h-10 shrink-0 items-center justify-between px-2"
        >
          <div className="flex items-center gap-1">
            <div
              {...dragHandleProps}
              data-slot="node-property-panel-drag-handle"
              className="grid size-8 cursor-grab touch-none place-items-center text-foreground-subtle active:cursor-grabbing"
            >
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
                title={_({ id: 'canvas.node_property_panel.close', message: 'Close' })}
                aria-label={_({ id: 'canvas.node_property_panel.close', message: 'Close' })}
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
              {showsLabel && (
                <EditableText
                  value={nodeLabel ?? ''}
                  placeholder={
                    nodeLabelPlaceholder ??
                    _({ id: 'canvas.node_property_panel.name_placeholder', message: 'Name' })
                  }
                  size="lg"
                  onChange={onNodeLabelChange}
                  onSubmit={onNodeLabelSubmit}
                  disabled={disabled}
                  error={nodeLabelError}
                  aria-label={_({
                    id: 'canvas.node_property_panel.node_name',
                    message: 'Node name',
                  })}
                  data-testid="node-property-panel-label"
                />
              )}
              {showsDescription ? (
                <EditableText
                  value={nodeDescription ?? ''}
                  placeholder={
                    nodeDescriptionPlaceholder ??
                    _({
                      id: 'canvas.node_property_panel.description_placeholder',
                      message: 'Description',
                    })
                  }
                  size="sm"
                  multiline="wrap"
                  maxLines={3}
                  onChange={onNodeDescriptionChange}
                  onSubmit={onNodeDescriptionSubmit}
                  disabled={disabled}
                  error={nodeDescriptionError}
                  aria-label={_({
                    id: 'canvas.node_property_panel.node_description',
                    message: 'Node description',
                  })}
                  data-testid="node-property-panel-description"
                />
              ) : (
                nodeCategory && (
                  <EditableText
                    value={nodeCategory}
                    size="sm"
                    data-testid="node-property-panel-category"
                  />
                )
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}

      {/* ── Content (children) or Form ── */}
      {children ? (
        <div className={cn('min-h-0 flex-1 overflow-auto', SURFACE_REMAP)}>{children}</div>
      ) : !formSchema ? (
        <div className="py-4 text-xs text-foreground-subtle [padding-inline:var(--mf-content-inset,1.5rem)]">
          No form schema defined for this node.
        </div>
      ) : formSchema.steps ? (
        // Tabbed schema: MetadataForm owns the scroll so its tab bar pins under
        // the header. This wrapper is a height-filling flex column, NOT the
        // scroll container — the form's inset/padding move inside TabbedStepForm.
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={cn('flex min-h-0 flex-1 flex-col', SURFACE_REMAP)}>
            <MetadataForm
              key={resetKey}
              schema={formSchema}
              plugins={plugins}
              stepVariant="tabs"
              sectionVariant={sectionVariant}
              activeStepId={activeStepId}
              onActiveStepChange={onActiveStepChange}
              onSubmit={onSubmit}
              disabled={disabled}
              autoComplete={autoComplete}
              changedFields={changedFields}
              changedFieldLabel={changedFieldLabel}
              className="flex min-h-0 flex-1 flex-col"
            />
          </div>
        </div>
      ) : (
        // Single-page schema: classic behavior — this wrapper scrolls the whole
        // form. No stepVariant: it only applies to step-based schemas.
        <div className="min-h-0 flex-1 overflow-auto">
          <div className={SURFACE_REMAP}>
            <MetadataForm
              key={resetKey}
              schema={formSchema}
              plugins={plugins}
              sectionVariant={sectionVariant}
              onSubmit={onSubmit}
              disabled={disabled}
              autoComplete={autoComplete}
              changedFields={changedFields}
              changedFieldLabel={changedFieldLabel}
              className="flex flex-col gap-4 pb-6 pt-3 [padding-inline:var(--mf-content-inset)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
