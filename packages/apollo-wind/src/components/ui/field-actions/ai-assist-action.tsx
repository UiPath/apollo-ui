import { Sparkles } from 'lucide-react';
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
}

export const DEFAULT_AI_ASSIST_ACTION_STRINGS: AiAssistActionStrings = {
  trigger: 'AI assist',
  tooltip: 'Generate with AI',
  prompt: 'Describe what you want',
  promptPlaceholder: 'Display a value from the previous step',
  generate: 'Generate',
};

export interface AiAssistActionProps {
  /** Called with the entered prompt. Omitted, Generate is disabled. */
  onGenerate?: (prompt: string) => void;
  /** A line under the prompt describing what will be generated, such as the value's type. */
  hint?: ReactNode;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<AiAssistActionStrings>;
}

/**
 * The AI-assist header action: a prompt in a popover. Requires an ancestor `TooltipProvider`.
 */
export function AiAssistAction({ onGenerate, hint, strings }: AiAssistActionProps) {
  const promptId = useId();
  const [prompt, setPrompt] = useState('');
  const text = { ...DEFAULT_AI_ASSIST_ACTION_STRINGS, ...strings };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={text.trigger}
              className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
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
            className="resize-none text-sm"
          />
        </div>
        {hint && <span className="block text-[11px] text-foreground-subtle">{hint}</span>}
        <Button
          size="sm"
          className="w-full"
          disabled={!onGenerate}
          onClick={() => onGenerate?.(prompt)}
        >
          {text.generate}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
