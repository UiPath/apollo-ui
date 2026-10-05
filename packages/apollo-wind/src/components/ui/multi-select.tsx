import { defaultFilter, useCommandState } from 'cmdk';
import { ChevronsUpDown, Plus, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { InputGroupTrigger } from '@/components/ui/input-group';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/index';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';
import { useVisibleCount } from './use-visible-count';

export interface MultiSelectOption {
  label: string;
  value: string;
  /** Secondary text after the label, such as an email. Searched. */
  description?: string;
  /** Leading glyph for the row. */
  icon?: React.ReactNode;
  /** Extra terms the search matches, for detail the row does not print, such as an ID. */
  keywords?: string[];
}

/**
 * User-facing text MultiSelect renders that has no prop of its own. Pass overrides for any subset
 * through `strings`; anything omitted falls back to `DEFAULT_MULTI_SELECT_STRINGS`.
 */
export interface MultiSelectStrings {
  /** Text of the create row, given the trimmed query. */
  createLabel: (query: string) => string;
  /** Text of the collapsed count, given how many badges it stands for. */
  overflowLabel: (count: number) => string;
  /** Name of a badge's remove control, shown as its tooltip and read as its accessible name. */
  removeLabel: (label: string) => string;
}

export const DEFAULT_MULTI_SELECT_STRINGS: MultiSelectStrings = {
  createLabel: (query) => `Add "${query}"`,
  overflowLabel: (count) => `+${count} more`,
  removeLabel: (label) => `Remove ${label}`,
};

/** Gap between collapsed badges, matching `gap-1`. */
const BADGE_GAP = 4;

/**
 * Command value of every option row, ahead of the option's own value. Rows are told apart by this
 * prefix rather than by their text: an option's text is whatever was typed when it was created, so
 * no sentinel compared with it could be kept from colliding.
 */
const OPTION_VALUE_PREFIX = 'option:';

/** Command value of the create row. Lacking the option prefix, it is never counted as a match. */
const CREATE_VALUE = 'create';

// An option row is scored on the terms it passes as keywords: label, description and its own
// keywords, plus its value when `onCreate` is set (see the row). The prefixed command value stays
// out of the score. The search is trimmed, as the
// exact-match check that rules out the create row trims it, so the two agree on a pasted value.
const filterOptions = (value: string, search: string, keywords?: string[]) =>
  value.startsWith(OPTION_VALUE_PREFIX)
    ? defaultFilter(keywords?.join(' ') ?? '', search.trim())
    : 0;

interface CreateOptionProps {
  query: string;
  disabled: boolean;
  onCreate: (query: string) => void;
  label: string;
}

/**
 * Offers the query last, under the matches: they answer what was typed, and this is the fallback
 * beneath them. Scored 0 by `filterOptions` and force-mounted, so it never counts as a match itself.
 */
function CreateOption({ query, disabled, onCreate, label }: CreateOptionProps) {
  const matchCount = useCommandState((state) => state.filtered.count);
  return (
    // The rule separates it from the matches; with none, the search's own border already does.
    <CommandGroup forceMount className={cn(matchCount > 0 && 'border-t')}>
      <CommandItem
        forceMount
        value={CREATE_VALUE}
        disabled={disabled}
        onSelect={() => {
          if (!disabled) onCreate(query);
        }}
        className={cn(disabled && 'opacity-50 cursor-not-allowed')}
      >
        <Plus className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </CommandItem>
    </CommandGroup>
  );
}

export interface MultiSelectProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  maxSelected?: number;
  disabled?: boolean;
  searchPlaceholder?: string;
  clearAllText?: string | ((count: number) => string);
  /**
   * How the field holds more badges than fit on one line. `wrap` grows the field onto more lines.
   * `collapse` keeps it one line and counts the badges that do not fit as "+N more".
   */
  overflow?: 'wrap' | 'collapse';
  /**
   * Offers the typed search as a new entry after the matches, such as an email that is not in the
   * list. Not offered for an exact match. Called with the trimmed query; add it to `options` and
   * `selected`.
   */
  onCreate?: (query: string) => void;
  /** Overrides for any subset of the English strings: the create row, the count and remove names. */
  strings?: Partial<MultiSelectStrings>;
  /** Called when the multi-select popover closes after being opened. */
  onBlur?: () => void;
  /**
   * Field-specific feedback rendered immediately below the trigger.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      id,
      options,
      selected,
      onChange,
      placeholder = 'Select items...',
      emptyMessage = 'No items found.',
      className,
      maxSelected,
      disabled = false,
      searchPlaceholder = 'Search...',
      clearAllText,
      overflow = 'wrap',
      onCreate,
      strings,
      onBlur,
      error,
      errorId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    },
    ref
  ) => {
    const text = { ...DEFAULT_MULTI_SELECT_STRINGS, ...strings };
    const [open, setOpen] = React.useState(false);
    const collapse = overflow === 'collapse';
    const [query, setQuery] = React.useState('');
    const trimmedQuery = query.trim();
    // An exact match is already on the list, so offering it again would add a duplicate.
    const normalizedQuery = trimmedQuery.toLowerCase();
    const exactMatch = options.some((option) =>
      [option.label, option.value, option.description, ...(option.keywords ?? [])].some(
        (term) => term?.toLowerCase() === normalizedQuery
      )
    );
    const canCreate = onCreate !== undefined && trimmedQuery.length > 0 && !exactMatch;
    const atMax = maxSelected !== undefined && selected.length >= maxSelected;
    // Inside an InputGroup the trigger is the group's control, and the panel anchors to the group's
    // box, so it opens below the box's border and matches its width rather than the inset trigger's.
    const group = useInputGroup();
    const groupAnchor = group.anchor;
    const grouped = group.inGroup;
    const generatedId = React.useId();
    const validationId =
      errorId ?? `${id ?? `multi-select-${generatedId.replace(/:/g, '')}`}-error`;

    const handleUnselect = (value: string) => {
      onChange(selected.filter((s) => s !== value));
    };

    const handleSelect = (value: string) => {
      if (selected.includes(value)) {
        handleUnselect(value);
      } else {
        if (maxSelected && selected.length >= maxSelected) {
          return;
        }
        onChange([...selected, value]);
      }
    };

    const handleClearAll = () => {
      onChange([]);
    };

    // Built once per `options`, not per render: the badges look up every selected value, and a
    // search re-renders on each keystroke.
    const optionByValue = React.useMemo(
      () => new Map(options.map((option) => [option.value, option])),
      [options]
    );
    const { containerRef, itemRefs, overflowRef, visibleCount } = useVisibleCount(
      collapse,
      selected,
      BADGE_GAP
    );
    // One label per count the chip could show: at least one badge always does, so up to one fewer
    // than the selection.
    const overflowLabels = collapse
      ? Array.from({ length: Math.max(0, selected.length - 1) }, (_, i) =>
          text.overflowLabel(i + 1)
        )
      : [];
    const shownCount = collapse ? visibleCount : selected.length;
    const hiddenCount = Math.max(0, selected.length - shownCount);

    const validation = useControlValidation(group, {
      error,
      errorId: validationId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });
    const triggerProps = {
      id,
      role: 'combobox',
      'aria-expanded': open,
      ...validation.aria,
      // aria-label always wins over a `<label htmlFor>` association in the
      // accessible-name computation, so only set it when there's no id for a
      // consumer's label to target -- otherwise the label's own text names
      // the field, same as any other labelable control (Input, Select, ...).
      'aria-label': id
        ? undefined
        : selected.length > 0
          ? `${selected.length} ${selected.length === 1 ? 'item' : 'items'} selected`
          : placeholder,
      disabled: disabled || group.disabled,
    } as const;

    const triggerContent = (
      <>
        {/* In a group, the chips and caret share the enclosing row's first line: one row of chips
            is exactly that line's height, and the caret stays on it as the chips wrap, as the
            shell's own trailing affordance does. */}
        {/* Collapsed, the row is one line that clips: badges past the fit stay mounted, out of flow
            and invisible (which also hides them from assistive technology), so the next measurement
            can still read them. */}
        {/* Its own provider, so the badges' tooltips need nothing from the consumer: Radix throws
            without one, and MultiSelect has never required it. */}
        <TooltipProvider delayDuration={300}>
          <div
            ref={collapse ? containerRef : undefined}
            className={cn(
              'flex gap-1 flex-1',
              collapse ? 'relative min-w-0 flex-nowrap items-center overflow-hidden' : 'flex-wrap',
              grouped && 'min-h-6.5 items-center py-0.5 future:min-h-6 future:py-px'
            )}
          >
            {selected.length === 0 ? (
              <span className="text-foreground-muted">{placeholder}</span>
            ) : (
              selected.map((value, index) => {
                const option = optionByValue.get(value);
                return (
                  <Badge
                    key={value}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    variant="secondary"
                    // The hovered badge takes the field's hover fill, and the field stays at rest
                    // meanwhile (see its hover rule), so the badge under the pointer stands out
                    // instead of matching the field around it.
                    className={cn(
                      'group/badge future:bg-surface-raised future:hover:bg-surface-hover',
                      // Only a lone badge beside the count may shrink: one kept when nothing fits
                      // beside "+N more", which shrinking keeps in view. Every other badge, and this
                      // one while more are shown, keeps its natural width, since that is what the
                      // measurement reads; a badge shrunk mid-measure would make more look like they fit.
                      collapse
                        ? cn(
                            'max-w-full',
                            index === 0 && shownCount === 1 && hiddenCount > 0
                              ? 'min-w-0'
                              : 'shrink-0'
                          )
                        : 'mr-1',
                      index >= shownCount && 'invisible absolute'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  >
                    <span className="truncate">{option?.label}</span>
                    {/* The remove control has a hover of its own, a tint behind the icon, so the
                      exact target is visible inside the lit badge, and a tooltip saying what a
                      click does. Portaled, since a collapsed row clips what overflows it. */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={text.removeLabel(option?.label ?? value)}
                          className="-mr-1 ml-0.5 grid size-4 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 outline-none ring-offset-background transition-colors hover:bg-foreground/15 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUnselect(value);
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground group-hover/badge:text-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent side="top">
                          {text.removeLabel(option?.label ?? value)}
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                  </Badge>
                );
              })
            )}
            {/* Always mounted, so its width is known before anything overflows. It holds every
              count it could show, stacked in one cell with only the current one visible, so its
              width is the widest of them whatever `overflowLabel` returns: a width that changed
              with the count could make the measurement alternate between two fits. It takes no
              pointer events: it is not interactive, so hovering it lights the field as any
              non-badge spot does. */}
            {collapse && selected.length > 0 && (
              <Badge
                ref={overflowRef as React.Ref<HTMLDivElement>}
                variant="outline"
                data-overflow=""
                className={cn(
                  'pointer-events-none shrink-0 border-transparent font-normal text-muted-foreground',
                  hiddenCount === 0 && 'invisible absolute'
                )}
              >
                <span className="grid">
                  {overflowLabels.map((label, i) => (
                    <span
                      key={i}
                      className={cn(
                        'col-start-1 row-start-1',
                        i + 1 !== hiddenCount && 'invisible'
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </span>
              </Badge>
            )}
          </div>
        </TooltipProvider>
        {grouped ? (
          <span className="flex h-6.5 shrink-0 items-center self-start future:h-6">
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        ) : (
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        )}
      </>
    );

    return (
      <div
        ref={ref}
        data-slot="multi-select"
        // In a group, this root is the group's flex item, so it takes the row's free width.
        className={cn('relative', grouped && 'min-w-0 flex-1', className)}
      >
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) setQuery('');
            if (!nextOpen && open) onBlur?.();
          }}
        >
          <PopoverTrigger asChild>
            {grouped ? (
              <InputGroupTrigger
                {...triggerProps}
                className={cn('items-start', selected.length > 0 && !collapse && 'h-auto')}
              >
                {triggerContent}
              </InputGroupTrigger>
            ) : (
              <Button
                variant="outline"
                {...triggerProps}
                className={cn(
                  'w-full justify-between future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:hover:bg-surface-overlay future:[&:hover:not(:has([data-slot=badge]:hover))]:bg-surface-hover future:font-normal future:text-foreground future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
                  selected.length > 0 && !collapse ? 'h-auto min-h-10' : 'h-10'
                )}
              >
                {triggerContent}
              </Button>
            )}
          </PopoverTrigger>
          {/* After the trigger: Radix records the anchor in effects, which run in tree order, so
              an anchor placed first is replaced by the trigger's own. */}
          {groupAnchor && (
            <PopoverAnchor virtualRef={groupAnchor as React.RefObject<HTMLElement>} />
          )}
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command filter={filterOptions}>
              <CommandInput
                placeholder={searchPlaceholder}
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                {/* With a create row there is still something to do, so it stands in for the message. */}
                {!canCreate && <CommandEmpty>{emptyMessage}</CommandEmpty>}
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    const isDisabled =
                      maxSelected !== undefined && selected.length >= maxSelected && !isSelected;

                    return (
                      <CommandItem
                        key={option.value}
                        value={`${OPTION_VALUE_PREFIX}${option.value}`}
                        // The value too, but only with `onCreate`: an exact match on it hides the
                        // create row, so the option it names has to stay findable in its place.
                        // Without a create row nothing hides, and values such as IDs stay out of
                        // the search.
                        keywords={[
                          option.label,
                          ...(option.description ? [option.description] : []),
                          ...(option.keywords ?? []),
                          ...(onCreate ? [option.value] : []),
                        ]}
                        onSelect={() => {
                          if (!isDisabled) {
                            handleSelect(option.value);
                          }
                        }}
                        disabled={isDisabled}
                        className={cn('group', isDisabled && 'opacity-50 cursor-not-allowed')}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="mr-2 pointer-events-none group-hover:border-muted-foreground"
                          tabIndex={-1}
                        />
                        {option.icon && (
                          <span className="mr-2 flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
                            {option.icon}
                          </span>
                        )}
                        {/* The name keeps its width and the description gives way first: the
                            name is what a reader scans for. The wrapper bounds both to the room
                            left after the checkbox and icon, so a long name truncates there. */}
                        <span className="flex min-w-0 flex-1 items-center">
                          <span className="max-w-full shrink-0 truncate">{option.label}</span>
                          {option.description && (
                            <span className="ml-2 min-w-0 truncate text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {canCreate && (
                  <CreateOption
                    query={trimmedQuery}
                    disabled={atMax}
                    onCreate={(value) => {
                      onCreate(value);
                      setQuery('');
                    }}
                    label={text.createLabel(trimmedQuery)}
                  />
                )}
              </CommandList>
            </Command>
            {selected.length > 0 && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={handleClearAll}>
                  {typeof clearAllText === 'function'
                    ? clearAllText(selected.length)
                    : clearAllText || `Clear all (${selected.length})`}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </div>
    );
  }
);
MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
