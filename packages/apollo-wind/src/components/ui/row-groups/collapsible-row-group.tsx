import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormFieldError } from '@/components/ui/form-field';
import { cn } from '@/lib';

export interface CollapsibleRowGroupProps {
  /** Counts the items, e.g. "3 conditions". */
  summary: string;
  /** Shown beside the summary while collapsed, so the group stays checkable, e.g. its plain-language reading. */
  detail?: string;
  /** Group-level message. It sits outside the collapsing part, so it is never hidden. */
  error?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A bordered row group whose header collapses its items. */
export function CollapsibleRowGroup({
  summary,
  detail,
  error,
  defaultOpen = true,
  children,
}: CollapsibleRowGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const errorId = React.useId();
  return (
    // min-w-0 so a long collapsed reading truncates instead of widening a grid parent.
    <div className="flex min-w-0 flex-col">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className={cn('rounded-lg border border-border bg-card', error && 'border-error')}
      >
        <CollapsibleTrigger
          aria-describedby={error ? errorId : undefined}
          className="group/trigger flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]/trigger:-rotate-90"
          />
          <span className="shrink-0">{summary}</span>
          {!open && detail && (
            <span className="min-w-0 truncate font-normal text-muted-foreground">{detail}</span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-3">{children}</CollapsibleContent>
      </Collapsible>
      {error && <FormFieldError id={errorId}>{error}</FormFieldError>}
    </div>
  );
}
