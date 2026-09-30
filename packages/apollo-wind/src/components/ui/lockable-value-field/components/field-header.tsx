import { Asterisk, Braces, ChevronDown, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label, RequiredIndicator } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import { VariablePicker } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import type {
  LockableFieldType,
  LockableValueFieldOption,
  LockableValueFieldStrings,
} from '../types';
import { FIELD_TYPE_META, FIELD_TYPE_ORDER } from '../types';

export function FieldHeader({
  label,
  fieldId,
  fieldLabel,
  required,
  fieldType,
  fieldTypes = FIELD_TYPE_ORDER,
  onFieldTypeChange,
  onRequiredChange,
  compact,
  showFieldActions,
  onValueChange,
  variables,
  onGenerateWithAi,
  onInsertVariable,
  strings,
  headerActions,
}: {
  label?: ReactNode;
  fieldId: string;
  fieldLabel: string;
  required?: boolean;
  fieldType: LockableFieldType;
  /** See LockableValueFieldProps.fieldTypes. */
  fieldTypes?: readonly LockableFieldType[];
  onFieldTypeChange?: (fieldType: LockableFieldType) => void;
  onRequiredChange?: (required: boolean) => void;
  compact?: boolean;
  showFieldActions: boolean;
  onValueChange?: (value: string) => void;
  variables: LockableValueFieldOption[];
  onGenerateWithAi?: (prompt: string) => void;
  /** See LockableValueFieldProps.onInsertVariable. */
  onInsertVariable?: (variable: LockableValueFieldOption) => void;
  /** See LockableValueFieldStrings. */
  strings: LockableValueFieldStrings;
  headerActions?: ReactNode;
}) {
  const promptId = useId();
  const [aiPrompt, setAiPrompt] = useState('');

  // Built together so the entry handed to `onInsertVariable` is the one the
  // consumer supplied, not a reconstruction. Memoized because the picker items
  // were being rebuilt — recursively, with a fresh object per variable and per
  // child — on every render of every row, while the picker was closed.
  const [pickerItems, optionsBySelectionId] = useMemo(() => {
    const byId = new Map<string, LockableValueFieldOption>();
    const toItem = (v: LockableValueFieldOption): VariablePickerItem => {
      const id = v.value || v.label;
      byId.set(id, v);
      return {
        id,
        label: v.label,
        ...(v.value ? { value: v.value } : {}),
        ...(v.type ? { type: v.type } : {}),
        ...(v.children ? { children: v.children.map(toItem) } : {}),
      };
    };
    return [variables.map(toItem), byId] as const;
  }, [variables]);
  const typeMeta = FIELD_TYPE_META[fieldType];
  // 259px is the container width below which these controls no longer fit
  // alongside their text labels, so they collapse to icon-only.
  const collapsedTextClass = cn('@max-[259px]:hidden', compact && '!hidden');
  const collapsedPaddingClass = cn('@max-[259px]:px-1.5', compact && '!px-1.5');
  const compactOnlyClass = cn('hidden @max-[259px]:block', compact && '!block');

  return (
    <div className="flex items-center gap-1">
      {label ?? (
        <Label htmlFor={fieldId} className="text-xs font-medium text-foreground">
          {fieldLabel}
          {required && <RequiredIndicator />}
        </Label>
      )}
      <TooltipProvider delayDuration={300}>
        <div className="ml-auto flex items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            {onFieldTypeChange && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={strings.fieldTypeAriaLabel}
                        className={cn(
                          'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
                          collapsedPaddingClass
                        )}
                      >
                        <typeMeta.icon size={12} />
                        <span className={collapsedTextClass}>
                          {strings.typeLabels[fieldType] ?? typeMeta.label}
                        </span>
                        <ChevronDown size={9} className={collapsedTextClass} />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{strings.fieldTypeTooltip}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-44">
                  {fieldTypes.map((type) => {
                    const meta = FIELD_TYPE_META[type];
                    const isActive = type === fieldType;
                    return (
                      <DropdownMenuItem key={type} onClick={() => onFieldTypeChange(type)}>
                        <meta.icon className={isActive ? 'text-brand' : 'text-foreground-muted'} />
                        <span className={cn(isActive && 'font-medium text-brand')}>
                          {strings.typeLabels[type] ?? meta.label}
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
                          aria-label={
                            required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                          }
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{strings.requiredTooltip}</TooltipContent>
                  </Tooltip>
                </div>
                <div className={compactOnlyClass}>
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={
                              required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                            }
                            className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                          >
                            <Asterisk size={12} />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>{strings.requiredTooltip}</TooltipContent>
                    </Tooltip>
                    <PopoverContent align="end" className="w-48">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-foreground">
                          {strings.requiredTooltip}
                        </span>
                        <Switch
                          size="sm"
                          checked={!!required}
                          onCheckedChange={onRequiredChange}
                          className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                          aria-label={
                            required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                          }
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
            {showFieldActions && (
              <>
                {onGenerateWithAi && (
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={strings.aiAssistAriaLabel}
                            className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                          >
                            <Sparkles size={12} />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>{strings.aiAssistTooltip}</TooltipContent>
                    </Tooltip>
                    <PopoverContent align="end" className="space-y-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={promptId}
                          className="text-xs font-medium text-foreground-muted"
                        >
                          {strings.aiPromptLabel}
                        </Label>
                        <Textarea
                          id={promptId}
                          rows={3}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder={strings.aiPromptPlaceholder}
                          className="resize-none text-sm"
                        />
                      </div>
                      <span className="block text-[11px] text-foreground-subtle">
                        {strings.aiOutputHint(
                          `${strings.typeLabels[fieldType] ?? typeMeta.label}${typeMeta.supportsExpression ? ' expression' : ' value'}`
                        )}
                      </span>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={!onGenerateWithAi}
                        onClick={() => onGenerateWithAi?.(aiPrompt)}
                      >
                        {strings.aiGenerate}
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
                <VariablePicker
                  disabled={variables.length === 0 || !onValueChange}
                  // Rendered as supplied, so what the tree shows is what it inserts.
                  items={pickerItems}
                  onSelect={(variable) => {
                    if (!variable.value) return;
                    // The parent owns the caret, so the header only reports the
                    // choice. Hand back the consumer's own entry: rebuilding it
                    // from the picker item would drop `type`.
                    onInsertVariable?.(
                      optionsBySelectionId.get(variable.id) ?? {
                        label: variable.label,
                        value: variable.value,
                      }
                    );
                  }}
                >
                  <button
                    type="button"
                    aria-label={strings.insertAriaLabel}
                    title={strings.insertAriaLabel}
                    disabled={variables.length === 0 || !onValueChange}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
                      collapsedPaddingClass
                    )}
                  >
                    <Braces size={12} />
                    <span className={collapsedTextClass}>{strings.insertLabel}</span>
                    <ChevronDown size={9} className={collapsedTextClass} />
                  </button>
                </VariablePicker>
              </>
            )}
          </div>
          {headerActions}
        </div>
      </TooltipProvider>
    </div>
  );
}
