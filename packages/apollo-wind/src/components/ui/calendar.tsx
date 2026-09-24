'use client';

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib';

type DayPickerProps = React.ComponentProps<typeof DayPicker>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CalendarProps = DistributiveOmit<DayPickerProps, 'captionLayout'> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
  /**
   * `drilldown` replaces the caption with month and year buttons that zoom the grid out to a
   * 3 × 4 month grid or a paged 12-year grid. It always shows a single month.
   */
  captionLayout?: DayPickerProps['captionLayout'] | 'drilldown';
  /** `sm` uses 36px day cells, sized for a popover under a field. */
  size?: 'default' | 'sm';
};

const cellSizeClass = {
  default: '[--cell-size:2.75rem]',
  sm: '[--cell-size:2.25rem]',
} as const;

// Seven day cells, each a `--cell-size` button with `px-1` either side, so the month and year
// views fill the same box as the day grid.
const GRID_WIDTH = 'calc((var(--cell-size) + 0.5rem) * 7)';
const GRID_HEIGHT = 'calc(var(--cell-size) * 6 + 0.5rem * 5)';
const YEARS_PER_PAGE = 12;

// The browser locale's first day of the week, so a Calendar reads Monday-first outside the US
// without every consumer passing `weekStartsOn`. Undefined on the server and where
// `Intl.Locale#getWeekInfo` is unsupported, which leaves react-day-picker's Sunday default.
function getBrowserWeekStart(): WeekStart | undefined {
  if (typeof navigator === 'undefined' || typeof Intl.Locale !== 'function') return undefined;
  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    return info ? ((info.firstDay % 7) as WeekStart) : undefined;
  } catch {
    return undefined;
  }
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener('languagechange', onChange);
  return () => window.removeEventListener('languagechange', onChange);
}

function useBrowserWeekStart() {
  return React.useSyncExternalStore(subscribeToLanguage, getBrowserWeekStart, () => undefined);
}

function Calendar({ captionLayout = 'label', ...props }: CalendarProps) {
  if (captionLayout === 'drilldown') {
    return <DrillDownCalendar {...props} />;
  }
  return <BaseCalendar captionLayout={captionLayout} {...props} />;
}

function BaseCalendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  size = 'default',
  formatters,
  components,
  ...props
}: DistributiveOmit<CalendarProps, 'captionLayout'> & {
  captionLayout?: DayPickerProps['captionLayout'];
}) {
  const defaultClassNames = getDefaultClassNames();
  const browserWeekStart = useBrowserWeekStart();
  // A date-fns `locale` carries its own week start, which react-day-picker already honours.
  const weekStartsOn = props.weekStartsOn ?? (props.locale ? undefined : browserWeekStart);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-4 [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        cellSizeClass[size],
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        // A rule between months, so a two-month range reads as two calendars rather than one
        // wide grid. Vertical side by side, horizontal once they stack.
        month: cn(
          'flex w-full flex-col gap-4 border-border-subtle max-md:[.rdp-month+&]:border-t max-md:[.rdp-month+&]:pt-4 md:[.rdp-month+&]:border-l md:[.rdp-month+&]:pl-4',
          defaultClassNames.month
        ),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[var(--cell-size)] w-[var(--cell-size)] select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-[var(--cell-size)] w-[var(--cell-size)] select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex h-[var(--cell-size)] w-full items-center justify-center px-[var(--cell-size)]',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'flex h-[var(--cell-size)] w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          'has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn('bg-popover absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : '[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5',
          defaultClassNames.caption_label
        ),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal',
          defaultClassNames.weekday
        ),
        // No gap between cells: each cell pads its own button instead, so a range's band runs
        // unbroken across the week rather than as a row of separate chips.
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn(
          'w-[var(--cell-size)] select-none',
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          'text-muted-foreground select-none text-[0.8rem]',
          defaultClassNames.week_number
        ),
        day: cn(
          'group/day relative flex-1 select-none px-1 py-0 text-center',
          defaultClassNames.day
        ),
        // The band runs from the centre of the start day to the centre of the end day, so it never
        // shows outside the end buttons. A range that is still one day (only a start picked) is
        // both start and end, so it drops the band and reads as a single selection. Each end's
        // half-band is also dropped where the neighbouring cell is not shown (the edge of a week
        // row, or a day of another month that is hidden), since it would lead nowhere.
        range_start: cn(
          'bg-linear-to-r from-transparent from-50% to-accent to-50%',
          String.raw`[&.rdp-range\_end]:bg-none`,
          'last:bg-none [&:has(+.rdp-hidden)]:bg-none',
          defaultClassNames.range_start
        ),
        range_middle: cn('bg-accent rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'bg-linear-to-l from-transparent from-50% to-accent to-50%',
          String.raw`[&.rdp-range\_start]:bg-none`,
          'first:bg-none [.rdp-hidden+&]:bg-none',
          defaultClassNames.range_end
        ),
        // Today is marked on the day button (an outline), not with a fill here: a fill read the
        // same as hover and as the middle of a range.
        today: defaultClassNames.today,
        outside: defaultClassNames.outside,
        disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
          }

          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
          }

          return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[var(--cell-size)] items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
      weekStartsOn={weekStartsOn}
    />
  );
}

type DrillDownView = 'days' | 'months' | 'years';

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const yearPageStart = (year: number) => Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;

function DrillDownCalendar({
  className,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  startMonth,
  endMonth,
  size = 'default',
  buttonVariant = 'ghost',
  locale,
  classNames,
  ...props
}: DistributiveOmit<CalendarProps, 'captionLayout'>) {
  const [view, setView] = React.useState<DrillDownView>('days');
  const [internalMonth, setInternalMonth] = React.useState(() =>
    startOfMonth(defaultMonth ?? new Date())
  );
  const month = monthProp ? startOfMonth(monthProp) : internalMonth;
  const [pageStart, setPageStart] = React.useState(() => yearPageStart(month.getFullYear()));
  // Set when the reader changes view, so focus follows them into the new grid. Not on mount,
  // so opening a picker leaves focus where DayPicker puts it.
  const moveFocus = React.useRef(false);
  const gridRef = React.useRef<HTMLDivElement>(null);

  const setMonth = (next: Date) => {
    const first = startOfMonth(next);
    if (!monthProp) setInternalMonth(first);
    onMonthChange?.(first);
  };

  const changeView = (next: DrillDownView) => {
    moveFocus.current = true;
    if (next === 'years') setPageStart(yearPageStart(month.getFullYear()));
    setView(next);
  };

  React.useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    // The days view takes focus through DayPicker's `autoFocus` instead.
    if (view !== 'days') {
      // The value in view, or the first enabled cell when bounds disable it.
      const grid = gridRef.current;
      (
        grid?.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not(:disabled)') ??
        grid?.querySelector<HTMLButtonElement>('button:not(:disabled)')
      )?.focus();
    }
  }, [view]);

  const localeCode = locale?.code;
  const monthName = (index: number, form: 'long' | 'short') =>
    new Date(2000, index, 1).toLocaleString(localeCode, { month: form });

  const minIndex = startMonth ? monthIndex(startMonth) : -Infinity;
  const maxIndex = endMonth ? monthIndex(endMonth) : Infinity;
  const minYear = startMonth?.getFullYear() ?? -Infinity;
  const maxYear = endMonth?.getFullYear() ?? Infinity;
  const current = new Date();

  const prevDisabled = view === 'years' ? pageStart <= minYear : monthIndex(month) - 1 < minIndex;
  const nextDisabled =
    view === 'years' ? pageStart + YEARS_PER_PAGE - 1 >= maxYear : monthIndex(month) + 1 > maxIndex;

  const step = (direction: 1 | -1) => {
    if (view === 'years') setPageStart(pageStart + direction * YEARS_PER_PAGE);
    else setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  const navButtonClass = cn(
    buttonVariants({ variant: buttonVariant }),
    'size-[var(--cell-size)] select-none p-0',
    // Months view shows the whole year, so there is nothing to page to.
    view === 'months' && 'invisible'
  );
  const captionButtonClass = cn(
    buttonVariants({ variant: 'ghost' }),
    'h-8 px-2 text-sm font-medium text-foreground future:text-foreground'
  );

  // Arrow keys move through the 3-column month and year grids the way they move through days.
  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -3,
      ArrowDown: 3,
    };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    const cells = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    );
    const index = cells.indexOf(document.activeElement as HTMLButtonElement);
    const next = cells[index + offset];
    if (index === -1 || !next) return;
    event.preventDefault();
    next.focus();
  };

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i);

  return (
    <div
      data-slot="calendar"
      data-caption-layout="drilldown"
      className={cn(
        'bg-background group/calendar w-fit p-4 [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        cellSizeClass[size],
        className
      )}
    >
      <div style={{ width: GRID_WIDTH }}>
        <div className="mb-4 flex h-[var(--cell-size)] items-center justify-between gap-1">
          <button
            type="button"
            className={navButtonClass}
            aria-label={view === 'years' ? 'Previous years' : 'Go to the Previous Month'}
            disabled={prevDisabled}
            onClick={() => step(-1)}
          >
            <ChevronLeftIcon className="size-4 rtl:rotate-180" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={captionButtonClass}
              aria-expanded={view === 'months'}
              onClick={() => changeView(view === 'months' ? 'days' : 'months')}
            >
              {monthName(month.getMonth(), 'long')}
              <span className="sr-only">, choose month</span>
            </button>
            <button
              type="button"
              className={captionButtonClass}
              aria-expanded={view === 'years'}
              onClick={() => changeView(view === 'years' ? 'days' : 'years')}
            >
              {view === 'years' ? `${years[0]} – ${years[years.length - 1]}` : month.getFullYear()}
              <span className="sr-only">, choose year</span>
            </button>
          </div>
          <button
            type="button"
            className={navButtonClass}
            aria-label={view === 'years' ? 'Next years' : 'Go to the Next Month'}
            disabled={nextDisabled}
            onClick={() => step(1)}
          >
            <ChevronRightIcon className="size-4 rtl:rotate-180" />
          </button>
        </div>

        {view === 'days' && (
          <BaseCalendar
            {...props}
            locale={locale}
            size={size}
            buttonVariant={buttonVariant}
            month={month}
            onMonthChange={setMonth}
            startMonth={startMonth}
            endMonth={endMonth}
            numberOfMonths={1}
            hideNavigation
            // Returning from a month or year pick puts focus back on the day grid.
            autoFocus={moveFocus.current || props.autoFocus}
            className="bg-transparent p-0"
            classNames={{ month_caption: 'sr-only', ...classNames }}
          />
        )}

        {view === 'months' && (
          // biome-ignore lint/a11y/useSemanticElements: a <fieldset> is for form controls; this groups a picker's cells under one name
          <div
            ref={gridRef}
            role="group"
            aria-label={`Months of ${month.getFullYear()}`}
            className="grid grid-cols-3 grid-rows-4 gap-2"
            style={{ height: GRID_HEIGHT }}
            onKeyDown={onGridKeyDown}
          >
            {Array.from({ length: 12 }, (_, index) => {
              const candidate = month.getFullYear() * 12 + index;
              return (
                <DrillDownCell
                  key={index}
                  active={index === month.getMonth()}
                  current={
                    index === current.getMonth() && month.getFullYear() === current.getFullYear()
                  }
                  disabled={candidate < minIndex || candidate > maxIndex}
                  aria-label={`${monthName(index, 'long')} ${month.getFullYear()}`}
                  onClick={() => {
                    setMonth(new Date(month.getFullYear(), index, 1));
                    changeView('days');
                  }}
                >
                  {monthName(index, 'short')}
                </DrillDownCell>
              );
            })}
          </div>
        )}

        {view === 'years' && (
          // biome-ignore lint/a11y/useSemanticElements: a <fieldset> is for form controls; this groups a picker's cells under one name
          <div
            ref={gridRef}
            role="group"
            aria-label={`Years ${years[0]} to ${years[years.length - 1]}`}
            className="grid grid-cols-3 grid-rows-4 gap-2"
            style={{ height: GRID_HEIGHT }}
            onKeyDown={onGridKeyDown}
          >
            {years.map((year) => (
              <DrillDownCell
                key={year}
                active={year === month.getFullYear()}
                current={year === current.getFullYear()}
                disabled={year < minYear || year > maxYear}
                onClick={() => {
                  const next = new Date(year, month.getMonth(), 1);
                  const clamped =
                    monthIndex(next) < minIndex && startMonth
                      ? startMonth
                      : monthIndex(next) > maxIndex && endMonth
                        ? endMonth
                        : next;
                  setMonth(clamped);
                  // Having picked a year, the month is the next thing being chosen.
                  changeView('months');
                }}
              >
                {year}
              </DrillDownCell>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DrillDownCell({
  active,
  current,
  className,
  ...props
}: React.ComponentProps<'button'> & { active: boolean; current: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-current={current || undefined}
      className={cn(
        buttonVariants({ variant: active ? 'default' : 'ghost' }),
        'h-full w-full rounded-md px-2 font-normal',
        active
          ? 'font-medium future:text-primary-foreground'
          : 'text-foreground future:text-foreground',
        current && !active && 'border border-foreground-de-emp',
        className
      )}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  // Single days and range ends take the primary fill; the variant is picked here rather than
  // layered over `ghost`, whose future-theme text colour otherwise competes with the fill's.
  const filled = modifiers.selected && !modifiers.range_middle;

  return (
    <Button
      ref={ref}
      variant={filled ? 'default' : 'ghost'}
      icon
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={modifiers.today || undefined}
      data-outside={modifiers.outside || undefined}
      className={cn(
        'flex h-[var(--cell-size)] w-[var(--cell-size)] items-center justify-center rounded-full font-normal leading-none [&>span]:text-xs [&>span]:opacity-70',
        filled ? 'future:text-primary-foreground' : 'text-foreground future:text-foreground',
        modifiers.range_middle && 'rounded-none bg-accent text-accent-foreground',
        modifiers.today && !modifiers.selected && 'border border-foreground-de-emp',
        // Neighbouring months' days are context, not content: dimmed enough to read as a
        // different month even where the theme's muted text sits close to the normal colour.
        modifiers.outside &&
          !modifiers.selected &&
          'text-muted-foreground future:text-muted-foreground opacity-50',
        // Focus is shown by the Button's own `focus-visible` ring, so it appears for keyboard focus
        // only. DayPicker also marks a clicked day `focused`, and ringing that drew a halo round
        // every day picked with the pointer.
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
