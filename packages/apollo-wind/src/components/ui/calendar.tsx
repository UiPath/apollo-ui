'use client';

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib';

type DayPickerProps = React.ComponentProps<typeof DayPicker>;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Accessible names for the drilldown caption's own controls, which DayPicker's labels don't
 * cover. Its `labelPrevious`, `labelNext`, `labelMonthDropdown` and `labelYearDropdown` name the
 * month paging and the month and year buttons.
 */
export type CalendarDrillDownLabels = {
  /** Previous page of the year grid. Defaults to "Previous years". */
  labelPreviousYears?: (firstYear: number, lastYear: number) => string;
  /** Next page of the year grid. Defaults to "Next years". */
  labelNextYears?: (firstYear: number, lastYear: number) => string;
  /** The month grid. Defaults to "Months of 2026". */
  labelMonthsGrid?: (year: number) => string;
  /** The year grid. Defaults to "Years 2016 to 2027". */
  labelYearsGrid?: (firstYear: number, lastYear: number) => string;
};

export type CalendarProps = DistributiveOmit<DayPickerProps, 'captionLayout' | 'labels'> & {
  /** DayPicker's labels, plus the drilldown caption's. */
  labels?: DayPickerProps['labels'] & CalendarDrillDownLabels;
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
        // row, a week number, or a day of another month that is hidden), since it would lead
        // nowhere. A
        // right-to-left calendar lays the week out mirrored, so each half-band flips with it to
        // keep pointing into the range.
        range_start: cn(
          'bg-linear-to-r rtl:bg-linear-to-l from-transparent from-50% to-accent to-50%',
          String.raw`[&.rdp-range\_end]:bg-none`,
          'last:bg-none [&:has(+.rdp-hidden)]:bg-none',
          defaultClassNames.range_start
        ),
        range_middle: cn('bg-accent rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'bg-linear-to-l rtl:bg-linear-to-r from-transparent from-50% to-accent to-50%',
          String.raw`[&.rdp-range\_start]:bg-none`,
          String.raw`first:bg-none [.rdp-hidden+&]:bg-none [.rdp-week\_number+&]:bg-none`,
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
// The first of the month, moved inside `startMonth`/`endMonth` when it falls outside them.
const clampMonth = (date: Date, start?: Date, end?: Date) => {
  if (start && monthIndex(date) < monthIndex(start)) return startOfMonth(start);
  if (end && monthIndex(date) > monthIndex(end)) return startOfMonth(end);
  return startOfMonth(date);
};

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
  dir,
  labels,
  footer,
  hideNavigation,
  id,
  title,
  role,
  lang,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  style,
  styles,
  components,
  ...props
}: DistributiveOmit<CalendarProps, 'captionLayout'>) {
  const [view, setView] = React.useState<DrillDownView>('days');
  // Opens inside the bounds, so a value before `startMonth` doesn't leave the reader paging
  // forward through months they can't pick from.
  const [internalMonth, setInternalMonth] = React.useState(() =>
    clampMonth(defaultMonth ?? new Date(), startMonth, endMonth)
  );
  const month = monthProp ? startOfMonth(monthProp) : internalMonth;
  const [pageStart, setPageStart] = React.useState(() => yearPageStart(month.getFullYear()));
  // New bounds move an uncontrolled month back inside them, with its year page, since the day
  // grid takes `month` as controlled and can't refit it itself.
  const boundsKey = `${startMonth?.getTime()}:${endMonth?.getTime()}`;
  const [clampedBounds, setClampedBounds] = React.useState(boundsKey);
  if (boundsKey !== clampedBounds) {
    setClampedBounds(boundsKey);
    const clamped = clampMonth(internalMonth, startMonth, endMonth);
    if (!monthProp && clamped.getTime() !== internalMonth.getTime()) {
      setInternalMonth(clamped);
      setPageStart(yearPageStart(clamped.getFullYear()));
    }
  }
  // A controlled month moving to another year brings the year page with it. Paging through the
  // years by hand leaves the month alone, so it isn't undone here.
  const controlledYear = monthProp?.getFullYear();
  React.useEffect(() => {
    if (controlledYear !== undefined) setPageStart(yearPageStart(controlledYear));
  }, [controlledYear]);
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
  // Month and year formatted together, so the locale sets their order and numerals.
  const monthYearName = (index: number) =>
    new Date(month.getFullYear(), index, 1).toLocaleString(localeCode, {
      month: 'long',
      year: 'numeric',
    });

  const minIndex = startMonth ? monthIndex(startMonth) : -Infinity;
  const maxIndex = endMonth ? monthIndex(endMonth) : Infinity;
  const minYear = startMonth?.getFullYear() ?? -Infinity;
  const maxYear = endMonth?.getFullYear() ?? Infinity;
  // DayPicker's `today` override, so all three views agree on what is current.
  const current = props.today ?? new Date();

  // `disableNavigation` holds the calendar on its month, so it turns off the arrows and the month
  // and year selectors, the only ways out of it.
  const navigationDisabled = props.disableNavigation ?? false;
  const prevDisabled =
    navigationDisabled ||
    (view === 'years' ? pageStart <= minYear : monthIndex(month) - 1 < minIndex);
  const nextDisabled =
    navigationDisabled ||
    (view === 'years'
      ? pageStart + YEARS_PER_PAGE - 1 >= maxYear
      : monthIndex(month) + 1 > maxIndex);

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
    const step = offsets[event.key];
    if (step === undefined) return;
    // A right-to-left grid runs its columns mirrored, so the horizontal arrows swap to keep
    // moving the way they point. The direction may come from this calendar or a page ancestor.
    const rtl = event.currentTarget.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const offset = rtl && Math.abs(step) === 1 ? -step : step;
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
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const prevLabel =
    view === 'years'
      ? (labels?.labelPreviousYears?.(firstYear - YEARS_PER_PAGE, firstYear - 1) ??
        'Previous years')
      : (labels?.labelPrevious?.(prevDisabled ? undefined : prevMonth) ??
        'Go to the Previous Month');
  const nextLabel =
    view === 'years'
      ? (labels?.labelNextYears?.(lastYear + 1, lastYear + YEARS_PER_PAGE) ?? 'Next years')
      : (labels?.labelNext?.(nextDisabled ? undefined : nextMonth) ?? 'Go to the Next Month');
  // DayPicker renders the footer on its own root, which only the days view mounts, so the
  // drilldown renders it here instead to keep it in every view.
  const Footer = components?.Footer ?? 'div';
  // A custom `components.Root` renders the persistent root, so what it adds stays in every view.
  const { Root = PlainRoot, ...dayComponents } = components ?? {};
  // Root classes and styles given through `classNames` and `styles` belong on the persistent
  // root too, not the day grid's.
  const { root: rootClassName, ...dayClassNames } = classNames ?? {};
  const { root: rootStyle, ...dayStyles } = styles ?? {};
  // The week number column adds one more cell to the day grid's width.
  const gridWidth = props.showWeekNumber
    ? 'calc((var(--cell-size) + 0.5rem) * 7 + var(--cell-size))'
    : GRID_WIDTH;

  return (
    // `dir` goes on this root as well as the day grid's DayPicker, which only reads it there for
    // its own keyboard handling: the caption and the month and year grids sit outside it.
    // DayPicker's root attributes, `style` and `components.Root` go here instead of on the day
    // grid, which unmounts in the month and year views. A name needs a role to apply, so a named
    // calendar is a group.
    <Root
      data-slot="calendar"
      data-caption-layout="drilldown"
      dir={dir}
      id={id}
      title={title}
      lang={lang}
      role={role ?? (ariaLabel || ariaLabelledBy ? 'group' : undefined)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      style={{ ...rootStyle, ...style }}
      className={cn(
        'bg-background group/calendar w-fit p-4 [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        cellSizeClass[size],
        rootClassName,
        className
      )}
    >
      <div style={{ width: gridWidth }}>
        <div
          className={cn(
            'mb-4 flex h-[var(--cell-size)] items-center gap-1',
            hideNavigation ? 'justify-center' : 'justify-between'
          )}
        >
          {!hideNavigation && (
            <button
              type="button"
              className={navButtonClass}
              aria-label={prevLabel}
              disabled={prevDisabled}
              onClick={() => step(-1)}
            >
              <ChevronLeftIcon className="size-4 rtl:rotate-180" />
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={captionButtonClass}
              aria-expanded={view === 'months'}
              disabled={navigationDisabled}
              onClick={() => changeView(view === 'months' ? 'days' : 'months')}
            >
              {monthName(month.getMonth(), 'long')}
              <span className="sr-only">, {labels?.labelMonthDropdown?.() ?? 'choose month'}</span>
            </button>
            <button
              type="button"
              className={captionButtonClass}
              aria-expanded={view === 'years'}
              disabled={navigationDisabled}
              onClick={() => changeView(view === 'years' ? 'days' : 'years')}
            >
              {view === 'years' ? `${firstYear} – ${lastYear}` : month.getFullYear()}
              <span className="sr-only">, {labels?.labelYearDropdown?.() ?? 'choose year'}</span>
            </button>
          </div>
          {!hideNavigation && (
            <button
              type="button"
              className={navButtonClass}
              aria-label={nextLabel}
              disabled={nextDisabled}
              onClick={() => step(1)}
            >
              <ChevronRightIcon className="size-4 rtl:rotate-180" />
            </button>
          )}
        </div>

        {view === 'days' && (
          <BaseCalendar
            {...props}
            locale={locale}
            labels={labels}
            dir={dir}
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
            // DayPicker's own caption stays for screen readers only, since the buttons above
            // replace it on screen. A consumer's `month_caption` classes merge in rather than
            // replace `sr-only`, which would show both captions.
            styles={dayStyles}
            components={dayComponents}
            classNames={{
              ...dayClassNames,
              month_caption: cn(classNames?.month_caption, 'sr-only'),
            }}
          />
        )}

        {view === 'months' && (
          // biome-ignore lint/a11y/useSemanticElements: a <fieldset> is for form controls; this groups a picker's cells under one name
          <div
            ref={gridRef}
            role="group"
            aria-label={
              labels?.labelMonthsGrid?.(month.getFullYear()) ?? `Months of ${month.getFullYear()}`
            }
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
                  aria-label={monthYearName(index)}
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
            aria-label={
              labels?.labelYearsGrid?.(firstYear, lastYear) ?? `Years ${firstYear} to ${lastYear}`
            }
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
                  setMonth(clampMonth(new Date(year, month.getMonth(), 1), startMonth, endMonth));
                  // Having picked a year, the month is the next thing being chosen.
                  changeView('months');
                }}
              >
                {year}
              </DrillDownCell>
            ))}
          </div>
        )}

        {footer && (
          // The same live region DayPicker renders its footer in.
          <Footer
            className={classNames?.footer ?? getDefaultClassNames().footer}
            style={styles?.footer}
            role="status"
            aria-live="polite"
          >
            {footer}
          </Footer>
        )}
      </div>
    </Root>
  );
}

function PlainRoot({
  rootRef,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rootRef?: React.Ref<HTMLDivElement> }) {
  return <div ref={rootRef} {...props} />;
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
      aria-current={current ? 'date' : undefined}
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

export { Calendar, CalendarDayButton, PlainRoot };
