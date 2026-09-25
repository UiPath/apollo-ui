import {
  Badge,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  FormField,
  FormFieldError,
  FormFieldLabel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { Check, ChevronDown, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { formatGuardrailFormMessage, type GuardrailRulesLabels } from '../i18n';
import type {
  GuardrailFieldGroup,
  GuardrailFieldReference,
  GuardrailFieldSource,
} from '../rules-types';
import { getGuardrailFieldName, isGuardrailFieldSelected } from '../rules-utils';

export type GuardrailFieldPickerLabels = Pick<
  GuardrailRulesLabels,
  | 'moreInformation'
  | 'selectFields'
  | 'fieldsSelected'
  | 'searchFields'
  | 'noFieldsFound'
  | 'inputGroup'
  | 'outputGroup'
  | 'removeField'
>;

export interface GuardrailFieldPickerProps {
  /** Id of the trigger, which the label points at. */
  id: string;
  labelId: string;
  label: string;
  /** Rendered as an info tooltip beside the label. */
  tooltip?: ReactNode;
  /** What can be picked. */
  fields: GuardrailFieldGroup;
  /** The specific fields currently picked; empty while "All fields" holds. */
  selected: readonly GuardrailFieldReference[];
  onToggle: (field: GuardrailFieldReference) => void;
  /** Adds a leading "All fields" entry; its label also becomes the trigger text while selected. */
  allFields?: { label: string; selected: boolean; onSelect: () => void };
  error?: string;
  labels: GuardrailFieldPickerLabels;
}

// Substring over the title and the path, not cmdk's fuzzy default: a schema path is typed as
// written, and fuzzy matching on it ranks unrelated fields first.
const filterFields = (value: string, search: string, keywords?: string[]) => {
  const needle = search.trim().toLowerCase();
  return (keywords ?? [value]).some((keyword) => keyword.toLowerCase().includes(needle)) ? 1 : 0;
};

function triggerText(
  props: Pick<GuardrailFieldPickerProps, 'fields' | 'selected' | 'allFields' | 'labels'>
): string {
  const { fields, selected, allFields, labels } = props;
  if (allFields?.selected) return allFields.label;
  if (selected.length === 0) return labels.selectFields;
  if (selected.length === 1)
    return getGuardrailFieldName(selected[0] as GuardrailFieldReference, fields);
  return formatGuardrailFormMessage(labels.fieldsSelected, { count: selected.length });
}

/**
 * A multi-select over a tool's input and output fields: a popover with a search, one group per
 * source and, optionally, a leading "All fields" entry, with the picked fields listed under
 * the trigger as removable chips.
 */
export function GuardrailFieldPicker({
  id,
  labelId,
  label,
  tooltip,
  fields,
  selected,
  onToggle,
  allFields,
  error,
  labels,
}: GuardrailFieldPickerProps) {
  const errorId = `${id}-error`;
  const [open, setOpen] = useState(false);

  const renderGroup = (source: GuardrailFieldSource, heading: string) => {
    const options = fields[source];
    if (options.length === 0) return null;
    return (
      <CommandGroup heading={heading}>
        {options.map((field) => {
          const name = field.title || field.path;
          const isSelected = isGuardrailFieldSelected(selected, field);
          return (
            <CommandItem
              key={`${source}:${field.path}`}
              value={`${source}:${field.path}`}
              keywords={[name, field.path]}
              aria-checked={isSelected}
              onSelect={() => onToggle({ ...field, source })}
            >
              <Check className={cn(isSelected ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
              {name === field.path ? (
                <span className="truncate">{name}</span>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate">{name}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[300px]">
                    {field.path}
                  </TooltipContent>
                </Tooltip>
              )}
            </CommandItem>
          );
        })}
      </CommandGroup>
    );
  };

  return (
    <FormField>
      <FormFieldLabel
        id={labelId}
        htmlFor={id}
        required
        tooltip={tooltip}
        tooltipAriaLabel={labels.moreInformation}
      >
        {label}
      </FormFieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {/* Styled as wind's `SelectTrigger`, so it lines up with the selects beside it. */}
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-base transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:hover:bg-surface-hover future:px-4 future:gap-4 future:font-normal aria-invalid:border-error aria-invalid:focus-visible:ring-error future:aria-invalid:ring-1 future:aria-invalid:ring-error/40"
          >
            <span className="truncate">{triggerText({ fields, selected, allFields, labels })}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent aria-labelledby={labelId} className="min-w-[220px] p-0" align="start">
          {/* cmdk names its search input from `label` alone; a placeholder is not a name. */}
          <Command filter={filterFields} label={labels.searchFields}>
            <CommandInput placeholder={labels.searchFields} />
            <CommandList>
              <CommandEmpty>{labels.noFieldsFound}</CommandEmpty>
              {allFields && (
                <CommandItem
                  value="all"
                  keywords={[allFields.label]}
                  aria-checked={allFields.selected}
                  onSelect={allFields.onSelect}
                >
                  <Check
                    className={cn(allFields.selected ? 'opacity-100' : 'opacity-0')}
                    aria-hidden="true"
                  />
                  {allFields.label}
                </CommandItem>
              )}
              {renderGroup('input', labels.inputGroup)}
              {renderGroup('output', labels.outputGroup)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {selected.map((field) => {
            const name = getGuardrailFieldName(field, fields);
            return (
              <li key={`${field.source}:${field.path}`}>
                <Badge
                  variant="secondary"
                  className="gap-1 pr-1"
                  title={name === field.path ? undefined : field.path}
                >
                  {name}
                  <button
                    type="button"
                    aria-label={formatGuardrailFormMessage(labels.removeField, { name })}
                    className="rounded-full hover:bg-muted-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onToggle(field)}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
      <FormFieldError id={errorId}>{error}</FormFieldError>
    </FormField>
  );
}
