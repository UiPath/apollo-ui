import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import {
  formatGuardrailFormMessage,
  type GuardrailRemoveDialogLabels,
  useGuardrailRemoveDialogLabels,
} from './i18n';

export interface GuardrailRemoveDialogProps {
  /**
   * Controlled visibility. The host owns it: `onConfirm` and `onCancel` are intents, so
   * neither closes the dialog on its own.
   */
  open: boolean;
  /** The guardrail being removed. Interpolated into the confirmation question. */
  guardrailName: string;
  /**
   * The tool the removal was requested from, when the host is detaching the guardrail from
   * one tool rather than deleting it. Renders the "removed for tool" line, and only
   * alongside something remaining: with nothing left the guardrail is gone everywhere and
   * naming one tool would misdescribe it. Both products already behave that way.
   */
  toolName?: string;
  /** Tools the guardrail still applies to once this removal is applied. */
  remainingToolNames?: string[];
  /**
   * Scopes the guardrail still applies to once this removal is applied, as raw wire values
   * (`'Agent'`, `'Llm'`, `'Tool'`) run through `formatScope`. Pass only the scopes worth
   * listing: both products drop `Tool` here when the remaining tools are listed by name.
   */
  remainingScopes?: string[];
  /** Tools a full removal also takes this guardrail off. */
  affectedToolNames?: string[];
  /** Scopes a full removal also takes this guardrail off, as raw wire values. */
  affectedScopes?: string[];

  /**
   * The user confirmed. An intent, not a mutation: the write, the scoped-removal unwind,
   * the telemetry event and closing the dialog all stay host-side, because the two products
   * unwind a tool-scoped guardrail differently and their event taxonomies do not overlap.
   */
  onConfirm: () => void;
  /** The user dismissed, through the Cancel button or Escape. Also an intent. */
  onCancel: () => void;

  /**
   * Localize one raw scope value. Defaults to the raw value, so a host that shows scopes
   * should pass this: both products already own the mapping (`Agent` / `LLM calls` /
   * `Tools`), and scope vocabulary is product-owned, not package-owned. Same idiom as
   * `GuardrailList`'s `formatScopes`.
   */
  formatScope?: (scope: string) => ReactNode;
  /**
   * Portal target for the dialog. Omit to inherit the nearest wind `PortalContainerProvider`
   * (`document.body` when there is none), pass an element to portal into it, or `'body'` to
   * force `document.body` even under a provider. Agents' dialog deliberately escapes its
   * shadow root today, which is what `'body'` preserves; Flow's stays in place.
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
      {toolNames.map((name) => (
        <li key={name}>{name}</li>
      ))}
      {scopes.map((scope) => (
        <li key={scope}>{formatScope ? formatScope(scope) : scope}</li>
      ))}
    </ul>
  );
}

/**
 * Confirmation dialog for removing a guardrail, with the impact of the removal spelled out.
 *
 * Both products ask the same question and describe two different impacts, so both arrive as
 * structured props rather than a free content slot: `affected*` is what a full removal also
 * takes the guardrail off, `remaining*` is what survives a tool-scoped removal. Flow's
 * `isToolOnAgent` branch is the same split computed from one guardrail, so it converges by
 * filling one pair or the other. Deciding which removal is happening is host business.
 */
export function GuardrailRemoveDialog({
  open,
  guardrailName,
  toolName,
  remainingToolNames = [],
  remainingScopes = [],
  affectedToolNames = [],
  affectedScopes = [],
  onConfirm,
  onCancel,
  formatScope,
  container,
  labels: labelOverrides,
  className,
}: GuardrailRemoveDialogProps) {
  const labels = useGuardrailRemoveDialogLabels(labelOverrides);

  const hasAffected = affectedToolNames.length > 0 || affectedScopes.length > 0;
  const hasRemaining = remainingToolNames.length > 0 || remainingScopes.length > 0;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent container={container} className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          {/* `asChild` because the primitive renders a <p>: the impact blocks belong to the
              accessible description (an alert dialog announces it on open), and <p> and <ul>
              cannot live inside a <p>. Flow's dialog nests them today. */}
          <AlertDialogDescription asChild>
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Cancel reports through `onOpenChange`, the one path Escape also takes, so a
              dismissal is reported exactly once however it happened. */}
          <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
          {/* A plain destructive Button, not `AlertDialogAction`: Radix's action is a close
              button, so it would drive `onOpenChange(false)` on top of the click and report a
              cancel with every confirm. Flow's dialog does that today. `open` is controlled,
              so nothing is lost by not closing from inside. */}
          <Button variant="destructive" onClick={onConfirm}>
            {labels.remove}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
