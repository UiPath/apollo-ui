import type { FormSchema, FormStep } from '@uipath/apollo-wind';
import { cn, MetadataForm, Tabs, TabsContent, TabsList, TabsTrigger } from '@uipath/apollo-wind';
import { GripVertical, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNodeManifest } from '../../core/useNodeTypeRegistry';
import type { NodePropertyPanelProps } from './NodePropertyPanel.types';

// ============================================================================
// Helpers
// ============================================================================

function isMultiStep(form: FormSchema): form is FormSchema & { steps: FormStep[] } {
  return 'steps' in form && Array.isArray((form as { steps?: unknown }).steps);
}

// ============================================================================
// NodePropertyPanel
// ============================================================================

/**
 * NodePropertyPanel — docked properties panel driven by the node manifest.
 *
 * The panel reads `manifest.form` (a `FormSchema`) from the `NodeRegistryProvider`
 * in the tree using `nodeType`. It renders:
 *
 * - **Multi-step FormSchema** (`steps`): each step becomes a tab. Tab labels and
 *   the fields within each tab are fully consumer-defined in the FormSchema — the
 *   component does not hardcode any tab names or field types.
 * - **Single-page FormSchema** (`sections`): rendered as a flat scrollable form.
 * - **No form schema**: renders an empty-state message.
 *
 * @example
 * ```tsx
 * // Register the manifest (with form schema) once at app startup:
 * <NodeRegistryProvider manifest={workflowManifest}>
 *   <NodePropertyPanel
 *     panelTitle="Properties"
 *     nodeType="uipath.http-request"
 *     nodeLabel="Fetch invoice"
 *     nodeCategory="HTTP"
 *     onSubmit={(data) => saveNodeConfig(nodeId, data)}
 *     onClose={() => setSelectedNode(null)}
 *   />
 * </NodeRegistryProvider>
 * ```
 */
export function NodePropertyPanel({
  panelTitle,
  onClose,
  nodeType,
  nodeLabel,
  nodeCategory,
  nodeIcon,
  action,
  onSubmit,
  className,
}: NodePropertyPanelProps) {
  const manifest = useNodeManifest(nodeType);
  const form = manifest?.form;
  const subtitle = nodeCategory ?? manifest?.category ?? nodeType;
  const hasNodeHeader = !!(nodeLabel || nodeCategory || nodeIcon || action);

  const steps = form && isMultiStep(form) ? form.steps : null;
  const [activeStep, setActiveStep] = useState<string>('');
  const currentStep = activeStep || steps?.[0]?.id || '';

  // biome-ignore lint/correctness/useExhaustiveDependencies: nodeType is the trigger; setActiveStep is stable
  useEffect(() => {
    setActiveStep('');
  }, [nodeType]);

  return (
    <div className={cn('flex min-h-0 flex-col bg-surface-raised', className)}>
      {/* ── Title bar ── */}
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
            {nodeIcon && <div className="shrink-0">{nodeIcon}</div>}
            <div className="min-w-0 flex-1">
              {nodeLabel && (
                <p className="truncate text-base font-semibold leading-5 tracking-[-0.4px] text-foreground">
                  {nodeLabel}
                </p>
              )}
              {subtitle && (
                <p className="mt-0.5 truncate text-sm leading-5 text-foreground-muted">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}

      {/* ── Form ── */}
      {!form ? (
        <p className="px-6 py-4 text-xs text-foreground-subtle">
          No form schema defined for this node type.
        </p>
      ) : steps && steps.length === 0 ? (
        <p className="px-6 py-4 text-xs text-foreground-subtle">
          No configuration fields defined for this node type.
        </p>
      ) : steps ? (
        // Multi-step: steps become tabs — consumer defines the step titles and fields
        <Tabs
          value={currentStep}
          onValueChange={setActiveStep}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="h-auto shrink-0 justify-start gap-1 rounded-none bg-transparent px-4 pb-2 pt-3">
            {steps.map((step) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                className="h-6 rounded-lg px-2 text-xs font-medium text-foreground-subtle shadow-none transition hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map((step) => (
            <TabsContent
              key={step.id}
              value={step.id}
              className="mt-0 min-h-0 flex-1 overflow-auto"
            >
              {/* Remap surface-raised → surface-overlay so inputs appear lighter than the panel; labels → foreground-muted (zinc-400) */}
              <div
                style={{ '--surface-raised': 'var(--surface-overlay)' } as React.CSSProperties}
                className="[&_label]:text-foreground-muted"
              >
                <MetadataForm
                  schema={{
                    id: `${form.id}__${step.id}`,
                    title: step.title,
                    sections: step.sections,
                    mode: form.mode,
                  }}
                  onSubmit={onSubmit}
                  className="flex flex-col gap-4 px-6 pb-6 pt-2"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Single-page: sections rendered by MetadataForm directly
        <div className="min-h-0 flex-1 overflow-auto">
          {/* Remap surface-raised → surface-overlay so inputs appear lighter than the panel; labels → foreground-muted (zinc-400) */}
          <div
            style={{ '--surface-raised': 'var(--surface-overlay)' } as React.CSSProperties}
            className="[&_label]:text-foreground-muted"
          >
            <MetadataForm
              schema={form}
              onSubmit={onSubmit}
              className="flex flex-col gap-4 px-6 pb-6 pt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}
