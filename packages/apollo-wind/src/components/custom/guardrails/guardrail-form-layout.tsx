import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GUARDRAIL_BUILDER_EN_LABELS } from './i18n';

export interface GuardrailFormLayoutProps {
  /** Drives the Dialog in modal mode; inline modes render regardless. */
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onSave: () => void;
  onCancel: () => void;
  /** Render as an inline panel instead of a modal dialog. */
  inline?: boolean;
  /** When inline, hide the back-button header (used when embedded under a host-owned header). */
  hideHeader?: boolean;
  /** Max width of the modal dialog in pixels (default: 700) */
  dialogMaxWidth?: number;
  /** Optional secondary save action (e.g. "Save as new" for mixed-scope guardrails) */
  secondaryAction?: { label: ReactNode; onClick: () => void; disabled?: boolean };
  /** Disable the primary save action when the current configuration cannot be persisted. */
  saveDisabled?: boolean;
  /** Left-aligned footer region (e.g. an evaluations toggle). */
  footerStart?: ReactNode;
  /** Button labels; English defaults. Hosts with i18n pass translated strings. */
  labels?: { cancel?: string; save?: string };
}

/**
 * Shared layout wrapper for guardrail builder forms, with three rendering modes:
 *  - inline + hideHeader: plain scrollable region with a footer
 *  - inline: full-height flex column with a back-button header and footer
 *  - modal: Dialog with header and footer
 */
export function GuardrailFormLayout({
  open,
  title,
  children,
  onSave,
  onCancel,
  inline = false,
  hideHeader = false,
  dialogMaxWidth = 700,
  secondaryAction,
  saveDisabled = false,
  footerStart,
  labels,
}: GuardrailFormLayoutProps) {
  const cancelLabel = labels?.cancel ?? GUARDRAIL_BUILDER_EN_LABELS.cancel;
  const saveLabel = labels?.save ?? GUARDRAIL_BUILDER_EN_LABELS.save;

  const footerButtons = (size?: 'sm') => (
    <>
      <Button variant="outline" size={size} onClick={onCancel}>
        {cancelLabel}
      </Button>
      {secondaryAction && (
        <Button
          variant="outline"
          size={size}
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
        >
          {secondaryAction.label}
        </Button>
      )}
      <Button size={size} onClick={onSave} disabled={saveDisabled}>
        {saveLabel}
      </Button>
    </>
  );

  if (inline) {
    return (
      <div data-slot="guardrail-form-layout" className="flex flex-col h-full">
        {!hideHeader && (
          <div
            data-slot="guardrail-form-layout-header"
            className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
          >
            <Button variant="ghost" size="2xs" icon aria-label={cancelLabel} onClick={onCancel}>
              <ArrowLeft />
            </Button>
            <span className="text-sm font-medium">{title}</span>
          </div>
        )}
        <div data-slot="guardrail-form-layout-body" className="flex-1 min-h-0 overflow-y-auto px-4">
          {children}
        </div>
        <div
          data-slot="guardrail-form-layout-footer"
          className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
        >
          {footerStart && <div className="flex items-center gap-2 mr-auto">{footerStart}</div>}
          <div className="flex justify-end gap-2 ml-auto">{footerButtons('sm')}</div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: `${dialogMaxWidth}px` }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          {footerStart && <div className="flex items-center gap-2 mr-auto">{footerStart}</div>}
          {footerButtons()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
