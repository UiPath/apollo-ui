import { Circle, CornerRightUp, Mic, Plus, Settings2, Workflow } from 'lucide-react';
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
 * and an accent submit button. Max-width 800px.
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

  const showEnter = value.length > 0;

  return (
    <div className={cn('w-full max-w-[800px] rounded-[32px] bg-surface-raised p-2', className)}>
      <div className="group/input flex flex-col gap-3 rounded-[24px] border border-border bg-surface pb-3 pl-4 pr-3 pt-4 transition-colors hover:border-border-hover focus-within:border-border-hover">
        {/* Text area */}
        <textarea
          className="w-full resize-none bg-transparent text-sm font-normal leading-5 text-foreground placeholder:text-foreground-muted group-hover/input:placeholder:text-foreground-secondary focus:placeholder:text-foreground-secondary focus:outline-none"
          placeholder={placeholder}
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between">
          {/* Left actions — no bg fill in default, show on hover */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Add attachment"
            >
              <Plus className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Add workflow"
            >
              <Workflow className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Settings"
            >
              <Settings2 className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
              aria-label="Record"
            >
              <Circle className="h-5 w-5 text-foreground-muted group-hover:text-foreground-hover" />
            </button>
            {showEnter ? (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground-accent hover:bg-foreground-accent-muted"
                onClick={handleSubmit}
                aria-label="Submit message"
              >
                <CornerRightUp className="h-5 w-5 text-foreground-on-accent" />
              </button>
            ) : (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover group-focus-within/input:bg-foreground-accent hover:bg-foreground-accent-muted"
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5 text-foreground-on-accent" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
