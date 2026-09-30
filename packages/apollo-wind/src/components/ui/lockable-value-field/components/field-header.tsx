import { Asterisk, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
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
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_ICON_PADDING,
  COLLAPSED_ONLY,
} from '../../field-actions/collapse';
import { InsertVariableAction } from '../../field-actions/insert-variable-action';
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
  // Built together so the entry handed to `onInsertVariable` is the one the
  // consumer supplied, not a reconstruction. Memoized because the picker items
  // were being rebuilt — recursively, with a fresh object per variable and per
  // child — on every render of every row, while the picker was closed.
  const [pickerItems, optionsBySelectionId] = useMemo(() => {
    // Ids come from tree position: neither labels nor values are required to be unique.
    const byId = new Map<string, LockableValueFieldOption>();
    const toItem = (v: LockableValueFieldOption, id: string): VariablePickerItem => {
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
  const collapsedPaddingClass = cn(COLLAPSED_ICON_PADDING, compact && '!px-1.5');
  const compactOnlyClass = cn(COLLAPSED_ONLY, compact && '!block');

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
                          <button
                            type="button"
                            aria-label={strings.fieldTypeAriaLabel}
                            className={cn(
                              'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
                              collapsedPaddingClass
                            )}
                          >
                            <typeMeta.icon size={12} />
                            <span className={collapsedTextClass}>{typeLabel}</span>
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
                      <AiAssistAction
                        onGenerate={onGenerateWithAi}
                        hint={strings.aiOutputHint(
                          strings.aiOutputLabel(typeLabel, typeMeta.supportsExpression)
                        )}
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
