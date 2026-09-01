import { ChevronDown } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import type { GuardrailValidatorFormLabels } from '../i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from '../types';
import { ParameterError, ParameterLabel } from './parameter-label';

/** Show chips inline when few enough; otherwise wrap in a popover. */
const MAX_INLINE_OPTIONS = 8;

function EnumListPopover({
  selected,
  optionLabels,
  placeholder,
  children,
  className,
}: {
  selected: string[];
  /** Friendly per-option labels keyed by raw option value; falls back to the raw value */
  optionLabels?: Record<string, string>;
  placeholder: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-9 hover:bg-muted/50 transition-colors',
            className
          )}
        >
          <div className="flex-1 flex flex-wrap gap-1 overflow-hidden max-h-6">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0 text-xs font-medium leading-5"
                >
                  {optionLabels?.[s] ?? s}
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-[var(--radix-popover-trigger-width)]" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export interface EnumListParameterFieldProps {
  paramDef: GuardrailParameterDefinition;
  value: GuardrailValidatorParameter | undefined;
  onChange: (value: unknown) => void;
  error?: string;
  labels: GuardrailValidatorFormLabels;
}

/** Multi-select parameter rendered as toggleable chips. */
export function EnumListParameterField({
  paramDef,
  value,
  onChange,
  error,
  labels,
}: EnumListParameterFieldProps) {
  const selected = useMemo(
    () =>
      (value?.$parameterType === 'enum-list' ? value.value : (paramDef.defaultValue as string[])) ??
      [],
    [value, paramDef.defaultValue]
  );

  const handleToggle = useCallback(
    (option: string, checked: boolean) => {
      const newSelection = checked ? [...selected, option] : selected.filter((s) => s !== option);
      onChange(newSelection);
    },
    [selected, onChange]
  );

  const options = paramDef.options ?? [];
  const showInline = options.length <= MAX_INLINE_OPTIONS;

  /** Friendly label for an option value, falling back to the raw value when unmapped. */
  const labelFor = (option: string) => paramDef.optionLabels?.[option] ?? option;

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option, !isSelected)}
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer',
              isSelected
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-background text-foreground border-border hover:bg-muted'
            )}
          >
            {labelFor(option)}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-2">
      <ParameterLabel paramDef={paramDef} labels={labels} />
      {showInline ? (
        <div
          className={cn(
            'rounded-md border border-input bg-background px-3 py-2',
            error && 'border-destructive'
          )}
        >
          {chips}
        </div>
      ) : (
        <EnumListPopover
          selected={selected}
          optionLabels={paramDef.optionLabels}
          placeholder={labels.enumListPlaceholder}
          className={error ? 'border-destructive' : undefined}
        >
          {chips}
        </EnumListPopover>
      )}
      <ParameterError error={error} />
    </div>
  );
}
