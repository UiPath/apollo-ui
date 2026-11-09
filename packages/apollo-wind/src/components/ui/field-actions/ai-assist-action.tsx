import { Loader2, Sparkles } from 'lucide-react';
import { type ReactNode, useCallback, useId, useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { FIELD_ACTION_CLASS, FIELD_ACTION_TONE_CLASS } from './collapse';

export interface AiAssistActionStrings {
  trigger: string;
  tooltip: string;
  prompt: string;
  promptPlaceholder: string;
  generate: string;
  /** Replaces `generate` while a returned promise is pending, and `tooltip` while `loading`. */
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

/** What a host-rendered AI-assist panel gets in place of the built-in prompt form. */
export interface AiAssistContentProps {
  /** Closes the popover, returning focus to the trigger. */
  close(): void;
  disabled: boolean;
}

export interface AiAssistActionProps {
  /**
   * Called with the entered prompt. Omitted, Generate is disabled; not called while
   * `renderContent` is set. A returned promise keeps the
   * prompt open and busy until it settles: it closes once the promise resolves and stays open,
   * prompt intact and the error shown, if it rejects.
   */
  onGenerate?: (prompt: string) => unknown;
  disabled?: boolean;
  /** A line under the prompt describing what will be generated, such as the value's type. */
  hint?: ReactNode;
  /**
   * The host's own panel, rendered in the popover in place of the built-in prompt form, whose
   * `hint` and prompt strings it then does not use. Called only while the popover is open.
   */
  renderContent?: (props: AiAssistContentProps) => ReactNode;
  /** Controlled open state of the popover, such as for a host that closes it on submit. */
  open?: boolean;
  /** Called when the popover asks to open or close, and from `close`. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Shows the trigger busy for work the host runs, such as a `renderContent` panel's generation.
   * The trigger glows and reads as busy, and still opens, so the panel can show the work in
   * progress.
   */
  loading?: boolean;
  /**
   * Marks the trigger as failed, such as after the host's generation rejected. A message replaces
   * the tooltip and describes the trigger. The host clears it, such as when the panel is dismissed.
   */
  error?: ReactNode;
  /** Classes for the trigger, such as a tone while the popover is open. */
  className?: string;
  /**
   * The trigger's Button size, for a trigger outside a field header such as in a toolbar. Defaults
   * to `3xs`, the height a header row expects, whose icon is 12px; other sizes keep their own icon.
   */
  size?: ButtonProps['size'];
  /** Overrides for any subset of the English strings. */
  strings?: Partial<AiAssistActionStrings>;
}

/**
 * The AI-assist header action: a prompt in a popover. Requires an ancestor `TooltipProvider`.
 */
export function AiAssistAction({
  onGenerate,
  hint,
  renderContent,
  disabled,
  open: openProp,
  onOpenChange,
  loading = false,
  error,
  className,
  size = '3xs',
  strings,
}: AiAssistActionProps) {
  const promptId = useId();
  const errorId = useId();
  const triggerErrorId = useId();
  const [prompt, setPrompt] = useState('');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const text = { ...DEFAULT_AI_ASSIST_ACTION_STRINGS, ...strings };
  const hasError = !!error;
  // `true` marks the trigger without a message.
  const errorMessage = hasError && error !== true ? error : null;

  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );

  const changeOpen = (next: boolean) => {
    setFailed(false);
    setOpen(next);
  };
  const close = useCallback(() => setOpen(false), [setOpen]);

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
        {/* Outermost, so the trigger's `data-state` is the popover's rather than the tooltip's. */}
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={size}
              icon
              aria-label={text.trigger}
              disabled={disabled}
              aria-busy={loading || undefined}
              // Set only with a message, so it does not clear the tooltip's description.
              {...(errorMessage ? { 'aria-describedby': triggerErrorId } : {})}
              className={cn(
                size === '3xs' ? FIELD_ACTION_CLASS : FIELD_ACTION_TONE_CLASS,
                // The ghost variant's Future tone out-ranks an unprefixed one.
                hasError && 'text-error hover:text-error future:text-error future:hover:text-error',
                // The agent color. Its light-theme value is faint on white until it is retuned.
                loading &&
                  'animate-glow cursor-progress [--glow-color:var(--color-gradient-agent-start)]',
                className
              )}
            >
              <Sparkles />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>
          {loading ? text.generating : (errorMessage ?? text.tooltip)}
        </TooltipContent>
      </Tooltip>
      {errorMessage && (
        <span id={triggerErrorId} className="sr-only">
          {errorMessage}
        </span>
      )}
      <PopoverContent align="end" className="space-y-3">
        {renderContent ? (
          <AiAssistSlot render={renderContent} close={close} disabled={!!disabled} />
        ) : (
          <>
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
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Renders the host's panel as an element, so it is called only once the popover mounts it. */
function AiAssistSlot({
  render,
  ...props
}: AiAssistContentProps & { render: (props: AiAssistContentProps) => ReactNode }) {
  return render(props);
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
