import { Asterisk, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label, RequiredIndicator } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { AiAssistAction } from '../../field-actions/ai-assist-action';
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_ICON_PADDING,
  COLLAPSED_ONLY,
} from '../../field-actions/collapse';
import { InsertVariableAction } from '../../field-actions/insert-variable-action';
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
  compact,
  showFieldActions,
  showAiAssist,
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
  compact?: boolean;
  showFieldActions: boolean;
  showAiAssist: boolean;
  value: string;
  onValueChange?: (value: string) => void;
  variables: LockableValueFieldOption[];
  onGenerateWithAi?: (prompt: string) => void;
  headerActions?: ReactNode;
}) {
  const typeMeta = FIELD_TYPE_META[fieldType];
  const collapsedTextClass = cn(COLLAPSED_HIDDEN, compact && '!hidden');
  const collapsedPaddingClass = cn(COLLAPSED_ICON_PADDING, compact && '!px-1.5');
  const compactOnlyClass = cn(COLLAPSED_ONLY, compact && '!block');

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
                {showAiAssist && (
                  <AiAssistAction
                    onGenerate={onGenerateWithAi}
                    hint={`Output: ${typeMeta.label}${typeMeta.supportsExpression ? ' expression' : ' value'}`}
                  />
                )}
                <InsertVariableAction
                  variables={variables}
                  compact={compact}
                  onInsert={
                    onValueChange &&
                    ((variable) => onValueChange(value ? `${value} ${variable}` : variable))
                  }
                />
              </>
            )}
          </div>
          {headerActions}
        </div>
      </TooltipProvider>
    </div>
  );
}
