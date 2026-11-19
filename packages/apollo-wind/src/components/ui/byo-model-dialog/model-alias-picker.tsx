import { Check, ChevronDown, Pencil, Plus } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PortalContainerOverride } from '@/components/ui/portal-container';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib';
import type { ByoModelDialogLabels } from './labels';
import type { ByoReplaceableModel } from './types';

/** The name the model takes: a UiPath model it replaces, or a custom alias. */
export interface ModelAlias {
  kind: 'replacement' | 'custom';
  name: string;
}

interface ModelAliasPickerProps {
  replaceable: ByoReplaceableModel[];
  allowsCustom: boolean;
  value: ModelAlias | null;
  onChange: (alias: ModelAlias) => void;
  disabled?: boolean;
  invalid?: boolean;
  container?: PortalContainerOverride;
  labels: ByoModelDialogLabels;
}

/**
 * One list for the model's name, as in AI Trust Layer: the UiPath models it can replace, and,
 * where the feature takes them, a custom alias typed in place.
 */
export function ModelAliasPicker({
  replaceable,
  allowsCustom,
  value,
  onChange,
  disabled,
  invalid,
  container,
  labels,
}: ModelAliasPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  const custom = value?.kind === 'custom' ? value.name : null;
  const q = query.trim().toLowerCase();
  const shown = replaceable.filter((m) => m.name.toLowerCase().includes(q));
  const customShown = custom?.toLowerCase().includes(q) ?? false;

  const close = () => {
    setOpen(false);
    setQuery('');
    setAdding(false);
    setDraft('');
  };
  const choose = (alias: ModelAlias) => {
    onChange(alias);
    close();
  };
  const startAdding = () => {
    setDraft(custom ?? query.trim());
    setAdding(true);
  };
  const confirmCustom = () => {
    const name = draft.trim();
    if (name) choose({ kind: 'custom', name });
  };

  const placeholder = replaceable.length ? labels.replacementPlaceholder : labels.addCustomAlias;

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={labels.nameStep}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-xs">{value.name}</span>
              {value.kind === 'custom' && (
                <span className="shrink-0 text-xs text-foreground-muted">{labels.useOwnName}</span>
              )}
            </span>
          ) : (
            <span className="truncate text-foreground-muted">{placeholder}</span>
          )}
          <ChevronDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        align="start"
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchRef.current?.focus();
        }}
      >
        {adding ? (
          <div className="flex flex-col gap-2 p-2">
            <Input
              autoFocus
              aria-label={labels.customAliasPlaceholder}
              placeholder={labels.customAliasPlaceholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmCustom();
                } else if (e.key === 'Escape') {
                  // Back to the list rather than closing it.
                  e.preventDefault();
                  e.stopPropagation();
                  setAdding(false);
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="2xs" disabled={!draft.trim()} onClick={confirmCustom}>
                {custom === null ? labels.addAlias : labels.saveAlias}
              </Button>
              <Button size="2xs" variant="ghost" onClick={() => setAdding(false)}>
                {labels.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Command shouldFilter={false}>
            <CommandInput
              ref={searchRef}
              aria-label={labels.nameStep}
              placeholder={labels.aliasSearch}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[280px]">
              <CommandEmpty>{labels.aliasNoMatch(query)}</CommandEmpty>
              {/* First, as in AI Trust Layer, so a long list does not hide it. */}
              {allowsCustom && (custom === null || customShown) && (
                <CommandGroup heading={labels.useOwnName}>
                  {custom !== null ? (
                    <CommandItem
                      value={`custom:${custom}`}
                      onSelect={() => choose({ kind: 'custom', name: custom })}
                      className="gap-2 py-1"
                    >
                      <Selected on />
                      <span className="min-w-0 truncate font-mono text-xs text-foreground">
                        {custom}
                      </span>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="3xs"
                              icon
                              className="ml-auto"
                              aria-label={labels.editCustomAlias}
                              // The row selects the alias; the pencil edits it instead.
                              onPointerDown={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startAdding();
                              }}
                            >
                              <Pencil />
                            </Button>
                          </TooltipTrigger>
                          <TooltipPortal container={container}>
                            <TooltipContent>{labels.editCustomAlias}</TooltipContent>
                          </TooltipPortal>
                        </Tooltip>
                      </TooltipProvider>
                    </CommandItem>
                  ) : (
                    <CommandItem
                      value="custom:add"
                      onSelect={startAdding}
                      className="gap-2 py-1.5 text-foreground-accent"
                    >
                      <Plus size={14} />
                      {labels.addCustomAlias}
                    </CommandItem>
                  )}
                </CommandGroup>
              )}
              {shown.length > 0 && (
                <CommandGroup heading={labels.useReplacement}>
                  {shown.map((m) => (
                    <CommandItem
                      key={m.name}
                      value={`replacement:${m.name}`}
                      onSelect={() => choose({ kind: 'replacement', name: m.name })}
                      className="gap-2 py-1.5"
                    >
                      <Selected on={value?.kind === 'replacement' && value.name === m.name} />
                      <span className="min-w-0 truncate font-mono text-xs text-foreground">
                        {m.name}
                      </span>
                      {m.retiresOn && (
                        <span className="ml-auto shrink-0 pl-2 text-xs text-foreground-muted">
                          {labels.deprecated}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Selected({ on }: { on: boolean }) {
  return (
    <Check size={14} className={cn('shrink-0', on ? 'text-foreground-accent' : 'opacity-0')} />
  );
}
