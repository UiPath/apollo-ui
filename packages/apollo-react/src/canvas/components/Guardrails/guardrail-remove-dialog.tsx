import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@uipath/apollo-wind';
import { X } from 'lucide-react';
import { type ReactNode, useRef } from 'react';
import {
  formatGuardrailFormMessage,
  type GuardrailRemoveDialogLabels,
  useGuardrailRemoveDialogLabels,
} from './i18n';

export interface GuardrailRemoveDialogProps {
  /** Controlled by the host: `onConfirm` and `onCancel` are intents, neither closes the dialog. */
  open: boolean;
  /** Interpolated into the confirmation question. */
  guardrailName: string;
  /** The tool being detached. Named only alongside `remaining*`, which is the only case it fits. */
  toolName?: string;
  /**
   * What the removal costs: `affected*` is what a full removal also takes the guardrail off,
   * `remaining*` what a tool-scoped one leaves behind. Scopes are raw (`'Agent'`, `'Llm'`,
   * `'Tool'`), rendered through `formatScope`.
   */
  affectedToolNames?: string[];
  affectedScopes?: string[];
  remainingToolNames?: string[];
  remainingScopes?: string[];
  /** An intent: the write, the scoped-removal unwind and the telemetry stay host-side. */
  onConfirm: () => void;
  /** Cancel, the corner close button, or Escape. Also an intent. */
  onCancel: () => void;
  /** Localize one raw scope value; defaults to it. Same idiom as `GuardrailList`'s `formatScopes`. */
  formatScope?: (scope: string) => ReactNode;
  /**
   * Render the corner close button. Opt-in, so adopting the dialog never adds a control a
   * product did not have: Agents asks for it, Flow leaves it off.
   */
  showCloseButton?: boolean;
  /**
   * Let a click on the backdrop cancel. Off by default: a confirmation is a decision, and a
   * stray click should not discard it. Escape, Cancel and the close button always do.
   */
  closeOnBackdropClick?: boolean;
  /**
   * Portal target. Omit to inherit the nearest `PortalContainerProvider`, or pass `'body'` to
   * force `document.body` even under one, which is how Agents' dialog escapes its shadow root.
   * Mirrors wind's `PortalContainerOverride`, which its package root does not export.
   */
  container?: HTMLElement | 'body' | null;
  labels?: Partial<GuardrailRemoveDialogLabels>;
  className?: string;
}

/** Tool names verbatim, then scopes through the host's formatter. */
function ImpactList({
  toolNames,
  scopes,
  formatScope,
}: {
  toolNames: string[];
  scopes: string[];
  formatScope?: (scope: string) => ReactNode;
}) {
  return (
    <ul className="list-disc pl-5">
      {/* Prefixed by source and indexed, like `MixedScopesBanner`: two tools can legitimately
          carry the same display name, and the prefix keeps the keys self-describing. */}
      {toolNames.map((name, index) => (
        <li key={`tool:${index}:${name}`}>{name}</li>
      ))}
      {scopes.map((scope, index) => (
        <li key={`scope:${index}:${scope}`}>{formatScope ? formatScope(scope) : scope}</li>
      ))}
    </ul>
  );
}

/**
 * Confirmation dialog for removing a guardrail, with the impact of the removal spelled out.
 * Both products describe the same two impacts, so both arrive as structured props rather than a
 * content slot; deciding which removal is happening, and unwinding it, stays host business.
 */
export function GuardrailRemoveDialog({
  open,
  guardrailName,
  toolName,
  affectedToolNames = [],
  affectedScopes = [],
  remainingToolNames = [],
  remainingScopes = [],
  onConfirm,
  onCancel,
  formatScope,
  showCloseButton = false,
  closeOnBackdropClick = false,
  container,
  labels: labelOverrides,
  className,
}: GuardrailRemoveDialogProps) {
  const labels = useGuardrailRemoveDialogLabels(labelOverrides);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const hasAffected = affectedToolNames.length > 0 || affectedScopes.length > 0;
  const hasRemaining = remainingToolNames.length > 0 || remainingScopes.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent
        data-slot="guardrail-remove-dialog"
        container={container}
        className={className}
        // Wind's own close button hardcodes an English "Close", which would be the only
        // untranslated string in the family, so it is always off and rebuilt below on request.
        showCloseButton={false}
        // Wind's `closeOnBackdropClick` only applies to `variant="takeover"`, so the guard has
        // to be the pointer handler.
        onPointerDownOutside={closeOnBackdropClick ? undefined : (event) => event.preventDefault()}
        // `AlertDialog` focuses its cancel control for free; a plain dialog focuses whichever
        // control comes first in the markup. Naming Cancel explicitly keeps that a decision
        // rather than a side effect of where the close button below happens to sit.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          {/* `asChild` because the primitive renders a <p>: the impact blocks belong to the
              description the dialog announces, and <p>/<ul> cannot nest inside a <p>. */}
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>{formatGuardrailFormMessage(labels.confirmPrompt, { name: guardrailName })}</p>

              {hasAffected && (
                <>
                  <p>{labels.alsoApplicable}</p>
                  <ImpactList
                    toolNames={affectedToolNames}
                    scopes={affectedScopes}
                    formatScope={formatScope}
                  />
                </>
              )}

              {hasRemaining && (
                <>
                  {toolName !== undefined && (
                    <p>{formatGuardrailFormMessage(labels.removedForTool, { toolName })}</p>
                  )}
                  <p>{labels.stillApplicable}</p>
                  <ImpactList
                    toolNames={remainingToolNames}
                    scopes={remainingScopes}
                    formatScope={formatScope}
                  />
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {/* Both close controls report through `onOpenChange`, the path Escape also takes, so a
              dismissal is reported exactly once however it happened. */}
          <DialogClose asChild>
            <Button ref={cancelRef} variant="outline">
              {labels.cancel}
            </Button>
          </DialogClose>
          {/* A plain Button, not a `DialogClose`: closing from inside would report a cancel with
              every confirm, which Flow's dialog does today. `open` is controlled, so nothing is
              lost. */}
          <Button onClick={onConfirm}>{labels.remove}</Button>
        </DialogFooter>
        {/* Last in the DOM so it is last in the tab order: a keyboard user reaches the decision
            before the escape hatch. Position is wind's own, from the button it replaces. */}
        {showCloseButton && (
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="xs"
              icon
              aria-label={labels.close}
              className="absolute top-4 right-4"
            >
              <X />
            </Button>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
