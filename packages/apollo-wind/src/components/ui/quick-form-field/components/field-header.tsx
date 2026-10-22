import { Asterisk, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormFieldHeader } from '@/components/ui/form-field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import { AiAssistAction } from '../../field-actions/ai-assist-action';
import { COLLAPSED_HIDDEN, COLLAPSED_ONLY, FIELD_ACTION_CLASS } from '../../field-actions/collapse';
import { InsertVariableAction } from '../../field-actions/insert-variable-action';
import type { QuickFieldType, QuickFormFieldOption, QuickFormFieldStrings } from '../types';
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
  disabled,
  isExpression,
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
  fieldType: QuickFieldType;
  /** See QuickFormFieldProps.fieldTypes. */
  fieldTypes?: readonly QuickFieldType[];
  onFieldTypeChange?: (fieldType: QuickFieldType) => void;
  onRequiredChange?: (required: boolean) => void;
  compact?: boolean;
  disabled: boolean;
  /** Whether the AI output is described as an expression rather than a value. */
  isExpression: boolean;
  showFieldActions: boolean;
  onValueChange?: (value: string) => void;
  variables: QuickFormFieldOption[];
  onGenerateWithAi?: (prompt: string) => void;
  /** See QuickFormFieldProps.onInsertVariable. */
  onInsertVariable?: (variable: QuickFormFieldOption) => void;
  /** See QuickFormFieldStrings. */
  strings: QuickFormFieldStrings;
  headerActions?: ReactNode;
}) {
  // Built together so the entry handed to `onInsertVariable` is the one the
  // consumer supplied, not a reconstruction. Memoized because the picker items
  // were being rebuilt — recursively, with a fresh object per variable and per
  // child — on every render of every row, while the picker was closed.
  const [pickerItems, optionsBySelectionId] = useMemo(() => {
    // Ids come from tree position: neither labels nor values are required to be unique.
    const byId = new Map<string, QuickFormFieldOption>();
    const toItem = (v: QuickFormFieldOption, id: string): VariablePickerItem => {
      byId.set(id, v);
      return {
        id,
        label: v.label,
        ...(v.value ? { value: v.value } : {}),
        ...(v.type ? { type: v.type } : {}),
        ...(v.children ? { children: v.children.map((c, i) => toItem(c, `${id}/${i}`)) } : {}),
      };
    };
    return [variables.map((v, i) => toItem(v, String(i))), byId] as const;
  }, [variables]);
  const typeMeta = FIELD_TYPE_META[fieldType];
  const typeLabel = strings.typeLabels[fieldType] ?? typeMeta.label;
  const collapsedTextClass = cn(COLLAPSED_HIDDEN, compact && '!hidden');
  const compactOnlyClass = cn(COLLAPSED_ONLY, compact && '!flex');

  const hasActions =
    !!onFieldTypeChange || !!onRequiredChange || showFieldActions || headerActions != null;
  // A consumer's own label is not wrapped in FormFieldHeader's <label>: it may hold controls of
  // its own. With nothing beside it, the header would render nothing, so it stands alone.
  if (label != null && !hasActions) return <>{label}</>;

  return (
    <TooltipProvider delayDuration={300}>
      <FormFieldHeader
        label={label == null ? fieldLabel : undefined}
        htmlFor={fieldId}
        required={required}
        leading={label}
        actions={
          hasActions ? (
            <>
              <div className="flex items-center gap-0.5">
                {onFieldTypeChange && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="3xs"
                            aria-label={strings.fieldTypeAriaLabel}
                            disabled={disabled}
                            className={cn('gap-1', FIELD_ACTION_CLASS)}
                          >
                            <typeMeta.icon />
                            <span className={collapsedTextClass}>{typeLabel}</span>
                            <ChevronDown className={cn('!size-2.5', collapsedTextClass)} />
                          </Button>
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
                            <meta.icon
                              className={isActive ? 'text-brand' : 'text-foreground-muted'}
                            />
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
                              disabled={disabled}
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="3xs"
                                icon
                                aria-label={
                                  required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                                }
                                disabled={disabled}
                                className={FIELD_ACTION_CLASS}
                              >
                                <Asterisk />
                              </Button>
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
                              disabled={disabled}
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
                      <AiAssistAction
                        onGenerate={onGenerateWithAi}
                        disabled={disabled}
                        hint={strings.aiOutputHint(strings.aiOutputLabel(typeLabel, isExpression))}
                        strings={{
                          trigger: strings.aiAssistAriaLabel,
                          tooltip: strings.aiAssistTooltip,
                          prompt: strings.aiPromptLabel,
                          promptPlaceholder: strings.aiPromptPlaceholder,
                          generate: strings.aiGenerate,
                          generating: strings.aiGenerating,
                          error: strings.aiError,
                        }}
                      />
                    )}
                    <InsertVariableAction
                      // Rendered as supplied, so what the tree shows is what it inserts.
                      variables={pickerItems}
                      compact={compact}
                      disabled={!onValueChange}
                      strings={{
                        label: strings.insertLabel,
                        ariaLabel: strings.insertAriaLabel,
                        searchPlaceholder: strings.insertSearchPlaceholder,
                        empty: strings.insertEmpty,
                      }}
                      // The parent owns the caret, so the header only reports the choice. Hand back
                      // the consumer's own entry: rebuilding it from the picker item would drop `type`.
                      onInsert={
                        onInsertVariable &&
                        ((value, item) =>
                          onInsertVariable(
                            optionsBySelectionId.get(item.id) ?? { label: item.label, value }
                          ))
                      }
                    />
                  </>
                )}
              </div>
              {headerActions}
            </>
          ) : undefined
        }
      />
    </TooltipProvider>
  );
}
