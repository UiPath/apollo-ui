import { CornerDownLeft, Plus, Workflow } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface ChatComposerProps {
  className?: string;
  /** Placeholder text displayed when the input is empty */
  placeholder?: string;
  /** Callback when the user submits a message */
  onSubmit?: (value: string) => void;
}

// ============================================================================
// ChatComposer
// ============================================================================

/**
 * Reusable chat composer input with action buttons.
 *
 * Features a text area, left-side action buttons (add, workflow),
 * and a cyan submit button. Fixed at 800px max-width to match the
 * Delegate design spec.
 */
export function ChatComposer({
  className,
  placeholder = 'I would like you to automate my',
  onSubmit,
}: ChatComposerProps) {
  const [value, setValue] = React.useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit?.(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-[800px] rounded-[32px] bg-gradient-to-b from-surface to-surface-raised p-2',
        className
      )}
    >
      <div className="flex min-h-[124px] flex-col justify-between rounded-3xl border border-border bg-surface-overlay pb-3 pl-4 pr-3 pt-4">
        {/* Text area */}
        <textarea
          className="w-full resize-none bg-transparent text-base font-medium leading-5 text-foreground placeholder:text-foreground-subtle focus:outline-none"
          placeholder={placeholder}
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between">
          {/* Left actions */}
          <div className="flex items-center gap-1">
            <button type="button"
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-border-inverse bg-surface-inverse transition-opacity hover:opacity-80"
              aria-label="Add attachment"
            >
              <Plus className="h-5 w-5 text-foreground-inverse" />
            </button>
            <button type="button"
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-border-inverse bg-surface-inverse transition-opacity hover:opacity-80"
              aria-label="Add workflow"
            >
              <Workflow className="h-5 w-5 text-foreground-inverse" />
            </button>
          </div>

          {/* Submit button */}
          <button type="button"
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand transition-opacity hover:opacity-90"
            onClick={handleSubmit}
            aria-label="Submit message"
          >
            <CornerDownLeft className="h-5 w-5 -scale-y-100 rotate-90 text-foreground-on-accent" />
          </button>
        </div>
      </div>
    </div>
  );
}
