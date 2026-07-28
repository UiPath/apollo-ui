import { Asterisk, Braces, ChevronDown, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import type { LockableFieldType, LockableValueFieldOption } from '../types';
import { FIELD_TYPE_META, FIELD_TYPE_ORDER } from '../types';

export function FieldHeader({
  label,
  fieldId,
  fieldLabel,
  required,
  fieldType,
  onFieldTypeChange,
  onRequiredChange,
  controlsVisibility,
  compact,
  showFieldActions,
  value,
  onValueChange,
  variables,
  onGenerateWithAi,
  headerActions,
}: {
  label?: ReactNode;
  fieldId: string;
  fieldLabel: string;
  required?: boolean;
  fieldType: LockableFieldType;
  onFieldTypeChange?: (fieldType: LockableFieldType) => void;
  onRequiredChange?: (required: boolean) => void;
  controlsVisibility: 'visible' | 'hover';
  compact?: boolean;
  showFieldActions: boolean;
  value: string;
  onValueChange?: (value: string) => void;
  variables: LockableValueFieldOption[];
  onGenerateWithAi?: (prompt: string) => void;
  headerActions?: ReactNode;
}) {
  const promptId = useId();
  const [aiPrompt, setAiPrompt] = useState('');
  const typeMeta = FIELD_TYPE_META[fieldType];
  // 259px is the container width below which these controls no longer fit
  // alongside their text labels, so they collapse to icon-only.
  const collapsedTextClass = cn('@max-[259px]:hidden', compact && '!hidden');
  const collapsedPaddingClass = cn('@max-[259px]:px-1.5', compact && '!px-1.5');
  const compactOnlyClass = cn('hidden @max-[259px]:block', compact && '!block');

  return (
    <div className="flex items-center gap-1">
      {label ?? (
        <Label htmlFor={fieldId} className="text-xs font-medium text-foreground-muted">
          {fieldLabel}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      <TooltipProvider delayDuration={300}>
        <div className="ml-auto flex items-center gap-0.5">
          <div
            className={cn(
              'flex items-center gap-0.5',
              controlsVisibility === 'hover' &&
                'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100'
            )}
          >
            {onFieldTypeChange && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Field type"
                        className={cn(
                          'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
                          collapsedPaddingClass
                        )}
                      >
                        <typeMeta.icon size={12} />
                        <span className={collapsedTextClass}>{typeMeta.label}</span>
                        <ChevronDown size={9} className={collapsedTextClass} />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Type</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-44">
                  {FIELD_TYPE_ORDER.map((type) => {
                    const meta = FIELD_TYPE_META[type];
                    const isActive = type === fieldType;
                    return (
                      <DropdownMenuItem key={type} onClick={() => onFieldTypeChange(type)}>
                        <meta.icon className={isActive ? 'text-brand' : 'text-foreground-muted'} />
                        <span className={cn(isActive && 'font-medium text-brand')}>
                          {meta.label}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onRequiredChange && (
              <>
                <div className={collapsedTextClass}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Wrapped in a span: TooltipTrigger's asChild merge otherwise
                          overwrites the Switch's own data-state (checked/unchecked)
                          with the tooltip's open/closed state, breaking its color classes. */}
                      <span className="inline-flex">
                        <Switch
                          size="sm"
                          checked={!!required}
                          onCheckedChange={onRequiredChange}
                          className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                          aria-label={required ? 'Required field' : 'Optional field'}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Required</TooltipContent>
                  </Tooltip>
                </div>
                <div className={compactOnlyClass}>
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={required ? 'Required field' : 'Optional field'}
                            className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                          >
                            <Asterisk size={12} />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Required</TooltipContent>
                    </Tooltip>
                    <PopoverContent align="end" className="w-48">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-foreground">Required</span>
                        <Switch
                          size="sm"
                          checked={!!required}
                          onCheckedChange={onRequiredChange}
                          className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                          aria-label={required ? 'Required field' : 'Optional field'}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
            {showFieldActions && (
              <>
                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="AI assist"
                          className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                        >
                          <Sparkles size={12} />
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Generate with AI</TooltipContent>
                  </Tooltip>
                  <PopoverContent align="end" className="space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={promptId}
                        className="text-xs font-medium text-foreground-muted"
                      >
                        Describe what you want
                      </Label>
                      <Textarea
                        id={promptId}
                        rows={3}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Display a value from the previous step"
                        className="resize-none text-sm"
                      />
                    </div>
                    <span className="block text-[11px] text-foreground-subtle">
                      Output: {typeMeta.label}
                      {typeMeta.supportsExpression ? ' expression' : ' value'}
                    </span>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!onGenerateWithAi}
                      onClick={() => onGenerateWithAi?.(aiPrompt)}
                    >
                      Generate
                    </Button>
                  </PopoverContent>
                </Popover>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Insert variable"
                          disabled={variables.length === 0 || !onValueChange}
                          className={cn(
                            'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
                            collapsedPaddingClass
                          )}
                        >
                          <Braces size={12} />
                          <span className={collapsedTextClass}>Insert</span>
                          <ChevronDown size={9} className={collapsedTextClass} />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Insert variable</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    {variables.map((variable) => (
                      <DropdownMenuItem
                        key={variable.value}
                        onClick={() =>
                          onValueChange?.(value ? `${value} ${variable.value}` : variable.value)
                        }
                      >
                        {variable.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          {headerActions}
        </div>
      </TooltipProvider>
    </div>
  );
}
