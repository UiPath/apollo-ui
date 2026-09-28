import { Loader2, Sparkles } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface AiAssistActionStrings {
  trigger: string;
  tooltip: string;
  prompt: string;
  promptPlaceholder: string;
  generate: string;
  /** Replaces `generate` while a returned promise is pending. */
  generating: string;
  /** Shown when a returned promise rejects. */
  error: string;
}

export const DEFAULT_AI_ASSIST_ACTION_STRINGS: AiAssistActionStrings = {
  trigger: 'AI assist',
  tooltip: 'Generate with AI',
  prompt: 'Describe what you want',
  promptPlaceholder: 'Display a value from the previous step',
  generate: 'Generate',
  generating: 'Generating',
  error: 'Could not generate a value. Try again.',
};

export interface AiAssistActionProps {
  /**
   * Called with the entered prompt. Omitted, Generate is disabled. A returned promise keeps the
   * prompt open and busy until it settles: it closes once the promise resolves and stays open,
   * prompt intact and the error shown, if it rejects.
   */
  onGenerate?: (prompt: string) => unknown;
  disabled?: boolean;
  /** A line under the prompt describing what will be generated, such as the value's type. */
  hint?: ReactNode;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<AiAssistActionStrings>;
}

/**
 * The AI-assist header action: a prompt in a popover. Requires an ancestor `TooltipProvider`.
 */
export function AiAssistAction({ onGenerate, hint, disabled, strings }: AiAssistActionProps) {
  const promptId = useId();
  const errorId = useId();
  const [prompt, setPrompt] = useState('');
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const text = { ...DEFAULT_AI_ASSIST_ACTION_STRINGS, ...strings };

  const changeOpen = (next: boolean) => {
    setFailed(false);
    setOpen(next);
  };

  const generate = async () => {
    setFailed(false);
    const result = onGenerate?.(prompt);
    if (!isThenable(result)) return;
    setPending(true);
    try {
      await result;
      setOpen(false);
    } catch {
      // The prompt stays open, intact, so it can be retried.
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Popover open={open && !disabled} onOpenChange={changeOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={text.trigger}
              disabled={disabled}
              className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles size={12} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{text.tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={promptId} className="text-xs font-medium text-foreground-muted">
            {text.prompt}
          </Label>
          <Textarea
            id={promptId}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={text.promptPlaceholder}
            aria-describedby={failed ? errorId : undefined}
            className="resize-none text-sm"
          />
        </div>
        {hint && <span className="block text-[11px] text-foreground-subtle">{hint}</span>}
        {failed && (
          <p id={errorId} role="alert" className="text-xs text-error">
            {text.error}
          </p>
        )}
        <Button
          size="sm"
          className="w-full"
          disabled={!onGenerate || pending}
          aria-busy={pending || undefined}
          onClick={() => generate()}
        >
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? text.generating : text.generate}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
